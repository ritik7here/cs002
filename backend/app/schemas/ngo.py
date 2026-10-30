from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class VerificationStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    REJECTED = "rejected"

class CauseCategory(str, Enum):
    DISASTER_RELIEF = "Disaster Relief"
    HUNGER_NUTRITION = "Hunger & Nutrition"
    EDUCATION_YOUTH = "Education & Youth"
    HEALTHCARE_MEDICAL = "Healthcare & Medical"
    SHELTER_CLOTHING = "Shelter & Clothing"
    ENVIRONMENT_ANIMAL = "Environment & Animal Welfare"
    WOMEN_EMPOWERMENT = "Women Empowerment"
    ELDERLY_CARE = "Elderly Care"

class NGOCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Full registered NGO name")
    registration_number: str = Field(..., min_length=3, max_length=100, description="Official registration number (e.g. MH/2018/0094125)")
    tax_exempt_id: str = Field(..., min_length=3, max_length=100, description="Tax exempt ID / 80G / 12A number")
    contact_email: EmailStr = Field(..., description="Official contact email")
    phone: str = Field(..., min_length=7, max_length=30, description="Contact phone number")
    address: str = Field(..., min_length=3, max_length=300, description="Physical address")
    city: str = Field(..., min_length=2, max_length=100, description="City")
    state: str = Field(..., min_length=2, max_length=100, description="State / Province")
    website: Optional[str] = Field("", max_length=200)
    founded_year: Optional[int] = Field(None, ge=1800, le=2100)
    description: str = Field("", max_length=2000)
    mission_statement: str = Field("", max_length=2000)
    causes: List[CauseCategory] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)

class NGOUpdate(BaseModel):
    """Editable organization profile fields; omitted fields are left unchanged."""
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=7, max_length=30)
    address: Optional[str] = Field(None, min_length=3, max_length=300)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    website: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    mission_statement: Optional[str] = Field(None, max_length=2000)

class NGOVerificationUpdate(BaseModel):
    verification_status: VerificationStatus
    reason: Optional[str] = Field(None, max_length=500, description="Optional explanation for approval or rejection")

class NGOResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    registration_number: str
    tax_exempt_id: str
    verification_status: VerificationStatus
    description: str = ""
    mission_statement: str = ""
    contact_email: str
    phone: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    website: str = ""
    founded_year: Optional[int] = None
    beneficiaries_count: int = 0
    active_campaigns_count: int = 0
    causes: List[CauseCategory] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    trust_score: int = 70
    banner_image_url: Optional[str] = None
    logo_initial: str = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
