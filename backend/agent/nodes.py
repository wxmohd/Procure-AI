import json
import os
from anthropic import Anthropic
from agent.state import AgentState
from agent.prompts import SYSTEM_PROMPT, RESPONSE_FORMULATION_PROMPT
from agent.mongo_tools import execute_pipeline

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-6"


def generate_pipeline_node(state: AgentState) -> AgentState:

    history_text = ""
    for m in state["messages"][-6:]:  # last few turns for follow-up context
        role = "User" if m.type == "human" else "Assistant"
        history_text += f"{role}: {m.content}\n"

    prompt = f"{history_text}\nUser: {state['user_query']}\n\nGenerate the MongoDB pipeline:"

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        pipeline = json.loads(raw)
        return {**state, "generated_pipeline": pipeline, "error": None}
    except json.JSONDecodeError as e:
        return {**state, "generated_pipeline": None, "error": f"Failed to parse pipeline: {e}"}
    except Exception as e:
        return {**state, "generated_pipeline": None, "error": f"Pipeline generation failed: {e}"}


def execute_query_node(state: AgentState) -> AgentState:

    if state.get("error") or not state.get("generated_pipeline"):
        return state

    try:
        results = execute_pipeline(state["generated_pipeline"])
        return {**state, "query_results": results}
    except Exception as e:
        return {**state, "error": f"Query execution failed: {e}"}


def formulate_response_node(state: AgentState) -> AgentState:
    if state.get("error"):
        return {**state, "final_answer": f"Sorry, I ran into an issue: {state['error']}"}

    prompt = RESPONSE_FORMULATION_PROMPT.format(
        question=state["user_query"],
        results=json.dumps(state.get("query_results", [])[:20], default=str),
    )

    response = client.messages.create(
        model=MODEL,
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )

    return {**state, "final_answer": response.content[0].text.strip()}


def generate_follow_ups_node(state: AgentState) -> AgentState:
    if state.get("error") or not state.get("final_answer"):
        return {**state, "follow_ups": []}

    prompt = (
        f'Given this procurement question: "{state["user_query"]}"\n'
        f'And this answer: "{state["final_answer"]}"\n\n'
        'Generate exactly 3 short follow-up questions a procurement analyst might ask next.\n'
        'Output only a JSON array of 3 strings, no explanation, no markdown.'
    )

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip().replace("```json", "").replace("```", "").strip()
        follow_ups = json.loads(raw)
        return {**state, "follow_ups": follow_ups[:3]}
    except Exception:
        return {**state, "follow_ups": []}