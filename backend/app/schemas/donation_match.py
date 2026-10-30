from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from .donation import DonationCategory, DonationStatus, ItemCondition, UrgencyLevel
from .ngo import CauseCategory
from .requirement import RequirementStatus


class DonationMatchDonation(BaseModel):
    id: UUID
    title: str
    category: DonationCategory
    description: str = ""
    quantity: int
    unit: str
    city: str
    state: str
    urgency: UrgencyLevel
    condition: ItemCondition
    status: DonationStatus
    donor_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DonationMatchRequirement(BaseModel):
    id: UUID
    ngo_id: UUID
    ngo_name: str
    ngo_city: str = ""
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
    status: RequirementStatus

    model_config = ConfigDict(from_attributes=True)


class DonationMatchRecommendation(BaseModel):
    score: float
    reasons: List[str]
    donation: DonationMatchDonation
    requirement: DonationMatchRequirement
