"""Persistent, user-scoped notifications. Event delivery is best-effort so it cannot undo core workflow actions."""
from datetime import datetime, timezone
import logging
from typing import Any, Dict, Iterable, List, Optional
from uuid import uuid4

from fastapi import Depends, HTTPException
from ..core.database import get_db
from ..schemas.auth import UserProfile

logger = logging.getLogger(__name__)


def emit_notification(db, user_id: Optional[str], title: str, message: str, kind: str = "info", action_view: Optional[str] = None, action_id: Optional[str] = None) -> None:
    if db is None or not user_id:
        return
    try:
        db.table("notifications").insert({
            "id": str(uuid4()), "user_id": str(user_id), "title": title[:160],
            "message": message[:1000], "type": kind if kind in {"info", "success", "warning", "alert"} else "info",
            "read": False, "action_view": action_view, "action_id": str(action_id) if action_id else None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception:
        logger.exception("Failed to create notification for user %s", user_id)


def notify_organization(db, organization_id: Optional[str], title: str, message: str, kind: str = "info", action_view: Optional[str] = None, action_id: Optional[str] = None, exclude_user_id: Optional[str] = None) -> None:
    if db is None or not organization_id:
        return
    try:
        rows = db.table("profiles").select("id").eq("organization_id", str(organization_id)).execute().data or []
        for row in rows:
            if exclude_user_id and str(row.get("id")) == str(exclude_user_id):
                continue
            emit_notification(db, row.get("id"), title, message, kind, action_view, action_id)
    except Exception:
        logger.exception("Failed to find notification recipients for organization %s", organization_id)


class NotificationService:
    def __init__(self, db_client=None):
        self.db = db_client

    def list_mine(self, user: UserProfile) -> List[Dict[str, Any]]:
        self._require_db()
        rows = self.db.table("notifications").select("*").eq("user_id", str(user.id)).order("created_at", desc=True).limit(100).execute().data or []
        return rows

    def mark_read(self, notification_id: str, user: UserProfile) -> Dict[str, Any]:
        self._require_db()
        rows = self.db.table("notifications").select("id,read").eq("id", notification_id).eq("user_id", str(user.id)).execute().data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Notification not found")
        self.db.table("notifications").update({"read": True}).eq("id", notification_id).eq("user_id", str(user.id)).execute()
        saved = self.db.table("notifications").select("*").eq("id", notification_id).eq("user_id", str(user.id)).execute().data or []
        if not saved:
            raise HTTPException(status_code=409, detail="Could not update notification")
        return saved[0]

    def mark_all_read(self, user: UserProfile) -> Dict[str, int]:
        self._require_db()
        unread = self.db.table("notifications").select("id").eq("user_id", str(user.id)).eq("read", False).execute().data or []
        if unread:
            self.db.table("notifications").update({"read": True}).eq("user_id", str(user.id)).eq("read", False).execute()
        return {"updated": len(unread)}

    def _require_db(self):
        if self.db is None:
            raise HTTPException(status_code=503, detail="Database service not available")


def get_notification_service(db=Depends(get_db)) -> NotificationService:
    return NotificationService(db_client=db)
