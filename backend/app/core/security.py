from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from urllib.parse import urlparse

import jwt
from fastapi import HTTPException, status
from .config import settings


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a legacy HS256 JWT for local tests only."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(hours=24))
    to_encode.update({"iat": now, "exp": expire})
    return jwt.encode(to_encode, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


def decode_access_token(token: str) -> Dict[str, Any]:
    """Verify legacy HS256 tokens or Supabase asymmetric tokens via the project's JWKS."""
    try:
        header = jwt.get_unverified_header(token)
        algorithm = header.get("alg")

        if algorithm == "HS256":
            # Retained for existing tests and projects still using the legacy JWT secret.
            return jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )

        if algorithm in {"ES256", "RS256"}:
            base_url = settings.SUPABASE_URL.rstrip("/")
            if not base_url.startswith("https://"):
                raise jwt.InvalidTokenError("JWKS verification requires the configured HTTPS Supabase URL")
            jwks_client = jwt.PyJWKClient(f"{base_url}/auth/v1/.well-known/jwks.json", cache_keys=True)
            signing_key = jwks_client.get_signing_key_from_jwt(token).key
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=[algorithm],
                options={"verify_aud": False},
                issuer=f"{base_url}/auth/v1",
            )
            return payload

        raise jwt.InvalidTokenError("Unsupported JWT signing algorithm")
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.InvalidTokenError, jwt.PyJWKClientError, ValueError, OSError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
