from datetime import datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    message: str
    type: Literal["info", "success", "warning", "alert"] = "info"
    read: bool = False
    action_view: Optional[str] = None
    action_id: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class MarkAllReadResponse(BaseModel):
    updated: int
