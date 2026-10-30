from typing import List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, status
from ....core.dependencies import get_current_user
from ....schemas.auth import UserProfile
from ....schemas.distribution import DistributionCreate, DistributionResponse
from ....services.distribution_service import DistributionService, get_distribution_service

router = APIRouter()


@router.get("/mine", response_model=List[DistributionResponse], summary="List distributions visible to the current user")
def list_my_distributions(user: UserProfile = Depends(get_current_user), service: DistributionService = Depends(get_distribution_service)):
    return service.list_for_user(user)


@router.post("/donations/{donation_id}/receive", response_model=Dict[str, Any], summary="Confirm that the assigned NGO received a donation")
def confirm_donation_received(donation_id: UUID, user: UserProfile = Depends(get_current_user), service: DistributionService = Depends(get_distribution_service)):
    return service.confirm_received(donation_id, user)


@router.post("", response_model=DistributionResponse, status_code=status.HTTP_201_CREATED, summary="Record a completed distribution event")
def create_distribution(payload: DistributionCreate, user: UserProfile = Depends(get_current_user), service: DistributionService = Depends(get_distribution_service)):
    return service.create(payload, user)
