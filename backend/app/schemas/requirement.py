from datetime import date, datetime
from enum import Enum
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from .donation import DonationCategory, UrgencyLevel
from .ngo import CauseCategory

class RequirementStatus(str, Enum):
    OPEN = "Open"
    PARTIALLY_FULFILLED = "Partially Fulfilled"
    FULFILLED = "Fulfilled"
    CLOSED = "Closed"

class RequirementCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    category: DonationCategory
    cause: CauseCategory
    target_quantity: int = Field(..., gt=0)
    unit: str = Field(..., min_length=1, max_length=100)
    urgency: UrgencyLevel
    description: str = Field(..., min_length=1, max_length=3000)
    beneficiary_group: str = Field(..., min_length=1, max_length=300)
    needed_by_date: Optional[date] = None

class RequirementFulfillment(BaseModel):
    amount: int = Field(..., gt=0)

class RequirementResponse(BaseModel):
    id: UUID
    ngo_id: UUID
    ngo_name: str = ""
    ngo_city: str = ""
    ngo_verified: bool = False
    title: str
    category: DonationCategory
    cause: CauseCategory
    target_quantity: int
    fulfilled_quantity: int = 0
    unit: str
    urgency: UrgencyLevel
    description: str = ""
    beneficiary_group: str = ""
    needed_by_date: Optional[date] = None
    status: RequirementStatus = RequirementStatus.OPEN
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
