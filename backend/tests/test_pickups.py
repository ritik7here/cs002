from datetime import datetime, timezone, timedelta
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException

from backend.app.schemas.auth import UserProfile, UserRole
from backend.app.schemas.pickup import PickupScheduleCreate, PickupStatus, PickupStatusUpdate
from backend.app.services.pickup_service import PickupService


class Result:
    def __init__(self, data):
        self.data = data


class Query:
    def __init__(self, db, table):
        self.db, self.table_name = db, table
        self.filters = []
        self.action = "select"
        self.payload = None

    def select(self, *_args): return self
    def insert(self, payload): self.action, self.payload = "insert", payload; return self
    def update(self, payload): self.action, self.payload = "update", payload; return self
    def eq(self, key, value): self.filters.append(("eq", key, value)); return self
    def in_(self, key, values): self.filters.append(("in", key, values)); return self
    def order(self, *_args, **_kwargs): return self

    def execute(self):
        rows = self.db.tables.setdefault(self.table_name, [])
        def matches(row):
            for op, key, value in self.filters:
                if op == "eq" and row.get(key) != value: return False
                if op == "in" and row.get(key) not in value: return False
            return True
        if self.action == "insert":
            if self.table_name == "pickups" and any(r.get("donation_id") == self.payload.get("donation_id") for r in rows):
                raise RuntimeError("unique pickup donation constraint")
            rows.append(dict(self.payload))
            return Result([dict(self.payload)])
        selected = [row for row in rows if matches(row)]
        if self.action == "update":
            for row in selected: row.update(self.payload)
            return Result([])
        return Result([dict(row) for row in selected])


class FakeDB:
    def __init__(self, tables): self.tables = tables
    def table(self, name): return Query(self, name)


def user(role, user_id=None, organization_id=None, name="Test User"):
    return UserProfile(
        id=user_id or uuid4(), name=name,
        email=f"{name.lower().replace(' ', '.')}@example.org", role=role,
        organization_id=organization_id, status="active",
    )


def setup():
    donation_id, donor_id, ngo_id = uuid4(), uuid4(), uuid4()
    db = FakeDB({
        "donations": [{
            "id": str(donation_id), "donor_id": str(donor_id), "title": "Winter blankets",
            "city": "Dehradun", "status": "Matched", "matched_ngo_id": str(ngo_id),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }],
        "pickups": [],
        "profiles": [{"id": str(donor_id), "name": "Donation Owner"}],
        "ngos": [{"id": str(ngo_id), "name": "Helping Hands"}],
        "audit_logs": [],
    })
    return db, donation_id, donor_id, ngo_id


def schedule_payload(donation_id):
    return PickupScheduleCreate(
        donation_id=donation_id,
        scheduled_date=datetime.now(timezone.utc) + timedelta(days=1),
        notes="Call before arrival",
    )


def test_donor_schedules_pickup_and_persists_donation_status():
    db, donation_id, donor_id, ngo_id = setup()
    result = PickupService(db).schedule(schedule_payload(donation_id), user(UserRole.DONOR, donor_id))
    assert result.status == PickupStatus.SCHEDULED
    assert result.donation_title == "Winter blankets"
    assert db.tables["donations"][0]["status"] == "Pickup Scheduled"
    assert len(db.tables["pickups"]) == 1
    assert db.tables["audit_logs"][0]["action"] == "pickup_scheduled"


def test_unrelated_donor_cannot_schedule_pickup():
    db, donation_id, _, _ = setup()
    with pytest.raises(HTTPException) as error:
        PickupService(db).schedule(schedule_payload(donation_id), user(UserRole.DONOR))
    assert error.value.status_code == 403
    assert db.tables["pickups"] == []


def test_assigned_ngo_can_schedule_pickup():
    db, donation_id, _, ngo_id = setup()
    result = PickupService(db).schedule(schedule_payload(donation_id), user(UserRole.NGO, organization_id=ngo_id))
    assert result.status == PickupStatus.SCHEDULED


