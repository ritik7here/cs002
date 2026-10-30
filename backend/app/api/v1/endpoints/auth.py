from fastapi import APIRouter, Depends

from ....core.config import settings
from ....schemas.auth import UserProfile, UserRole
from ....core.dependencies import get_current_user, require_role

router = APIRouter()


@router.get("/me", response_model=UserProfile, tags=["Auth"])
def get_me(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
    """Returns the authenticated user's profile and active role."""
    return current_user


# Keep these role smoke-test endpoints available for local development and tests,
# but do not register them in production.
if settings.ENVIRONMENT.strip().lower() != "production":
    @router.get("/test/admin", tags=["Auth Tests"])
    def admin_only_test(current_user: UserProfile = Depends(require_role([UserRole.ADMIN]))):
        return {"message": "Admin access granted", "user_id": str(current_user.id)}

    @router.get("/test/ngo", tags=["Auth Tests"])
    def ngo_only_test(current_user: UserProfile = Depends(require_role([UserRole.NGO]))):
        return {"message": "NGO access granted", "user_id": str(current_user.id)}

    @router.get("/test/donor", tags=["Auth Tests"])
    def donor_only_test(current_user: UserProfile = Depends(require_role([UserRole.DONOR]))):
        return {"message": "Donor access granted", "user_id": str(current_user.id)}
