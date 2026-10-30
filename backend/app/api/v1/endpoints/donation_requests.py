from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from ....core.dependencies import get_current_user, require_verified_ngo
from ....schemas.auth import UserProfile
from ....schemas.donation_request import DonationRequestCreate, DonationRequestDecision, DonationRequestResponse
from ....services.donation_request_service import DonationRequestService, get_donation_request_service

router = APIRouter()

@router.get("/mine", response_model=List[DonationRequestResponse], summary="List requests visible to the current user")
def list_my_requests(user: UserProfile = Depends(get_current_user), service: DonationRequestService = Depends(get_donation_request_service)):
    return service.list_for_user(user)

@router.post("", response_model=DonationRequestResponse, status_code=status.HTTP_201_CREATED, summary="Request an available donation (verified NGO only)")
def create_request(payload: DonationRequestCreate, user: UserProfile = Depends(require_verified_ngo), service: DonationRequestService = Depends(get_donation_request_service)):
    return service.create(payload, user)

@router.patch("/{request_id}/decision", response_model=DonationRequestResponse, summary="Accept or decline a request for your donation")
def decide_request(request_id: UUID, payload: DonationRequestDecision, user: UserProfile = Depends(get_current_user), service: DonationRequestService = Depends(get_donation_request_service)):
    return service.decide(request_id, payload, user)