def test_confirm_and_pickup_handoff_updates_donation_to_in_transit():
    db, donation_id, donor_id, _ = setup()
    service = PickupService(db)
    pickup = service.schedule(schedule_payload(donation_id), user(UserRole.DONOR, donor_id))
    confirmed = service.update_status(pickup.id, PickupStatusUpdate(status="confirmed"), user(UserRole.DONOR, donor_id))
    assert confirmed.status == PickupStatus.CONFIRMED
    completed = service.update_status(pickup.id, PickupStatusUpdate(status="picked_up"), user(UserRole.DONOR, donor_id))
    assert completed.status == PickupStatus.PICKED_UP
    assert completed.picked_up_at is not None
    assert db.tables["donations"][0]["status"] == "In Transit"


def test_cancelling_scheduled_pickup_returns_donation_to_matched():
    db, donation_id, donor_id, _ = setup()
    service = PickupService(db)
    pickup = service.schedule(schedule_payload(donation_id), user(UserRole.DONOR, donor_id))
    service.update_status(pickup.id, PickupStatusUpdate(status="cancelled"), user(UserRole.DONOR, donor_id))
    assert db.tables["pickups"][0]["status"] == "cancelled"
    assert db.tables["donations"][0]["status"] == "Matched"


def test_picked_up_pickup_cannot_be_cancelled():
    db, donation_id, donor_id, _ = setup()
    service = PickupService(db)
    pickup = service.schedule(schedule_payload(donation_id), user(UserRole.DONOR, donor_id))
    service.update_status(pickup.id, PickupStatusUpdate(status="confirmed"), user(UserRole.DONOR, donor_id))
    service.update_status(pickup.id, PickupStatusUpdate(status="picked_up"), user(UserRole.DONOR, donor_id))
    with pytest.raises(HTTPException) as error:
        service.update_status(pickup.id, PickupStatusUpdate(status="cancelled"), user(UserRole.DONOR, donor_id))
    assert error.value.status_code == 409


def test_list_only_returns_pickups_for_donors_own_donations():
    db, donation_id, donor_id, _ = setup()
    service = PickupService(db)
    service.schedule(schedule_payload(donation_id), user(UserRole.DONOR, donor_id))
    assert len(service.list_for_user(user(UserRole.DONOR, donor_id))) == 1
    assert service.list_for_user(user(UserRole.DONOR)) == []


def test_past_pickup_date_is_rejected():
    db, donation_id, donor_id, _ = setup()
    payload = PickupScheduleCreate(
        donation_id=donation_id,
        scheduled_date=datetime.now(timezone.utc) - timedelta(hours=1),
        notes="Past date should fail",
    )
    with pytest.raises(HTTPException) as error:
        PickupService(db).schedule(payload, user(UserRole.DONOR, donor_id))
    assert error.value.status_code == 422
    assert db.tables["pickups"] == []


def test_unmatched_donation_cannot_be_scheduled():
    db, donation_id, donor_id, _ = setup()
    db.tables["donations"][0]["matched_ngo_id"] = None
    db.tables["donations"][0]["status"] = "Submitted"
    with pytest.raises(HTTPException) as error:
        PickupService(db).schedule(schedule_payload(donation_id), user(UserRole.DONOR, donor_id))
    assert error.value.status_code == 409
    assert db.tables["pickups"] == []


class NotificationFailingQuery(Query):
    def execute(self):
        if self.table_name == "notifications" and self.action == "insert":
            raise RuntimeError("simulated notification storage outage")
        return super().execute()


class NotificationFailingDB(FakeDB):
    def table(self, name):
        return NotificationFailingQuery(self, name)


def test_pickup_schedule_succeeds_when_notification_storage_fails(caplog):
    base_db, donation_id, _, ngo_id = setup()
    db = NotificationFailingDB(base_db.tables)

    # The NGO schedules a pickup; the donor notification insert will fail.
    result = PickupService(db).schedule(
        schedule_payload(donation_id),
        user(UserRole.NGO, organization_id=ngo_id),
    )

    assert result.status == PickupStatus.SCHEDULED
    assert len(db.tables["pickups"]) == 1
    assert db.tables["donations"][0]["status"] == "Pickup Scheduled"
    assert db.tables["audit_logs"][0]["action"] == "pickup_scheduled"
    assert "Failed to create notification" in caplog.text
