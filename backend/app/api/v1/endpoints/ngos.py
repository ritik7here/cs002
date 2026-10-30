from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from ....schemas.ngo import NGOCreate, NGOUpdate, NGOResponse, NGOVerificationUpdate, VerificationStatus
from ....schemas.auth import UserProfile, UserRole
from ....core.dependencies import get_current_user, require_role, require_verified_ngo
from ....core.config import settings
from ....services.ngo_service import NGOService, get_ngo_service

router = APIRouter()

@router.post(
    "",
    response_model=NGOResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new NGO organization",
    tags=["NGOs"]
)
def register_ngo(
    ngo_in: NGOCreate,
    current_user: UserProfile = Depends(get_current_user),
    service: NGOService = Depends(get_ngo_service),
) -> NGOResponse:
    """
    Register a new NGO organization.
    The registering user must have role 'ngo'.
    The NGO starts with verification_status = 'pending'.
    """
    return service.create_ngo(data=ngo_in, creator=current_user)

@router.get(
    "",
    response_model=List[NGOResponse],
    summary="List NGO organizations",
    tags=["NGOs"]
)
def list_ngos(
    status_filter: Optional[VerificationStatus] = Query(None, alias="status", description="Filter by verification status"),
    service: NGOService = Depends(get_ngo_service),
) -> List[NGOResponse]:
    """
    Public directory of NGOs, optionally filtered by verification status.
    """
    return service.list_ngos(verification_status=status_filter)

@router.get(
    "/{ngo_id}",
    response_model=NGOResponse,
    summary="Get NGO profile details",
    tags=["NGOs"]
)
def get_ngo(
    ngo_id: UUID,
    service: NGOService = Depends(get_ngo_service),
) -> NGOResponse:
    """
    Get full public profile of a specific NGO.
    """
    return service.get_ngo_by_id(ngo_id)

@router.patch(
    "/{ngo_id}",
    response_model=NGOResponse,
    summary="Update own NGO organization profile",
    tags=["NGOs"],
)
def update_ngo_profile(
    ngo_id: UUID,
    update_in: NGOUpdate,
    current_user: UserProfile = Depends(get_current_user),
    service: NGOService = Depends(get_ngo_service),
) -> NGOResponse:
    """NGO representatives may update only the organization linked to their account."""
    return service.update_profile(ngo_id=ngo_id, update_data=update_in, user=current_user)

@router.patch(
    "/{ngo_id}/verification",
    response_model=NGOResponse,
    summary="Update NGO verification status (Admin only)",
    tags=["NGOs", "Admin"]
)
def update_ngo_verification(
    ngo_id: UUID,
    update_in: NGOVerificationUpdate,
    admin_user: UserProfile = Depends(require_role([UserRole.ADMIN])),
    service: NGOService = Depends(get_ngo_service),
) -> NGOResponse:
    """
    Approve, reject, or place an NGO under review.
    Restricted to platform administrators.
    """
    return service.update_verification(
        ngo_id=ngo_id,
        update_data=update_in,
        admin_user=admin_user
    )

if settings.ENVIRONMENT.strip().lower() != "production":
    @router.post(
        "/test/verified-action",
        summary="Test endpoint gated by verified NGO requirement",
        tags=["NGOs", "Gated Actions"]
    )
    def test_verified_ngo_gate(
        verified_user: UserProfile = Depends(require_verified_ngo),
    ):
        """
        Gated endpoint to verify that only a verified NGO representative may proceed.
        Unverified or non-NGO users will receive 403 Forbidden.
        """
        return {
            "message": "Action allowed: NGO is verified",
            "user_id": str(verified_user.id),
            "organization_id": str(verified_user.organization_id)
        }
