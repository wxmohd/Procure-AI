import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv()

from agent.streaming import stream_agent

QUERIES = [
    "Which 5 departments had the highest total spending?",
    "hey, how are you?",
]


def bench(query):
    t0 = time.perf_counter()
    first_token = None
    events = []
    chars = 0

    for event, data in stream_agent([], query):
        if event == "token":
            if first_token is None:
                first_token = time.perf_counter() - t0
            chars += len(data)
        else:
            events.append(event)

    total = time.perf_counter() - t0
    print(f"\nQ: {query}")
    print(f"  first token : {first_token:6.2f}s")
    print(f"  full answer : {total:6.2f}s  ({chars} chars)")
    print(f"  events      : {events}")


if __name__ == "__main__":
    for q in QUERIES:
        bench(q)
