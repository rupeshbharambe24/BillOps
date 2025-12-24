import datetime as dt
from pathlib import Path

from sqlalchemy import select

from app.models import Balance, RejectedEvent
from app.processor import OVERDRAFT_REASON, process_events, get_balances_map
from app.schemas import EventIn
from app.storage import Storage


def make_storage(tmp_path: Path, name: str) -> Storage:
    storage = Storage(database_url=f"sqlite:///{tmp_path / name}")
    storage.init_db()
    return storage


def make_event(event_id: str, timestamp: dt.datetime, user_id: str, amount: float, type: str) -> EventIn:
    return EventIn(
        event_id=event_id,
        timestamp=timestamp,
        user_id=user_id,
        amount=amount,
        type=type,
    )


def test_dedupe(tmp_path: Path) -> None:
    storage = make_storage(tmp_path, "dedupe.db")
    event = make_event("evt-1", dt.datetime(2024, 1, 1, 10, 0, 0), "u1", 50, "CREDIT")
    result = process_events(storage, [event, event])

    assert result["processed_count"] == 1
    assert result["duplicate_count"] == 1
    assert result["rejected_count"] == 0
    assert result["balances"]["u1"] == 50


def test_idempotency(tmp_path: Path) -> None:
    storage = make_storage(tmp_path, "idempotency.db")
    events = [
        make_event("evt-1", dt.datetime(2024, 1, 1, 9, 0, 0), "u1", 100, "CREDIT"),
        make_event("evt-2", dt.datetime(2024, 1, 1, 9, 5, 0), "u1", 40, "DEBIT"),
    ]

    first = process_events(storage, events)
    second = process_events(storage, events)

    assert first["balances"] == second["balances"]
    assert second["duplicate_count"] == 2


def test_late_arrival(tmp_path: Path) -> None:
    ordered_storage = make_storage(tmp_path, "ordered.db")
    late_storage = make_storage(tmp_path, "late.db")

    older = make_event("evt-1", dt.datetime(2024, 1, 1, 8, 0, 0), "u2", 25, "CREDIT")
    newer = make_event("evt-2", dt.datetime(2024, 1, 1, 12, 0, 0), "u2", 10, "DEBIT")

    process_events(ordered_storage, [older, newer])
    process_events(late_storage, [newer])
    process_events(late_storage, [older])

    assert get_balances_map(ordered_storage) == get_balances_map(late_storage)


def test_overdraft_rejected(tmp_path: Path) -> None:
    storage = make_storage(tmp_path, "overdraft.db")
    event = make_event("evt-od", dt.datetime(2024, 1, 1, 10, 0, 0), "u3", 15000, "DEBIT")

    result = process_events(storage, [event])

    assert result["processed_count"] == 0
    assert result["duplicate_count"] == 0
    assert result["rejected_count"] == 1
    assert result["balances"] == {}

    with storage.session() as session:
        rejection = session.execute(select(RejectedEvent)).scalar_one()
        balances = session.execute(select(Balance)).scalars().all()

    assert rejection.reason == OVERDRAFT_REASON
    assert balances == []
