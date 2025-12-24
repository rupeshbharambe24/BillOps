from __future__ import annotations

import datetime as dt
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class EventType(str, Enum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"


class EventIn(BaseModel):
    event_id: str = Field(..., min_length=1)
    timestamp: dt.datetime
    user_id: str = Field(..., min_length=1)
    amount: float = Field(..., ge=0)
    type: EventType

    @field_validator("timestamp")
    @classmethod
    def normalize_timestamp(cls, value: dt.datetime) -> dt.datetime:
        if value.tzinfo is not None:
            return value.astimezone(dt.timezone.utc).replace(tzinfo=None)
        return value

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, value: str) -> str:
        if isinstance(value, str):
            return value.upper()
        return value


class IngestResult(BaseModel):
    processed_count: int
    duplicate_count: int
    rejected_count: int
    balances: dict[str, float]
    rejected_events: list[dict[str, str]]


class BalanceRow(BaseModel):
    user_id: str
    balance: float
    updated_at: dt.datetime


class BalanceResponse(BaseModel):
    balances: dict[str, float]
    items: list[BalanceRow]


class EventOut(BaseModel):
    event_id: str
    timestamp: dt.datetime
    user_id: str
    amount: float
    type: str


class EventsResponse(BaseModel):
    items: list[EventOut]
    page: int
    limit: int
    total: int


class RejectedOut(BaseModel):
    id: int
    event_id: str
    reason: str
    payload_json: str
    created_at: dt.datetime


class RejectionsResponse(BaseModel):
    items: list[RejectedOut]
    page: int
    limit: int
    total: int
