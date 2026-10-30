from datetime import date, datetime, timezone
from uuid import UUID, uuid4
from fastapi import HTTPException
import pytest

from backend.app.schemas.auth import UserProfile, UserRole
from backend.app.schemas.donation_request import DonationRequestCreate, DonationRequestDecision, DonationRequestStatus
from backend.app.services.donation_request_service import DonationRequestService


class Query:
    def __init__(self, db, table):
        self.db, self.table_name = db, table
        self.filters = []
        self.action = "select"
        self.payload = None
        self.limit_fields = None

    def select(self, fields="*"):
        self.limit_fields = fields
        return self

    def insert(self, payload):
        self.action, self.payload = "insert", payload
        return self

    def update(self, payload):
        self.action, self.payload = "update", payload
        return self

    def eq(self, field, value):
        self.filters.append((field, "eq", value)); return self

    def in_(self, field, values):
        self.filters.append((field, "in", values)); return self

    def is_(self, field, value):
        self.filters.append((field, "is", value)); return self

    def neq(self, field, value):
        self.filters.append((field, "neq", value)); return self

    def order(self, *args, **kwargs): return self

    def execute(self):
        rows = self.db.tables.setdefault(self.table_name, [])
        def match(row):
            for field, op, value in self.filters:
                actual = row.get(field)
                if op == "eq" and actual != value: return False
                if op == "in" and actual not in value: return False
                if op == "is" and value == "null" and actual is not None: return False
                if op == "neq" and actual == value: return False
            return True
        if self.action == "insert":
            row = dict(self.payload); rows.append(row); return type("Result", (), {"data": [dict(row)]})()
        selected = [row for row in rows if match(row)]
        if self.action == "update":
            for row in selected: row.update(self.payload)
            # PostgREST may return an empty data array for updates that do not
            # request a representation. Production code must read back explicitly.
            return type("Result", (), {"data": []})()
        return type("Result", (), {"data": [dict(row) for row in selected]})()


class FakeDB:
    def __init__(self, tables): self.tables = tables
    def table(self, name): return Query(self, name)




def make_user(role, user_id=None, organization_id=None, name="Test User"):
    return UserProfile(
        id=user_id or uuid4(), name=name, email=f"{name.lower().replace(' ', '.')}@example.org",
        role=role, organization_id=organization_id, status="active",
    )


def setup_db():
    donation_id, ngo_id, donor_id = uuid4(), uuid4(), uuid4()
    return FakeDB({
        "donations": [{
            "id": str(donation_id), "donor_id": str(donor_id), "title": "Winter blankets",
            "category": "Clothing & Blankets", "city": "Dehradun", "quantity": 12, "unit": "Blankets",
            "status": "Submitted", "matched_ngo_id": None,
        }],
        "ngos": [{"id": str(ngo_id), "name": "Helping Hands"}],
        "donation_requests": [],
    }), donation_id, ngo_id, donor_id


def test_create_request_persists_pending_request():
    db, donation_id, ngo_id, _ = setup_db()
    user = make_user(UserRole.NGO, organization_id=ngo_id)
    result = DonationRequestService(db).create(DonationRequestCreate(donation_id=donation_id, proposed_pickup_date=date(2026, 11, 2), notes="Van available"), user)
    assert result.status == DonationRequestStatus.PENDING
    assert result.proposed_pickup_date == date(2026, 11, 2)
    assert len(db.tables["donation_requests"]) == 1
    assert db.tables["donation_requests"][0]["ngo_id"] == str(ngo_id)


def test_duplicate_active_request_is_rejected():
    db, donation_id, ngo_id, _ = setup_db()
    service = DonationRequestService(db)
    user = make_user(UserRole.NGO, organization_id=ngo_id)
    payload = DonationRequestCreate(donation_id=donation_id)
    service.create(payload, user)
    with pytest.raises(HTTPException) as error:
        service.create(payload, user)
    assert error.value.status_code == 409


def test_accepting_request_assigns_donation_and_declines_other_pending_requests():
    db, donation_id, ngo_id, donor_id = setup_db()
    service = DonationRequestService(db)
    ngo = make_user(UserRole.NGO, organization_id=ngo_id)
    request = service.create(DonationRequestCreate(donation_id=donation_id), ngo)
    other_ngo_id = uuid4()
    db.tables["ngos"].append({"id": str(other_ngo_id), "name": "Community Care"})
    db.tables["donation_requests"].append({
        "id": str(uuid4()), "donation_id": str(donation_id), "ngo_id": str(other_ngo_id),
        "status": "pending", "proposed_pickup_date": None, "notes": "",
        "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    donor = make_user(UserRole.DONOR, user_id=donor_id)
    decided = service.decide(request.id, DonationRequestDecision(status="accepted"), donor)
    assert decided.status == DonationRequestStatus.ACCEPTED
    assert db.tables["donations"][0]["matched_ngo_id"] == str(ngo_id)
    assert db.tables["donations"][0]["status"] == "Matched"
    assert db.tables["donation_requests"][1]["status"] == "declined"


def test_donor_cannot_decide_request_for_another_donors_donation():
    db, donation_id, ngo_id, _ = setup_db()
    service = DonationRequestService(db)
    request = service.create(DonationRequestCreate(donation_id=donation_id), make_user(UserRole.NGO, organization_id=ngo_id))
    with pytest.raises(HTTPException) as error:
        service.decide(request.id, DonationRequestDecision(status="declined"), make_user(UserRole.DONOR))
    assert error.value.status_code == 403


def test_request_for_already_matched_donation_is_rejected():
    db, donation_id, ngo_id, _ = setup_db()
    db.tables["donations"][0]["status"] = "Matched"
    db.tables["donations"][0]["matched_ngo_id"] = str(uuid4())
    with pytest.raises(HTTPException) as error:
        DonationRequestService(db).create(DonationRequestCreate(donation_id=donation_id), make_user(UserRole.NGO, organization_id=ngo_id))
    assert error.value.status_code == 409


def test_unlinked_ngo_cannot_submit_request():
    db, donation_id, _, _ = setup_db()
    with pytest.raises(HTTPException) as error:
        DonationRequestService(db).create(DonationRequestCreate(donation_id=donation_id), make_user(UserRole.NGO))
    assert error.value.status_code == 403
