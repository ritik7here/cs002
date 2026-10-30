from typing import List
from fastapi import APIRouter, Depends
from ....core.dependencies import get_current_user
from ....schemas.auth import UserProfile
from ....schemas.donation_match import DonationMatchRecommendation
from ....services.donation_match_service import DonationMatchService, get_donation_match_service

router = APIRouter()


@router.get("/recommendations", response_model=List[DonationMatchRecommendation], summary="List category- and logistics-based donation recommendations")
def list_recommendations(
    current_user: UserProfile = Depends(get_current_user),
    service: DonationMatchService = Depends(get_donation_match_service),
) -> List[DonationMatchRecommendation]:
    """Return recommendations for the signed-in donor or verified NGO. Does not reserve donations."""
    return service.list_recommendations(current_user)
