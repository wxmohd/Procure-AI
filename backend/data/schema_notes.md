# Procurement Dataset — Schema Notes

Source: State of California purchase order data (Kaggle)
Rows: 346,018 | Collection: `procureiq.purchase_orders`

## Key fields for query generation

| Field | Type | Notes |
|---|---|---|
| `creation_date` | datetime | PO creation date, no nulls |
| `purchase_date` | datetime | actual purchase date, ~5% null |
| `fiscal_year` | string | e.g. "2013-2014" — only 3 distinct years in this dataset, good for quarter/year filters |
| `purchase_order_number` | string | unique PO identifier |
| `department_name` | string | 111 distinct departments — good for "which department spent most" queries |
| `supplier_name` | string | 24,732 distinct — some inconsistency likely (same supplier, different spellings) |
| `acquisition_type` | string | only 5 values (e.g. "IT Goods") — good categorical filter |
| `item_name` / `item_description` | string | free text, high cardinality — needed for "most frequently ordered line items" |
| `quantity`, `unit_price`, `total_price` | float | core spend calculations |
| `commodity_title`, `class_title`, `family_title`, `segment_title` | string | UNSPSC classification hierarchy — segment is broadest category (56 values), useful for high-level "spending by category" |
| `location` | string | **DATA QUALITY ISSUE**: some values contain embedded coordinates mixed with zip code (e.g. `"95841\n(38.662263, -121.346136)"`). Needs cleaning before reliable use — do not expose to the LLM as-is; either strip coordinates or split into `zip` + `lat/lng` fields at load time. |

