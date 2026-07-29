import asyncio
import httpx

BASE_URL = "http://localhost:8000/api"

EVAL_QUERIES = [
    ("total_spend_fy", "What was the total spending in fiscal year 2013-2014?"),
    ("top_departments", "Which 5 departments had the highest total spending?"),
    ("top_items", "What are the top 10 most frequently ordered item names?"),
    ("highest_quarter", "Which quarter had the highest spending overall?"),
    ("orders_by_month", "How many purchase orders were created each month in 2014?"),
    ("it_spend", "What is the total spend on IT Goods?"),
    ("top_supplier", "Which supplier received the most total spend?"),
    ("by_acquisition", "Break down total spending by acquisition type"),
    ("follow_up_filter", "What about the previous breakdown but only for fiscal year 2013-2014?"),
]


async def run_eval():
    session_id = "eval-session-001"
    passed = 0
    failed = 0

    async with httpx.AsyncClient(timeout=120) as client:
        for name, query in EVAL_QUERIES:
            print(f"\n[{name}]")
            print(f"Q: {query}")
            try:
                res = await client.post(
                    f"{BASE_URL}/chat",
                    json={"query": query, "session_id": session_id},
                )
                res.raise_for_status()
                data = res.json()
                print(f"A: {data['answer'][:300]}")
                print(f"   pipeline_stages={len(data.get('pipeline') or [])}, result_rows={len(data.get('results') or [])}")
                session_id = data["session_id"]
                passed += 1
            except Exception as e:
                print(f"ERROR: {e}")
                failed += 1

    print(f"\n--- Results: {passed} passed, {failed} failed ---")


if __name__ == "__main__":
    asyncio.run(run_eval())
