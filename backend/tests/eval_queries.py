"""
Correctness eval for the procurement agent.

Each case pairs a natural-language question with a "golden" value computed by
running an independent, hand-written aggregation directly against MongoDB
(see the GOLDEN_* functions below) — not by trusting whatever the agent
itself produces. The agent's real HTTP response is then checked against that
independent ground truth, so a pipeline that runs without error but returns
the wrong number is caught, not just a request that 500s.

Run with the backend up:
    python backend/tests/eval_queries.py
"""

import asyncio
import os
import sys

import httpx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from agent.mongo_tools import get_collection  # noqa: E402

BASE_URL = "http://localhost:8000/api"
TOLERANCE_PCT = 1.5  # allow small variation in how the LLM's own pipeline is shaped


def _first_numeric(doc: dict):
    """Mirrors the frontend's ResultChart heuristic: first non-_id numeric field."""
    for k, v in doc.items():
        if k != "_id" and isinstance(v, (int, float)) and not isinstance(v, bool):
            return v
    return None


def _pct_diff(actual: float, expected: float) -> float:
    if expected == 0:
        return 0.0 if actual == 0 else float("inf")
    return abs(actual - expected) / abs(expected) * 100


def _close(actual: float, expected: float, tol_pct: float = TOLERANCE_PCT) -> bool:
    return _pct_diff(actual, expected) <= tol_pct


# --- Golden ground truth, computed independently of the agent -------------

def golden_total_spend_fy():
    coll = get_collection()
    r = list(coll.aggregate([
        {"$match": {"fiscal_year": "2013-2014"}},
        {"$group": {"_id": None, "total_spend": {"$sum": "$total_price"}}},
    ]))
    return r[0]["total_spend"]


def golden_top_departments():
    coll = get_collection()
    return list(coll.aggregate([
        {"$group": {"_id": "$department_name", "total_spend": {"$sum": "$total_price"}}},
        {"$sort": {"total_spend": -1}},
        {"$limit": 5},
    ]))


def golden_top_items():
    coll = get_collection()
    return list(coll.aggregate([
        {"$group": {"_id": "$item_name", "order_count": {"$sum": 1}}},
        {"$sort": {"order_count": -1}},
        {"$limit": 10},
    ]))


def golden_highest_quarter():
    coll = get_collection()
    r = list(coll.aggregate([
        {"$match": {"creation_date": {"$ne": None}}},
        {"$group": {
            "_id": {"year": {"$year": "$creation_date"}, "quarter": {"$ceil": {"$divide": [{"$month": "$creation_date"}, 3]}}},
            "total_spend": {"$sum": "$total_price"},
        }},
        {"$sort": {"total_spend": -1}},
        {"$limit": 1},
    ]))
    return r[0]


def golden_orders_2014_total():
    import datetime
    coll = get_collection()
    r = list(coll.aggregate([
        {"$match": {"creation_date": {"$gte": datetime.datetime(2014, 1, 1), "$lt": datetime.datetime(2015, 1, 1)}}},
        {"$count": "count"},
    ]))
    return r[0]["count"] if r else 0


def golden_it_goods_spend():
    coll = get_collection()
    r = list(coll.aggregate([
        {"$match": {"acquisition_type": "IT Goods"}},
        {"$group": {"_id": None, "total_spend": {"$sum": "$total_price"}}},
    ]))
    return r[0]["total_spend"]


def golden_top_supplier():
    coll = get_collection()
    r = list(coll.aggregate([
        {"$group": {"_id": "$supplier_name", "total_spend": {"$sum": "$total_price"}}},
        {"$sort": {"total_spend": -1}},
        {"$limit": 1},
    ]))
    return r[0]


def golden_by_acquisition():
    coll = get_collection()
    return list(coll.aggregate([
        {"$group": {"_id": "$acquisition_type", "total_spend": {"$sum": "$total_price"}}},
        {"$sort": {"total_spend": -1}},
    ]))


def golden_by_acquisition_fy():
    coll = get_collection()
    return list(coll.aggregate([
        {"$match": {"fiscal_year": "2013-2014"}},
        {"$group": {"_id": "$acquisition_type", "total_spend": {"$sum": "$total_price"}}},
        {"$sort": {"total_spend": -1}},
    ]))


# --- Checkers: compare the agent's actual `results` against golden truth --

