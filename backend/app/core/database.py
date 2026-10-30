import logging
from typing import Optional
from functools import lru_cache
from supabase import create_client, Client
from .config import settings

logger = logging.getLogger("kindredbridge.database")

@lru_cache()
def get_supabase_client() -> Optional[Client]:
    """
    Returns an initialized Supabase client using the service-role key.
    Returns None if URL or KEY is not configured or in testing environment.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return None
    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    except Exception:
        logger.exception("Supabase client initialization failed")
        return None

def get_db():
    """FastAPI dependency to yield the Supabase client or DB session."""
    client = get_supabase_client()
    return client
