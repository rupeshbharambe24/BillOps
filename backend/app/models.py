from __future__ import annotations

import datetime as dt

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Event(Base):
    __tablename__ = "events"

    event_id: Mapped[str] = mapped_column(String, primary_key=True)
    timestamp: Mapped[dt.datetime] = mapped_column(DateTime, nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime, nullable=False, default=dt.datetime.utcnow
    )


class Balance(Base):
    __tablename__ = "balances"

    user_id: Mapped[str] = mapped_column(String, primary_key=True)
    balance: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime, nullable=False, default=dt.datetime.utcnow
    )


class RejectedEvent(Base):
    __tablename__ = "rejected_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    reason: Mapped[str] = mapped_column(String, nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime, nullable=False, default=dt.datetime.utcnow
    )
