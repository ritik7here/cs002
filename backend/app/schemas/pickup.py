from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class PickupStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    PICKED_UP = "picked_up"
    CANCELLED = "cancelled"


class PickupScheduleCreate(BaseModel):
    donation_id: UUID
    scheduled_date: datetime
    notes: str = Field(default="", max_length=2000)


class PickupStatusUpdate(BaseModel):
    status: PickupStatus
    notes: Optional[str] = Field(default=None, max_length=2000)


class PickupResponse(BaseModel):
    id: UUID
    donation_id: UUID
    scheduled_date: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    status: PickupStatus
    notes: str = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    donation_title: Optional[str] = None
    donation_city: Optional[str] = None
    donation_status: Optional[str] = None
    donor_id: Optional[UUID] = None
    donor_name: Optional[str] = None
    ngo_id: Optional[UUID] = None
    ngo_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
