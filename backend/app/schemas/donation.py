from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class DonationCategory(str, Enum):
    FOOD_GROCERIES = "Food & Groceries"
    CLOTHING_BLANKETS = "Clothing & Blankets"
    MEDICAL_SUPPLIES = "Medical Supplies"
    EDUCATIONAL_MATERIAL = "Educational Material"
    ELECTRONICS_DEVICES = "Electronics & Devices"
    FINANCIAL_AID = "Financial Aid"
    HYGIENE_SANITATION = "Hygiene & Sanitation"
    OTHER_ESSENTIALS = "Other Essentials"

class ItemCondition(str, Enum):
    BRAND_NEW = "Brand New"
    GENTLY_USED = "Gently Used"
    USED_GOOD = "Used - Good Condition"
    NOT_APPLICABLE = "Not Applicable (Consumable/Cash)"

class UrgencyLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL_EMERGENCY = "Critical / Emergency"

class DonationStatus(str, Enum):
    SUBMITTED = "Submitted"
    MATCHED = "Matched"
    PICKUP_SCHEDULED = "Pickup Scheduled"
    IN_TRANSIT = "In Transit"
    RECEIVED_BY_NGO = "Received by NGO"
    DISTRIBUTED = "Distributed"
    CANCELLED = "Cancelled"

class TimelineStep(BaseModel):
    status: DonationStatus
    label: str
    timestamp: Optional[str] = None
    completed: bool = False
    actor: Optional[str] = None
    notes: Optional[str] = None


class DonationStatusHistoryEntry(BaseModel):
    """A persisted status transition recorded by the database trigger."""
    from_status: Optional[DonationStatus] = None
    to_status: DonationStatus
    changed_at: datetime

class DonationCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, description="Title of the pledged item")
    category: DonationCategory = Field(..., description="Item category")
    description: str = Field("", max_length=2000, description="Detailed item description")
    quantity: int = Field(..., gt=0, description="Quantity pledged must be strictly greater than 0")
    unit: str = Field(..., min_length=1, max_length=50, description="Unit of measurement (e.g. Kits, Units, Kg)")
    estimated_value: Optional[float] = Field(None, ge=0, description="Estimated monetary value")
    condition: ItemCondition = Field(..., description="Physical condition of items")
    pickup_address: str = Field(..., min_length=5, max_length=300, description="Pickup street address")
    city: str = Field(..., min_length=2, max_length=100, description="Pickup city")
    state: str = Field(..., min_length=2, max_length=100, description="Pickup state")
    pincode: str = Field(..., min_length=4, max_length=20, description="Postal / ZIP code")
    urgency: UrgencyLevel = Field(UrgencyLevel.MEDIUM, description="Urgency level")

class DonationResponse(BaseModel):
    id: UUID
    donor_id: UUID
    donor_name: Optional[str] = None
    donor_email: Optional[str] = None
    title: str
    category: DonationCategory
    description: str = ""
    quantity: int
    unit: str
    estimated_value: Optional[float] = None
    condition: ItemCondition
    pickup_address: str
    city: str
    state: str
    pincode: str
    urgency: UrgencyLevel
    status: DonationStatus
    matched_ngo_id: Optional[UUID] = None
    matched_ngo_name: Optional[str] = None
    target_requirement_id: Optional[UUID] = None
    proof_photos: List[str] = Field(default_factory=list)
    tracking_timeline: List[TimelineStep] = Field(default_factory=list)
    status_history: List[DonationStatusHistoryEntry] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class DonationPublicResponse(BaseModel):
    """Safe donation fields suitable for unauthenticated browsing.

    Deliberately excludes donor identity, street pickup address, postal code,
    proof-image URLs, and internal relationship IDs.
    """
    id: UUID
    title: str
    category: DonationCategory
    description: str = ""
    quantity: int
    unit: str
    estimated_value: Optional[float] = None
    condition: ItemCondition
    city: str
    state: str
    urgency: UrgencyLevel
    status: DonationStatus
    matched_ngo_name: Optional[str] = None
    tracking_timeline: List[TimelineStep] = Field(default_factory=list)
    status_history: List[DonationStatusHistoryEntry] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)



class DonationNGOResponse(DonationPublicResponse):
    """Donation summary for authenticated NGOs, including safe relationship references.

    Donor contact details, street pickup address, postal code, and proof-image URLs
    remain excluded. Relationship IDs are included for authenticated NGO workflows;
    the unauthenticated DonationPublicResponse continues to omit them.
    """
    donor_name: Optional[str] = None
    matched_ngo_id: Optional[UUID] = None
    target_requirement_id: Optional[UUID] = None
