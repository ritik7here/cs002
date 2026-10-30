from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr

class UserRole(str, Enum):
    DONOR = "donor"
    NGO = "ngo"
    ADMIN = "admin"

class TokenPayload(BaseModel):
    sub: str
    email: Optional[str] = None
    exp: Optional[int] = None
    role: Optional[str] = None

class UserProfile(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    role: UserRole
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    location: str = ""
    organization_id: Optional[UUID] = None
    status: str = "active"
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class HealthResponse(BaseModel):
    status: str
    environment: str
    timestamp: datetime
