from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from ....core.dependencies import get_current_user
from ....schemas.auth import UserProfile
from ....schemas.notification import NotificationResponse, MarkAllReadResponse
from ....services.notification_service import NotificationService, get_notification_service

router = APIRouter()

@router.get("/mine", response_model=List[NotificationResponse], summary="List notifications for the authenticated user")
def list_my_notifications(user: UserProfile = Depends(get_current_user), service: NotificationService = Depends(get_notification_service)):
    return service.list_mine(user)

@router.patch("/{notification_id}/read", response_model=NotificationResponse, summary="Mark one of your notifications as read")
def mark_notification_read(notification_id: UUID, user: UserProfile = Depends(get_current_user), service: NotificationService = Depends(get_notification_service)):
    return service.mark_read(str(notification_id), user)

@router.post("/read-all", response_model=MarkAllReadResponse, summary="Mark all of your notifications as read")
def mark_all_notifications_read(user: UserProfile = Depends(get_current_user), service: NotificationService = Depends(get_notification_service)):
    return service.mark_all_read(user)
