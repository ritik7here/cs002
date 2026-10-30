from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException
import pytest

from backend.app.schemas.auth import UserProfile, UserRole
from backend.app.services.notification_service import NotificationService, emit_notification


class Query:
    def __init__(self, db, table):
        self.db, self.table_name = db, table
        self.filters = []
        self.action = "select"
        self.payload = None
        self.limit_count = None

    def select(self, *_args, **_kwargs): return self
    def insert(self, payload): self.action, self.payload = "insert", payload; return self
    def update(self, payload): self.action, self.payload = "update", payload; return self
    def eq(self, field, value): self.filters.append((field, value)); return self
    def order(self, *_args, **_kwargs): return self
    def limit(self, value): self.limit_count = value; return self
    def execute(self):
        rows = self.db.tables.setdefault(self.table_name, [])
        matches = [r for r in rows if all(r.get(k) == v for k, v in self.filters)]
        if self.action == "insert":
            rows.append(dict(self.payload))
            return type("Result", (), {"data": [dict(self.payload)]})()
        if self.action == "update":
            for row in matches: row.update(self.payload)
            return type("Result", (), {"data": []})()
        if self.limit_count is not None: matches = matches[:self.limit_count]
        return type("Result", (), {"data": [dict(r) for r in matches]})()

class FakeDB:
    def __init__(self, tables=None): self.tables = tables or {}
    def table(self, name): return Query(self, name)


def user(uid=None):
    return UserProfile(id=uid or uuid4(), name="Test User", email="test@example.com", role=UserRole.DONOR)


def test_notification_is_persisted_with_safe_defaults():
    db = FakeDB()
    recipient = user()
    emit_notification(db, str(recipient.id), "Request update", "A request changed", "success", "donor-requests", "donation-1")
    row = db.tables["notifications"][0]
    assert row["user_id"] == str(recipient.id)
    assert row["read"] is False
    assert row["type"] == "success"
    assert row["action_id"] == "donation-1"


def test_list_mine_is_scoped_to_authenticated_user():
    first, second = user(), user()
    db = FakeDB({"notifications": [
        {"id": str(uuid4()), "user_id": str(first.id), "title": "Mine", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid4()), "user_id": str(second.id), "title": "Other", "created_at": datetime.now(timezone.utc).isoformat()},
    ]})
    rows = NotificationService(db).list_mine(first)
    assert len(rows) == 1
    assert rows[0]["title"] == "Mine"


def test_user_cannot_mark_another_users_notification_read():
    owner, other = user(), user()
    notification_id = str(uuid4())
    db = FakeDB({"notifications": [{"id": notification_id, "user_id": str(owner.id), "read": False}]})
    with pytest.raises(HTTPException) as error:
        NotificationService(db).mark_read(notification_id, other)
    assert error.value.status_code == 404
    assert db.tables["notifications"][0]["read"] is False


def test_mark_read_persists_for_owner():
    owner = user()
    notification_id = str(uuid4())
    db = FakeDB({"notifications": [{"id": notification_id, "user_id": str(owner.id), "read": False}]})
    result = NotificationService(db).mark_read(notification_id, owner)
    assert result["read"] is True


def test_mark_all_read_updates_only_current_users_notifications():
    owner, other = user(), user()
    db = FakeDB({"notifications": [
        {"id": str(uuid4()), "user_id": str(owner.id), "read": False},
        {"id": str(uuid4()), "user_id": str(owner.id), "read": True},
        {"id": str(uuid4()), "user_id": str(other.id), "read": False},
    ]})
    result = NotificationService(db).mark_all_read(owner)
    assert result["updated"] == 1
    assert [row["read"] for row in db.tables["notifications"]] == [True, True, False]