def check_single_total(results, golden_value):
    if not results:
        return False, f"expected ~{golden_value:,.2f}, got no results"
    actual = _first_numeric(results[0])
    if actual is None:
        return False, "no numeric field in first result"
    ok = _close(actual, golden_value)
    return ok, f"expected ~{golden_value:,.2f}, got {actual:,.2f} ({_pct_diff(actual, golden_value):.2f}% off)"


def check_top1(results, golden_row):
    if not results:
        return False, f"expected top result '{golden_row['_id']}', got no results"
    top = results[0]
    actual_value = _first_numeric(top)
    name_ok = str(top.get("_id", "")).strip().lower() == str(golden_row["_id"]).strip().lower()
    expected_value = [v for k, v in golden_row.items() if k != "_id"][0]
    value_ok = actual_value is not None and _close(actual_value, expected_value)
    ok = name_ok and value_ok
    return ok, (
        f"expected _id='{golden_row['_id']}' value~{expected_value:,.2f}, "
        f"got _id='{top.get('_id')}' value={actual_value}"
    )


def check_quarter(results, golden_row):
    if not results:
        return False, f"expected {golden_row['_id']}, got no results"
    top = results[0]
    expected_id, expected_value = golden_row["_id"], golden_row["total_spend"]
    actual_id = top.get("_id", {})
    year_ok = int(actual_id.get("year", -1)) == int(expected_id["year"])
    quarter_ok = int(float(actual_id.get("quarter", -1))) == int(expected_id["quarter"])
    value_ok = _close(_first_numeric(top) or -1, expected_value)
    ok = year_ok and quarter_ok and value_ok
    return ok, f"expected {expected_id} value~{expected_value:,.2f}, got {actual_id} value={_first_numeric(top)}"


def check_sum_matches(results, golden_total, tol_pct=TOLERANCE_PCT):
    if not results:
        return False, f"expected rows summing to {golden_total:,}, got no results"
    total = sum(v for row in results for k, v in row.items() if k != "_id" and isinstance(v, (int, float)) and not isinstance(v, bool))
    ok = _close(total, golden_total, tol_pct)
    return ok, f"expected sum~{golden_total:,}, got {total:,} across {len(results)} rows"


# --- Eval cases -------------------------------------------------------------

EVAL_QUERIES = [
    ("total_spend_fy", "What was the total spending in fiscal year 2013-2014?",
     lambda r: check_single_total(r, golden_total_spend_fy())),
    ("top_departments", "Which 5 departments had the highest total spending?",
     lambda r: check_top1(r, golden_top_departments()[0])),
    ("top_items", "What are the top 10 most frequently ordered item names?",
     lambda r: check_top1(r, golden_top_items()[0])),
    ("highest_quarter", "Which quarter had the highest spending overall?",
     lambda r: check_quarter(r, golden_highest_quarter())),
    ("orders_by_month", "How many purchase orders were created each month in 2014?",
     lambda r: check_sum_matches(r, golden_orders_2014_total())),
    ("it_spend", "What is the total spend on IT Goods?",
     lambda r: check_single_total(r, golden_it_goods_spend())),
    ("top_supplier", "Which supplier received the most total spend?",
     lambda r: check_top1(r, golden_top_supplier())),
    ("by_acquisition", "Break down total spending by acquisition type",
     lambda r: check_top1(r, golden_by_acquisition()[0])),
    ("follow_up_filter", "What about the previous breakdown but only for fiscal year 2013-2014?",
     lambda r: check_top1(r, golden_by_acquisition_fy()[0])),
]


async def run_eval():
    session_id = "eval-session-001"
    passed = 0
    failed = 0

    async with httpx.AsyncClient(timeout=120) as client:
        for name, query, check in EVAL_QUERIES:
            print(f"\n[{name}]")
            print(f"Q: {query}")
            try:
                res = await client.post(
                    f"{BASE_URL}/chat",
                    json={"query": query, "session_id": session_id},
                )
                res.raise_for_status()
                data = res.json()
                session_id = data["session_id"]
                results = data.get("results") or []

                print(f"A: {data['answer'][:200]}")
                print(f"   pipeline_stages={len(data.get('pipeline') or [])}, result_rows={len(results)}")

                ok, detail = check(results)
                status = "PASS" if ok else "FAIL"
                print(f"   [{status}] {detail}")
                passed += ok
                failed += not ok
            except Exception as e:
                print(f"   [ERROR] {e}")
                failed += 1

    print(f"\n--- Results: {passed} passed, {failed} failed (out of {len(EVAL_QUERIES)}) ---")
    return failed == 0


if __name__ == "__main__":
    success = asyncio.run(run_eval())
    sys.exit(0 if success else 1)
