import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv()

from agent.nodes import (
    generate_pipeline_node,
    execute_query_node,
    formulate_response_node,
)

QUERIES = [
    "Which 5 departments had the highest total spending?",
    "What are the top 10 most frequently ordered items?",
    "hey, how are you?",
]


def bench(query):
    state = {
        "messages": [],
        "user_query": query,
        "generated_pipeline": None,
        "query_results": None,
        "final_answer": None,
        "follow_ups": None,
        "error": None,
    }

    t0 = time.perf_counter()
    state = generate_pipeline_node(state)
    t1 = time.perf_counter()
    state = execute_query_node(state)
    t2 = time.perf_counter()
    state = formulate_response_node(state)
    t3 = time.perf_counter()

    print(f"\nQ: {query}")
    print(f"  pipeline gen : {t1 - t0:6.2f}s")
    print(f"  mongo exec   : {t2 - t1:6.2f}s")
    print(f"  answer+chips : {t3 - t2:6.2f}s")
    print(f"  TOTAL        : {t3 - t0:6.2f}s")
    print(f"  follow_ups   : {len(state.get('follow_ups') or [])}")


if __name__ == "__main__":
    for q in QUERIES:
        bench(q)
