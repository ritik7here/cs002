from typing import Callable, List, Optional, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..schemas.auth import UserProfile, UserRole
from .security import decode_access_token
from ..services.auth_service import AuthService, get_auth_service

bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserProfile:
    """
    Dependency that decodes the Bearer JWT token and retrieves
    the user's profile from the database.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject ('sub')",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = auth_service.get_profile_by_id(user_id)
    return user

def require_role(allowed_roles: List[Union[UserRole, str]]) -> Callable[[UserProfile], UserProfile]:
    """
    Factory dependency to enforce role-based access control.
    Example: Depends(require_role([UserRole.ADMIN]))
    """
    # Normalize roles to string values
    normalized_allowed = {
        role.value if isinstance(role, UserRole) else str(role)
        for role in allowed_roles
    }

    def role_dependency(
        current_user: UserProfile = Depends(get_current_user)
    ) -> UserProfile:
        user_role_str = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
        if user_role_str not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{user_role_str}'. Required roles: {list(normalized_allowed)}."
            )
        return current_user

    return role_dependency

from ..schemas.ngo import VerificationStatus
from ..services.ngo_service import NGOService, get_ngo_service

def require_verified_ngo(
    current_user: UserProfile = Depends(get_current_user),
    ngo_service: NGOService = Depends(get_ngo_service),
) -> UserProfile:
    """
    Dependency that enforces:
    1. User has the 'ngo' role.
    2. User is associated with an NGO organization.
    3. The associated NGO has verification_status == 'verified'.
    """
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation restricted to NGO accounts"
        )
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="NGO user is not associated with any registered organization"
        )

    ngo = ngo_service.get_ngo_by_id(current_user.organization_id)
    if ngo.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation not permitted. NGO verification status is '{ngo.verification_status.value}'. Must be 'verified' by an administrator."
        )
    return current_user
