import json
import os
from concurrent.futures import ThreadPoolExecutor
from anthropic import Anthropic
from agent.state import AgentState
from agent.prompts import (
    SYSTEM_PROMPT,
    RESPONSE_FORMULATION_PROMPT,
    CONVERSATIONAL_PROMPT,
    FOLLOW_UP_PROMPT,
)
from agent.mongo_tools import execute_pipeline

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-6"
FAST_MODEL = "claude-haiku-4-5-20251001"

GENERIC_FOLLOW_UPS = [
    "Which 5 departments had the highest total spending?",
    "What are the top 10 most frequently ordered items?",
    "Which quarter had the highest spending overall?",
]


def _history_text(state: AgentState, turns: int = 6) -> str:
    text = ""
    for m in state["messages"][-turns:]:
        role = "User" if m.type == "human" else "Assistant"
        text += f"{role}: {m.content}\n"
    return text


def _complete(prompt: str, max_tokens: int, model: str = MODEL) -> str:
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text.strip()


def _follow_ups(user_query: str, results: list) -> list:
    prompt = FOLLOW_UP_PROMPT.format(
        question=user_query,
        results=json.dumps(results[:5], default=str),
    )
    try:
        raw = _complete(prompt, 200, FAST_MODEL).replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)
        return [str(q) for q in parsed][:3] or GENERIC_FOLLOW_UPS
    except Exception:
        return GENERIC_FOLLOW_UPS


def generate_pipeline_node(state: AgentState) -> AgentState:

    prompt = f"{_history_text(state)}\nUser: {state['user_query']}\n\nGenerate the MongoDB pipeline:"

    try:
        response = client.messages.create(
            model=FAST_MODEL,
            max_tokens=600,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        pipeline = json.loads(raw)
        return {**state, "generated_pipeline": pipeline or None, "error": None}
    except json.JSONDecodeError:
        return {**state, "generated_pipeline": None, "error": None}
    except Exception:
        return {**state, "generated_pipeline": None, "error": "Failed to generate a valid query"}


def route_after_pipeline(state: AgentState) -> str:
    if state.get("error"):
        return "formulate_response"
    if not state.get("generated_pipeline"):
        return "converse"
    return "execute_query"


def converse_node(state: AgentState) -> AgentState:
    prompt = CONVERSATIONAL_PROMPT.format(
        history=_history_text(state) or "(start of conversation)",
        question=state["user_query"],
    )

    try:
        answer = _complete(prompt, 500, FAST_MODEL)
    except Exception:
        answer = (
            "I'm here and ready to help. Ask me anything about California State "
            "procurement — spending by department, top suppliers, or ordering trends."
        )

    return {**state, "final_answer": answer, "follow_ups": GENERIC_FOLLOW_UPS}


def execute_query_node(state: AgentState) -> AgentState:

    if state.get("error") or not state.get("generated_pipeline"):
        return state

    try:
        results = execute_pipeline(state["generated_pipeline"])
        return {**state, "query_results": results}
    except Exception:
        return {**state, "error": "Failed to execute the query"}


def formulate_response_node(state: AgentState) -> AgentState:
    if state.get("error"):
        return {
            **state,
            "final_answer": "Sorry, I ran into an issue answering that. Could you try rephrasing?",
            "follow_ups": GENERIC_FOLLOW_UPS,
        }

    results = state.get("query_results") or []
    if not results:
        return {
            **state,
            "final_answer": (
                "I ran that query but the data came back empty. That usually means the filter was too "
                "narrow — try widening the time range or asking about a different department or item."
            ),
            "follow_ups": GENERIC_FOLLOW_UPS,
        }

    prompt = RESPONSE_FORMULATION_PROMPT.format(
        question=state["user_query"],
        results=json.dumps(results[:20], default=str),
    )

    with ThreadPoolExecutor(max_workers=2) as pool:
        answer_future = pool.submit(_complete, prompt, 900, FAST_MODEL)
        follow_ups_future = pool.submit(_follow_ups, state["user_query"], results)
        answer = answer_future.result()
        follow_ups = follow_ups_future.result()

    return {**state, "final_answer": answer, "follow_ups": follow_ups}