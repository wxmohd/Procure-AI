"""
Tool for executing generated MongoDB pipelines against the procurement collection.
"""

import os
import json
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGO_DB_NAME", "procureiq")
COLLECTION_NAME = os.getenv("MONGO_COLLECTION_NAME", "purchase_orders")

_client = None


def get_collection():
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
    return _client[DB_NAME][COLLECTION_NAME]


def execute_pipeline(pipeline: list, max_results: int = 50) -> list:
    """
    Executes a MongoDB aggregation pipeline and returns results as a list of dicts.
    Caps results to avoid dumping huge result sets into the LLM context.
    """
    if not pipeline:
        return []

    collection = get_collection()
    try:
        cursor = collection.aggregate(pipeline)
        results = list(cursor)[:max_results]

        # ObjectId and datetime aren't JSON serializable by default — clean for downstream use
        for doc in results:
            doc.pop("_id", None) if "_id" in doc and not isinstance(doc.get("_id"), (str, int, dict)) else None
            for k, v in doc.items():
                if hasattr(v, "isoformat"):
                    doc[k] = v.isoformat()

        return results
    except Exception as e:
        raise RuntimeError(f"Pipeline execution failed: {e}")