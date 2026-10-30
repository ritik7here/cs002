from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from ....schemas.donation import (
    DonationCreate,
    DonationResponse,
    DonationPublicResponse,
    DonationNGOResponse,
    DonationCategory,
    DonationStatus,
)
from ....schemas.auth import UserProfile, UserRole
from ....core.dependencies import get_current_user, require_role, require_verified_ngo
from ....services.donation_service import DonationService, get_donation_service

router = APIRouter()

@router.post(
    "",
    response_model=DonationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Pledge a new donation (Donor only)",
    tags=["Donations"]
)
def create_donation(
    donation_in: DonationCreate,
    current_user: UserProfile = Depends(require_role([UserRole.DONOR])),
    service: DonationService = Depends(get_donation_service),
) -> DonationResponse:
    """
    Pledge an item donation.
    Caller must be authenticated and have the 'donor' role.
    Strictly validates all inputs (title, quantity > 0, pickup address); no silent defaults.
    """
    return service.create_donation(data=donation_in, donor=current_user)

@router.get(
    "",
    response_model=List[DonationPublicResponse],
    summary="List donations with optional filters",
    tags=["Donations"]
)
def list_donations(
    status_filter: Optional[DonationStatus] = Query(None, alias="status", description="Filter by donation status"),
    category_filter: Optional[DonationCategory] = Query(None, alias="category", description="Filter by category"),
    service: DonationService = Depends(get_donation_service),
) -> List[DonationPublicResponse]:
    """Browse safe donation summaries. Private donor/pickup fields are omitted."""
    return service.list_donations(
        status_filter=status_filter,
        category_filter=category_filter,
    )

@router.get(
    "/my",
    response_model=List[DonationResponse],
    summary="List current authenticated donor's donations",
    tags=["Donations"]
)
def list_my_donations(
    current_user: UserProfile = Depends(require_role([UserRole.DONOR])),
    service: DonationService = Depends(get_donation_service),
) -> List[DonationResponse]:
    """Retrieve private records for the authenticated donor only."""
    return service.list_donations(donor_id=current_user.id)

@router.get(
    "/ngo",
    response_model=List[DonationNGOResponse],
    summary="List donation summaries for authenticated NGOs",
    tags=["Donations"],
)
def list_donations_for_ngo(
    current_user: UserProfile = Depends(require_verified_ngo),
    service: DonationService = Depends(get_donation_service),
) -> List[DonationNGOResponse]:
    """Return safe donation summaries with donor display names for NGOs only."""
    return service.list_donations()  # Response model strips private fields.

@router.get(
    "/{donation_id}",
    response_model=DonationResponse,
    summary="Get single donation by ID",
    tags=["Donations"]
)
def get_donation(
    donation_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: DonationService = Depends(get_donation_service),
) -> DonationResponse:
    """Get private details only for the owner, matched NGO, or administrator."""
    donation = service.get_donation_by_id(donation_id)
    is_owner = donation.donor_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN
    is_matched_ngo = (
        current_user.role == UserRole.NGO
        and current_user.organization_id is not None
        and donation.matched_ngo_id == current_user.organization_id
    )
    if not (is_owner or is_admin or is_matched_ngo):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this donation's private details",
        )
    return donation
