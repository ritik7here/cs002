from datetime import date, datetime
from enum import Enum
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class DonationRequestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class DonationRequestCreate(BaseModel):
    donation_id: UUID
    proposed_pickup_date: Optional[date] = None
    notes: str = Field(default="", max_length=2000)


class DonationRequestDecision(BaseModel):
    status: DonationRequestStatus


class DonationRequestResponse(BaseModel):
    id: UUID
    donation_id: UUID
    ngo_id: UUID
    status: DonationRequestStatus
    proposed_pickup_date: Optional[date] = None
    notes: str = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    donation_title: Optional[str] = None
    donation_category: Optional[str] = None
    donation_city: Optional[str] = None
    donation_quantity: Optional[int] = None
    donation_unit: Optional[str] = None
    donor_id: Optional[UUID] = None
    ngo_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
