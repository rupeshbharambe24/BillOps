from __future__ import annotations

import datetime as dt
import os

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select

from .models import Balance, Event, RejectedEvent
from .processor import DUPLICATE_REASON, process_events, recompute_balances
from .schemas import (
    BalanceResponse,
    BalanceRow,
    EventIn,
    EventOut,
    EventType,
    EventsResponse,
    IngestResult,
    RejectedOut,
    RejectionsResponse,
)
from .storage import Storage

app = FastAPI(title="Billing Event Processing System")

cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

storage = Storage()


@app.on_event("startup")
def on_startup() -> None:
    storage.init_db()


@app.post("/events/ingest", response_model=IngestResult)
def ingest_events(events: list[EventIn]) -> dict:
    return process_events(storage, events)


@app.get("/balances", response_model=BalanceResponse)
def get_balances(user_id: str | None = None) -> dict:
    with storage.session() as session:
        query = select(Balance)
        if user_id:
            query = query.where(Balance.user_id == user_id)
        rows = session.execute(query).scalars().all()
    balances = {row.user_id: row.balance for row in rows}
    items = [
        BalanceRow(user_id=row.user_id, balance=row.balance, updated_at=row.updated_at)
        for row in rows
    ]
    return {"balances": balances, "items": items}


@app.get("/events", response_model=EventsResponse)
def list_events(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user_id: str | None = None,
    type: EventType | None = None,
    sort: str = Query("desc", pattern="^(asc|desc)$"),
    since_hours: int | None = Query(None, ge=1, le=720),
) -> dict:
    filters = []
    if user_id:
        filters.append(Event.user_id == user_id)
    if type:
        filters.append(Event.type == type.value)
    if since_hours:
        since = dt.datetime.utcnow() - dt.timedelta(hours=since_hours)
        filters.append(Event.timestamp >= since)

    order = Event.timestamp.desc() if sort == "desc" else Event.timestamp.asc()

    with storage.session() as session:
        total = session.scalar(select(func.count()).select_from(Event).where(*filters)) or 0
        rows = (
            session.execute(
                select(Event)
                .where(*filters)
                .order_by(order)
                .offset((page - 1) * limit)
                .limit(limit)
            )
            .scalars()
            .all()
        )

    items = [
        EventOut(
            event_id=row.event_id,
            timestamp=row.timestamp,
            user_id=row.user_id,
            amount=row.amount,
            type=row.type,
        )
        for row in rows
    ]
    return {"items": items, "page": page, "limit": limit, "total": total}


@app.get("/rejections", response_model=RejectionsResponse)
def list_rejections(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    reason: str | None = None,
    include_duplicates: bool = False,
    since_hours: int | None = Query(None, ge=1, le=720),
) -> dict:
    filters = []
    if not include_duplicates:
        filters.append(RejectedEvent.reason != DUPLICATE_REASON)
    if reason:
        filters.append(RejectedEvent.reason == reason)
    if since_hours:
        since = dt.datetime.utcnow() - dt.timedelta(hours=since_hours)
        filters.append(RejectedEvent.created_at >= since)

    with storage.session() as session:
        total = (
            session.scalar(select(func.count()).select_from(RejectedEvent).where(*filters))
            or 0
        )
        rows = (
            session.execute(
                select(RejectedEvent)
                .where(*filters)
                .order_by(RejectedEvent.created_at.desc())
                .offset((page - 1) * limit)
                .limit(limit)
            )
            .scalars()
            .all()
        )

    items = [
        RejectedOut(
            id=row.id,
            event_id=row.event_id,
            reason=row.reason,
            payload_json=row.payload_json,
            created_at=row.created_at,
        )
        for row in rows
    ]
    return {"items": items, "page": page, "limit": limit, "total": total}


@app.post("/balances/recompute")
def recompute() -> dict:
    balances = recompute_balances(storage)
    return {"balances": balances}
