# Billing Event Processing System

![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs)
![Docker](https://img.shields.io/badge/Docker-compose-2496ED?logo=docker&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

A production-lean billing ledger that ingests events from multiple sources, deduplicates by `event_id`, and maintains per-user balances even when events arrive out of order.

## Project structure
```text
BillOps/
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI routes
│   │   ├── processor.py   # idempotent ingest, overdraft check, recompute
│   │   ├── storage.py     # SQLAlchemy engine/session (DATABASE_URL)
│   │   ├── models.py      # events, balances, rejected_events tables
│   │   └── schemas.py     # Pydantic request/response models
│   ├── tests/             # pytest suite for the processor
│   ├── Dockerfile
│   └── requirements*.txt
├── frontend/              # Next.js 14 (app router) + Tailwind
│   ├── app/               # dashboard, ingest, events, balances, rejections pages
│   ├── components/
│   └── lib/               # API client, formatting, sample payload
├── docker-compose.yml
└── .env.example
```

## Architecture
- **Event ledger + cached balances**: `events` is the immutable ledger; `balances` caches the current total per user.
- **Idempotent ingestion**: `event_id` is the primary key. If the insert already exists, the event is counted as a duplicate and no balance update occurs.
- **Late arrivals**: older timestamps are accepted; the ledger is append-only and balances are updated on insert.
- **Overdraft protection**: events that would drop a balance below -10,000 are rejected and written to `rejected_events`.
- **Duplicate audit**: duplicate ingests are logged in `rejected_events` with reason `duplicate_event_id` for KPI tracking.

## Backend (FastAPI)
### Run locally
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Run tests
```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

## Frontend (Next.js + Tailwind)
```bash
cd frontend
npm install
npm run dev
```

## Environment
See `.env.example`. The code reads plain environment variables (no `.env` loader), so export them in the shell
or, for the frontend, put `NEXT_PUBLIC_API_URL` in `frontend/.env.local`. All have local defaults.
- `NEXT_PUBLIC_API_URL`: base URL for the backend API (default `http://localhost:8000`)
- `DATABASE_URL`: SQLite by default (`sqlite:///./billing.db`, created on startup); swap to Postgres when ready
- `CORS_ORIGINS`: comma-separated allowed origins for the API (default `*`)

## Crash safety
- The ingest flow wraps the event insert + balance update in a **single transaction**.
- Dedupe is enforced by the `event_id` primary key.
- A `/balances/recompute` endpoint rebuilds balances from the ledger for sanity checks.

## Scaling to millions/day
- **Postgres** with row-level locks on `balances` (`SELECT ... FOR UPDATE`) to avoid race conditions.
- **Kafka** or similar bus to partition by `user_id` and keep ordering per user when needed.
- Batch ingestion per partition and pre-aggregate balances for hot users.

## Thread-safety strategy
- Each event is processed in its own database transaction.
- In Postgres, use row-level locking to avoid concurrent updates to the same user balance.

## Optional Docker (bonus)
```bash
docker compose up --build
```

## API endpoints
- `POST /events/ingest`
- `GET /balances?user_id=`
- `GET /events?page=&limit=&user_id=&type=&sort=`
- `GET /rejections?page=&limit=`
- `POST /balances/recompute`

## License
Released under the [MIT License](LICENSE).
