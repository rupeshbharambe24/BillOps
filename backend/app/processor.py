from __future__ import annotations

import datetime as dt
import json
from typing import Iterable

from sqlalchemy import case, delete, func, select

from .models import Balance, Event, RejectedEvent
from .schemas import EventIn, EventType
from .storage import Storage

OVERDRAFT_LIMIT = -10000.0
DUPLICATE_REASON = "duplicate_event_id"
OVERDRAFT_REASON = "overdraft_limit"


def _delta_for_event(event: EventIn) -> float:
    return event.amount if event.type == EventType.CREDIT else -event.amount


def _serialize_event(event: EventIn) -> str:
    payload = event.model_dump()
    payload["timestamp"] = event.timestamp.isoformat()
    return json.dumps(payload, separators=(",", ":"), sort_keys=True)


def _log_rejection(session, event: EventIn, reason: str) -> None:
    rejection = RejectedEvent(
        event_id=event.event_id,
        reason=reason,
        payload_json=_serialize_event(event),
        created_at=dt.datetime.utcnow(),
    )
    session.add(rejection)


def _log_duplicate(session, event: EventIn) -> None:
    existing = session.execute(
        select(RejectedEvent).where(RejectedEvent.event_id == event.event_id)
    ).scalar_one_or_none()
    if existing:
        return
    _log_rejection(session, event, DUPLICATE_REASON)


def process_events(storage: Storage, events: Iterable[EventIn]) -> dict:
    processed_count = 0
    duplicate_count = 0
    rejected_count = 0
    rejected_summaries: list[dict[str, str]] = []

    events_sorted = sorted(events, key=lambda e: e.timestamp)

    for event in events_sorted:
        outcome, reason = _process_single_event(storage, event)
        if outcome == "processed":
            processed_count += 1
        elif outcome == "duplicate":
            duplicate_count += 1
        elif outcome == "rejected":
            rejected_count += 1
            rejected_summaries.append({"event_id": event.event_id, "reason": reason})

    balances_map = get_balances_map(storage)

    return {
        "processed_count": processed_count,
        "duplicate_count": duplicate_count,
        "rejected_count": rejected_count,
        "balances": balances_map,
        "rejected_events": rejected_summaries,
    }


def _process_single_event(storage: Storage, event: EventIn) -> tuple[str, str]:
    with storage.session() as session:
        with session.begin():
            existing_rejection = session.execute(
                select(RejectedEvent).where(RejectedEvent.event_id == event.event_id)
            ).scalar_one_or_none()
            if existing_rejection:
                if existing_rejection.reason == DUPLICATE_REASON:
                    return "duplicate", existing_rejection.reason
                return "rejected", existing_rejection.reason

            existing_event = session.get(Event, event.event_id)
            if existing_event:
                _log_duplicate(session, event)
                return "duplicate", DUPLICATE_REASON

            balance = session.get(Balance, event.user_id)
            current_balance = balance.balance if balance else 0.0
            new_balance = current_balance + _delta_for_event(event)
            if new_balance < OVERDRAFT_LIMIT:
                _log_rejection(session, event, OVERDRAFT_REASON)
                return "rejected", OVERDRAFT_REASON

            session.add(
                Event(
                    event_id=event.event_id,
                    timestamp=event.timestamp,
                    user_id=event.user_id,
                    amount=event.amount,
                    type=event.type.value,
                    created_at=dt.datetime.utcnow(),
                )
            )
            if not balance:
                balance = Balance(
                    user_id=event.user_id,
                    balance=new_balance,
                    updated_at=dt.datetime.utcnow(),
                )
                session.add(balance)
            else:
                balance.balance = new_balance
                balance.updated_at = dt.datetime.utcnow()
            return "processed", ""


def get_balances_map(storage: Storage) -> dict[str, float]:
    with storage.session() as session:
        rows = session.execute(select(Balance)).scalars().all()
    return {row.user_id: row.balance for row in rows}


def recompute_balances(storage: Storage) -> dict[str, float]:
    with storage.session() as session:
        with session.begin():
            session.execute(delete(Balance))
            balance_expr = func.sum(
                case(
                    (Event.type == EventType.CREDIT.value, Event.amount),
                    else_=-Event.amount,
                )
            )
            results = session.execute(
                select(Event.user_id, balance_expr.label("balance")).group_by(Event.user_id)
            ).all()
            now = dt.datetime.utcnow()
            for user_id, balance in results:
                session.add(
                    Balance(
                        user_id=user_id,
                        balance=float(balance or 0.0),
                        updated_at=now,
                    )
                )

    return get_balances_map(storage)
