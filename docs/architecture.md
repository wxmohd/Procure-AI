# Architecture

## Overview

ProcureAI answers natural-language questions about a 346,018-row California
State procurement dataset. A FastAPI backend runs a LangGraph agent that
turns each question into a MongoDB aggregation pipeline, executes it, and
writes the final answer from the real results — the LLM never answers from
memory, only from data it just queried.

```
React frontend  ──HTTP/SSE──▶  FastAPI (backend/main.py)
                                      │
                                 /api/chat, /api/chat/stream
                                      │
                              LangGraph agent (backend/agent/graph.py)
                                      │
                              MongoDB (backend/agent/mongo_tools.py)
```

## Data layer

`backend/data/load_to_mongo.py` loads the Kaggle CSV into MongoDB:
normalizes column names, drops columns not needed for query generation
(commodity/classification codes, a few sparse identifier fields — see
`schema_notes.md` for the full list and why), coerces date/numeric types,
batch-inserts into `procureiq.purchase_orders`, and indexes date/department/
supplier fields. `schema_notes.md` documents the resulting schema and is
kept in sync with `agent/prompts.py`'s `SCHEMA_DESCRIPTION` — the LLM is
only ever told about fields that actually exist in Mongo, so it can't
generate a pipeline against a column that was dropped at load time.

## The agent graph

`backend/agent/graph.py` builds a `LangGraph` `StateGraph` over `AgentState`
(`backend/agent/state.py` — conversation history, the user's query, the
generated pipeline, query results, final answer, follow-ups, and an error
slot). Four nodes, defined in `backend/agent/nodes.py`:

1. **`generate_pipeline`** — sends the user's question plus recent
   conversation history to Claude with a system prompt (`SYSTEM_PROMPT` in
   `agent/prompts.py`) that describes the schema and gives few-shot examples
   for the query shapes the assessment calls out specifically: total spend
   over a period, quarter with highest spending, most frequently ordered
   items, and department breakdowns as follow-ups. The model returns a raw
   JSON MongoDB aggregation pipeline (no markdown fences).
2. **`execute_query`** — runs that pipeline against MongoDB
   (`agent/mongo_tools.py`), capped at 50 documents so the result set stays
   small enough to feed back into an LLM call.
3. **`formulate_response`** — sends the top 20 results back to Claude
   (`RESPONSE_FORMULATION_PROMPT`) to write a natural-language answer with
   markdown tables/headers/bold where useful, and in parallel (via
   `ThreadPoolExecutor`) asks for three follow-up question suggestions.
4. **`converse`** — a side branch for messages that aren't data questions
   (greetings, "what can you do", off-topic chat). The pipeline-generation
   node is instructed to output `[]` for these, and a conditional edge
   (`route_after_pipeline`) routes to `converse` instead of hitting Mongo at
   all.

Edges: `generate_pipeline` conditionally routes to `execute_query`,
`converse`, or straight to `formulate_response` (on a generation error);
`execute_query → formulate_response → END`; `converse → END`.

## Streaming

`backend/agent/streaming.py` drives the same four-step sequence but yields
`(event, data)` tuples — `pipeline`, `results`, `token` (per chunk of the
answer as Claude streams it), `follow_ups` — so the frontend can render the
generated query, the chart, and the typed-out answer as they arrive rather
than waiting for the whole turn to finish. It calls the same node functions
as `graph.py` rather than going through LangGraph's own streaming API, so it
intentionally mirrors the graph's control flow by hand to get token-level
SSE output; any change to the node sequence in `graph.py` should be mirrored
here.

## Conversation memory

`backend/api/routes.py` keeps an in-memory `dict[session_id, list[Message]]`
(last 20 turns), passed into the agent as `AgentState["messages"]` on every
call. This is how follow-up questions like "what about just IT purchases"
get resolved — `SYSTEM_PROMPT` explicitly instructs the model to reuse
constraints from the previous turn's pipeline when the new question is a
follow-up. This store is process-local (a plain dict, not Redis/Mongo), so
it resets on restart and wouldn't survive a multi-worker deployment — an
acceptable tradeoff for a prototype, called out here for transparency.

## API surface

- `POST /api/chat` — non-streaming, returns `{answer, pipeline, results,
  follow_ups, session_id}` in one response.
- `POST /api/chat/stream` — Server-Sent Events version of the same flow.

Both accept `{query, session_id}`; `session_id` is generated server-side on
the first turn and echoed back for the client to reuse.

## Why LangGraph

The four-step flow (generate → execute → respond, with a conversational
bypass) is a small, mostly-linear pipeline, but LangGraph's explicit state
graph makes each step's inputs/outputs typed and inspectable (`AgentState`),
makes the conditional routing (data question vs. small talk vs. error) a
first-class edge rather than nested `if`s, and gives a natural seam for
adding steps later (e.g. a validation or retry node) without restructuring
the whole call chain.
