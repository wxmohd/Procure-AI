# ProcureAI

AI-powered procurement assistant for California State procurement data.

## Stack

- **Backend**: FastAPI + LangGraph + Anthropic Claude + MongoDB
- **Frontend**: React + Vite + TailwindCSS + Recharts

## Setup

### 1. Environment

```bash
cp .env.example .env
# Fill in ANTHROPIC_API_KEY and MONGO_URI
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
```

### 3. Load data

Download `PURCHASE ORDER DATA FY2012-13 and UP.csv` from Kaggle and place it at `backend/data/raw/purchase_orders.csv`, then:

```bash
python backend/data/load_to_mongo.py
```

### 4. Frontend

```bash
cd frontend
npm install
```

## Running

**Backend** (from repo root):
```bash
uvicorn main:app --reload --app-dir backend
```

**Frontend**:
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Evaluation

With the backend running:
```bash
python backend/tests/eval_queries.py
```
