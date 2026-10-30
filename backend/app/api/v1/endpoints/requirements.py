from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from ....core.dependencies import get_current_user
from ....schemas.auth import UserProfile, UserRole
from ....schemas.requirement import RequirementCreate, RequirementFulfillment, RequirementResponse
from ....services.requirement_service import RequirementService, get_requirement_service

router = APIRouter()

@router.get("", response_model=List[RequirementResponse], summary="List community requirements")
def list_requirements(ngo_id: Optional[UUID] = Query(None), service: RequirementService = Depends(get_requirement_service)) -> List[RequirementResponse]:
    return service.list_requirements(ngo_id)

@router.post("", response_model=RequirementResponse, status_code=status.HTTP_201_CREATED, summary="Publish a requirement for your verified NGO")
def create_requirement(payload: RequirementCreate, user: UserProfile = Depends(get_current_user), service: RequirementService = Depends(get_requirement_service)) -> RequirementResponse:
    return service.create_requirement(payload, user)

@router.post("/{requirement_id}/fulfillment", response_model=RequirementResponse, summary="Record received quantity against your requirement")
def fulfill_requirement(requirement_id: UUID, payload: RequirementFulfillment, user: UserProfile = Depends(get_current_user), service: RequirementService = Depends(get_requirement_service)) -> RequirementResponse:
    return service.fulfill(requirement_id, payload, user)
