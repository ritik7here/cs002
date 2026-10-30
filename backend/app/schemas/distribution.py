from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class DistributionCreate(BaseModel):
    donation_id: UUID
    distribution_date: date
    quantity_distributed: int = Field(..., gt=0)
    location: str = Field(..., min_length=2, max_length=300)
    beneficiaries_reached: int = Field(..., ge=0, le=10_000_000)
    proof_image_url: Optional[str] = Field(default=None, max_length=2000)
    impact_report: str = Field(..., min_length=3, max_length=5000)
    notes_to_donor: str = Field(default="", max_length=3000)


class DistributionResponse(BaseModel):
    id: UUID
    donation_id: UUID
    ngo_id: UUID
    distribution_date: date
    quantity_distributed: int = 0
    location: str = ""
    beneficiaries_reached: int = 0
    proof_image_url: Optional[str] = None
    impact_report: str = ""
    notes_to_donor: str = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    donation_title: Optional[str] = None
    donation_quantity: Optional[int] = None
    donation_unit: Optional[str] = None
    donation_status: Optional[str] = None
    donor_id: Optional[UUID] = None
    donor_name: Optional[str] = None
    ngo_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
