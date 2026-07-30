"""
Loads the California State procurement CSV into MongoDB.
Run: python backend/data/load_to_mongo.py
"""

import os
import sys
import pandas as pd
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "procureiq")
COLLECTION_NAME = os.getenv("MONGO_COLLECTION_NAME", "purchase_orders")
CSV_PATH = os.getenv("CSV_PATH", "backend/data/raw/purchase_orders.csv")
BATCH_SIZE = 5000


def clean_column_name(col: str) -> str:
    """Normalize column names: lowercase, underscores, no special chars."""
    return (
        col.strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("/", "_")
        .replace("(", "")
        .replace(")", "")
    )


def load_csv(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        print(f"CSV not found at {path}. Download it from Kaggle and place it there.")
        sys.exit(1)

    print(f"Reading {path} ...")
    df = pd.read_csv(path, low_memory=False)
    df.columns = [clean_column_name(c) for c in df.columns]
    print(f"Loaded {len(df):,} rows, {len(df.columns)} columns")
    return df


DROP_COLUMNS = {
    "lpa_number",
    "sub_acquisition_type",
    "sub_acquisition_method",
    "calcard",
    "item_commodity_code",
    "normalized_unspsc",
    "commodity_title",
    "class",
    "class_title",
    "family",
    "family_title",
    "segment",
    "segment_title",
    "location",
    "supplier_qualifications",
    "requisition_number",
    "supplier_zip_code",
    "supplier_code",
    "classification_codes",
    "purchase_date",
}


TEXT_TRUNCATE = {"item_description": 120, "item_name": 80}


def trim_columns(df: pd.DataFrame) -> pd.DataFrame:
    to_drop = [c for c in df.columns if c in DROP_COLUMNS]
    df = df.drop(columns=to_drop)
    for col, limit in TEXT_TRUNCATE.items():
        if col in df.columns:
            df[col] = df[col].astype(str).str[:limit]
    print(f"Kept {len(df.columns)} columns after trimming: {list(df.columns)}")
    return df


def coerce_types(df: pd.DataFrame) -> pd.DataFrame:
    """Best-effort type coercion so Mongo stores usable types, not just strings."""
    for col in df.columns:
        if "date" in col:
            df[col] = pd.to_datetime(df[col], errors="coerce")

    for col in df.columns:
        if any(k in col for k in ["amount", "price", "cost", "total", "quantity", "qty"]):
            df[col] = pd.to_numeric(
                df[col].astype(str).str.replace(r"[$,]", "", regex=True),
                errors="coerce",
            )

    return df


def print_schema_summary(df: pd.DataFrame):
    """Prints a quick schema overview — paste relevant bits into schema_notes.md."""
    print("\n--- SCHEMA SUMMARY ---")
    for col in df.columns:
        dtype = df[col].dtype
        n_unique = df[col].nunique(dropna=True)
        n_null = df[col].isna().sum()
        sample = df[col].dropna().iloc[0] if df[col].notna().any() else None
        print(f"{col:30s} | {str(dtype):12s} | unique={n_unique:<8} | nulls={n_null:<8} | sample={sample}")
    print("----------------------\n")


def load_to_mongo(df: pd.DataFrame):
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    existing = collection.estimated_document_count()
    if existing > 0:
        confirm = input(f"Collection already has {existing:,} docs. Drop and reload? [y/N]: ")
        if confirm.lower() == "y":
            collection.drop()
        else:
            print("Aborting load.")
            sys.exit(0)

    # Convert NaT/NaN to None so BSON can serialize them.
    # Without this, pandas' NaT (missing datetime) crashes pymongo's insert_many
    # with "NaTType does not support utcoffset".
    df = df.astype(object).where(pd.notnull(df), None)

    records = df.to_dict(orient="records")
    total = len(records)
    print(f"Inserting {total:,} documents in batches of {BATCH_SIZE}...")

    for i in range(0, total, BATCH_SIZE):
        batch = records[i : i + BATCH_SIZE]
        collection.insert_many(batch)
        print(f"  inserted {min(i + BATCH_SIZE, total):,} / {total:,}")

    print("Creating indexes...")
    date_cols = [c for c in df.columns if "date" in c]
    for col in date_cols:
        collection.create_index([(col, ASCENDING)])
        print(f"  indexed {col}")

    dept_like = [c for c in df.columns if "department" in c or "supplier" in c or "vendor" in c]
    for col in dept_like:
        collection.create_index([(col, ASCENDING)])
        print(f"  indexed {col}")

    print(f"\nDone. {collection.estimated_document_count():,} documents in {DB_NAME}.{COLLECTION_NAME}")


def main():
    df = load_csv(CSV_PATH)
    df = trim_columns(df)
    df = coerce_types(df)
    print_schema_summary(df)
    load_to_mongo(df)


if __name__ == "__main__":
    main()