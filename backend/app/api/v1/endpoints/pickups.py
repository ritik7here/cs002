from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from ....core.dependencies import get_current_user
from ....schemas.auth import UserProfile
from ....schemas.pickup import PickupResponse, PickupScheduleCreate, PickupStatusUpdate
from ....services.pickup_service import PickupService, get_pickup_service

router = APIRouter()


@router.get("/mine", response_model=List[PickupResponse], summary="List pickups visible to the current user")
def list_my_pickups(user: UserProfile = Depends(get_current_user), service: PickupService = Depends(get_pickup_service)):
    return service.list_for_user(user)


@router.post("", response_model=PickupResponse, status_code=status.HTTP_201_CREATED, summary="Schedule or reschedule pickup for a matched donation")
def schedule_pickup(payload: PickupScheduleCreate, user: UserProfile = Depends(get_current_user), service: PickupService = Depends(get_pickup_service)):
    return service.schedule(payload, user)


@router.patch("/{pickup_id}/status", response_model=PickupResponse, summary="Confirm, complete, or cancel a pickup")
def update_pickup_status(pickup_id: UUID, payload: PickupStatusUpdate, user: UserProfile = Depends(get_current_user), service: PickupService = Depends(get_pickup_service)):
    return service.update_status(pickup_id, payload, user)
