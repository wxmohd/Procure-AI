import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGO_DB_NAME", "procureiq")
COLLECTION_NAME = os.getenv("MONGO_COLLECTION_NAME", "purchase_orders")

client = MongoClient(MONGO_URI)
collection = client[DB_NAME][COLLECTION_NAME]

count = collection.estimated_document_count()
print(f"Document count: {count}")

if count > 0:
    sample = collection.find_one()
    print(f"\nSample document fields: {list(sample.keys())}")
    print(f"\nSample document:")
    for k, v in sample.items():
        print(f"  {k}: {v}")
else:
    print("Collection is empty!")
