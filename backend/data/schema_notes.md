# Procurement Dataset — Schema Notes

Source: State of California purchase order data (Kaggle)
Rows: 346,018 | Collection: `procureiq.purchase_orders`

## Key fields for query generation

| Field | Type | Notes |
|---|---|---|
| `creation_date` | datetime | PO creation date, no nulls — the only date field kept, used for all date/quarter grouping |
| `fiscal_year` | string | e.g. "2013-2014" — only 3 distinct years in this dataset, good for quarter/year filters |
| `purchase_order_number` | string | unique PO identifier |
| `department_name` | string | 111 distinct departments — good for "which department spent most" queries |
| `supplier_name` | string | 24,732 distinct — some inconsistency likely (same supplier, different spellings) |
| `acquisition_type` | string | only 5 values (e.g. "IT Goods") — good categorical filter |
| `item_name` / `item_description` | string | free text, high cardinality — needed for "most frequently ordered line items" |
| `quantity`, `unit_price`, `total_price` | float | core spend calculations |
| `acquisition_method` | string | procurement method (e.g. "NCB", "Contract") |
| `purchase_order_type` | string | PO classification |

## Dropped columns (not loaded to MongoDB)

`lpa_number`, `sub_acquisition_type`, `sub_acquisition_method`, `calcard`, `item_commodity_code`, `normalized_unspsc`, `commodity_title`, `class`, `class_title`, `family`, `family_title`, `segment`, `segment_title`, `location`, `supplier_qualifications`, `purchase_date`, `requisition_number`, `supplier_zip_code`, `supplier_code`, `classification_codes` — removed to stay within Atlas M0 storage limit.

`purchase_date` and `supplier_code` were dropped after this doc was first written; `SCHEMA_DESCRIPTION` in `backend/agent/prompts.py` (the LLM-facing schema) is kept in sync with `DROP_COLUMNS` in `backend/data/load_to_mongo.py` — if you change one, change both.

