import logging
import httpx
from uuid import UUID
from typing import Optional
from fastapi import Depends, HTTPException, status
from ..schemas.auth import UserProfile, UserRole

logger = logging.getLogger("kindredbridge.auth")

class AuthService:
    def __init__(self, db_client=None):
        self.db = db_client

    def get_profile_by_id(self, user_id: str) -> UserProfile:
        """
        Fetch a user profile by ID.
        Checks active status and returns UserProfile schema.
        """
        if self.db is not None:
            try:
                response = self.db.table("profiles").select("*").eq("id", user_id).single().execute()
                data = response.data
                if not data:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="User profile not found",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
            except HTTPException:
                raise
            except httpx.TransportError:
                # Let the application-level handler return a safe 503 response.
                raise
            except Exception:
                logger.exception("Unexpected database error while loading a user profile")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unable to load user profile due to a server error"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )

        # Enforce account active status
        if data.get("status") != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is suspended"
            )

        return UserProfile(**data)

from ..core.database import get_db

def get_auth_service(db=Depends(get_db)) -> AuthService:
    return AuthService(db_client=db)
