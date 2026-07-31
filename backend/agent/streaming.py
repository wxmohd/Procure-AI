import json
from concurrent.futures import ThreadPoolExecutor
from typing import Iterator, Tuple

from agent.nodes import (
    FAST_MODEL,
    GENERIC_FOLLOW_UPS,
    _follow_ups,
    _history_text,
    client,
    execute_query_node,
    generate_pipeline_node,
    route_after_pipeline,
)
from agent.prompts import CONVERSATIONAL_PROMPT, RESPONSE_FORMULATION_PROMPT

Event = Tuple[str, object]


def _stream_tokens(prompt: str, max_tokens: int, model: str) -> Iterator[Event]:
    with client.messages.stream(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield ("token", text)


def stream_agent(messages: list, user_query: str) -> Iterator[Event]:
    state = {
        "messages": messages,
        "user_query": user_query,
        "generated_pipeline": None,
        "query_results": None,
        "final_answer": None,
        "follow_ups": None,
        "error": None,
    }

    state = generate_pipeline_node(state)
    route = route_after_pipeline(state)

    if route == "converse":
        prompt = CONVERSATIONAL_PROMPT.format(
            history=_history_text(state) or "(start of conversation)",
            question=user_query,
        )
        try:
            yield from _stream_tokens(prompt, 500, FAST_MODEL)
        except Exception:
            yield ("token", "I'm here and ready to help. Ask me anything about California State procurement.")
        yield ("follow_ups", GENERIC_FOLLOW_UPS)
        return

    if route == "formulate_response":
        yield ("token", "Sorry, I ran into an issue answering that. Could you try rephrasing?")
        yield ("follow_ups", GENERIC_FOLLOW_UPS)
        return

    yield ("pipeline", state["generated_pipeline"])

    state = execute_query_node(state)

    if state.get("error"):
        yield ("token", "Sorry, I ran into an issue answering that. Could you try rephrasing?")
        yield ("follow_ups", GENERIC_FOLLOW_UPS)
        return

    results = state.get("query_results") or []
    if not results:
        yield (
            "token",
            "I ran that query but the data came back empty. That usually means the filter was too "
            "narrow — try widening the time range or asking about a different department or item.",
        )
        yield ("follow_ups", GENERIC_FOLLOW_UPS)
        return

    yield ("results", results)

    prompt = RESPONSE_FORMULATION_PROMPT.format(
        question=user_query,
        results=json.dumps(results[:20], default=str),
    )

    with ThreadPoolExecutor(max_workers=1) as pool:
        follow_ups_future = pool.submit(_follow_ups, user_query, results)
        try:
            yield from _stream_tokens(prompt, 900, FAST_MODEL)
        except Exception:
            yield ("token", "Sorry, I ran into an issue writing that answer. Could you try again?")
        yield ("follow_ups", follow_ups_future.result())
