from datetime import date, timedelta
from uuid import uuid4
import pytest
from fastapi import HTTPException
from backend.app.schemas.auth import UserProfile, UserRole
from backend.app.schemas.distribution import DistributionCreate
from backend.app.services.distribution_service import DistributionService

class Result:
    def __init__(self, data): self.data = data

class Query:
    def __init__(self, db, table):
        self.db, self.table_name = db, table
        self.filters, self.action, self.payload = [], "select", None
    def select(self, *_args): return self
    def insert(self, payload): self.action, self.payload = "insert", payload; return self
    def update(self, payload): self.action, self.payload = "update", payload; return self
    def eq(self, key, value): self.filters.append(("eq", key, value)); return self
    def in_(self, key, values): self.filters.append(("in", key, values)); return self
    def order(self, *_args, **_kwargs): return self
    def execute(self):
        rows = self.db.tables.setdefault(self.table_name, [])
        def matches(row):
            return all((row.get(k) == v if op == "eq" else row.get(k) in v) for op,k,v in self.filters)
        selected = [r for r in rows if matches(r)]
        if self.action == "insert":
            rows.append(dict(self.payload)); return Result([dict(self.payload)])
        if self.action == "update":
            for row in selected: row.update(self.payload)
            return Result([])
        return Result([dict(r) for r in selected])

class FakeDB:
    def __init__(self, tables): self.tables = tables
    def table(self, name): return Query(self, name)
    def rpc(self, name, params):
        assert name == "record_distribution_event"
        donation = next(d for d in self.tables["donations"] if d["id"] == params["p_donation_id"])
        existing = sum(r["quantity_distributed"] for r in self.tables["distributions"] if r["donation_id"] == donation["id"])
        qty = params["p_quantity_distributed"]
        if donation["status"] != "Received by NGO": raise RuntimeError("Donation must be received by the NGO")
        if existing + qty > donation["quantity"]: raise RuntimeError("Distribution quantity exceeds the remaining donated quantity")
        row = {"id":params["p_id"], "donation_id":params["p_donation_id"], "ngo_id":params["p_ngo_id"], "distribution_date":params["p_distribution_date"], "quantity_distributed":qty, "location":params["p_location"], "beneficiaries_reached":params["p_beneficiaries_reached"], "proof_image_url":params["p_proof_image_url"], "impact_report":params["p_impact_report"], "notes_to_donor":params["p_notes_to_donor"], "created_at":"2026-10-25T00:00:00+00:00", "updated_at":"2026-10-25T00:00:00+00:00"}
        self.tables["distributions"].append(row)
        if existing + qty == donation["quantity"]: donation["status"] = "Distributed"
        return RpcQuery(params["p_id"])

class RpcQuery:
    def __init__(self, data): self.data = data
    def execute(self): return Result(self.data)

def make_user(role, user_id=None, org=None):
    return UserProfile(id=user_id or uuid4(), name="Test User", email="test@example.org", role=role, organization_id=org, status="active")

def setup():
    donation_id, donor_id, ngo_id = uuid4(), uuid4(), uuid4()
    db = FakeDB({"donations":[{"id":str(donation_id),"donor_id":str(donor_id),"title":"Food kits","quantity":10,"unit":"kits","status":"In Transit","matched_ngo_id":str(ngo_id),"city":"Delhi"}],"distributions":[],"profiles":[{"id":str(donor_id),"name":"Donor"}],"ngos":[{"id":str(ngo_id),"name":"Helping Hands"}],"audit_logs":[]})
    return db, donation_id, donor_id, ngo_id

def payload(donation_id, qty=4):
    return DistributionCreate(donation_id=donation_id, distribution_date=date.today(), quantity_distributed=qty, location="Community center", beneficiaries_reached=5, impact_report="Distributed food kits to local families.", notes_to_donor="Thank you")

def test_assigned_ngo_confirms_receipt_and_audit_is_written():
    db, donation_id, _, ngo_id = setup(); svc=DistributionService(db); ngo=make_user(UserRole.NGO, org=ngo_id)
    result=svc.confirm_received(donation_id, ngo)
    assert result["status"] == "Received by NGO"
    assert db.tables["audit_logs"][0]["action"] == "distribution_received_by_ngo"

def test_unassigned_ngo_cannot_confirm_receipt():
    db, donation_id, _, _ = setup()
    with pytest.raises(HTTPException) as exc: DistributionService(db).confirm_received(donation_id, make_user(UserRole.NGO, org=uuid4()))
    assert exc.value.status_code == 403

def test_partial_distribution_persists_and_does_not_mark_fully_distributed():
    db, donation_id, _, ngo_id = setup(); svc=DistributionService(db); ngo=make_user(UserRole.NGO, org=ngo_id)
    svc.confirm_received(donation_id, ngo)
    result=svc.create(payload(donation_id, 4), ngo)
    assert result.quantity_distributed == 4
    assert db.tables["donations"][0]["status"] == "Received by NGO"

def test_final_distribution_updates_donation_status():
    db, donation_id, _, ngo_id = setup(); svc=DistributionService(db); ngo=make_user(UserRole.NGO, org=ngo_id)
    svc.confirm_received(donation_id, ngo)
    svc.create(payload(donation_id, 4), ngo)
    svc.create(payload(donation_id, 6), ngo)
    assert db.tables["donations"][0]["status"] == "Distributed"
    assert len(db.tables["distributions"]) == 2

def test_cannot_distribute_more_than_remaining_quantity():
    db, donation_id, _, ngo_id = setup(); svc=DistributionService(db); ngo=make_user(UserRole.NGO, org=ngo_id)
    svc.confirm_received(donation_id, ngo)
    svc.create(payload(donation_id, 7), ngo)
    with pytest.raises(HTTPException) as exc: svc.create(payload(donation_id, 4), ngo)
    assert exc.value.status_code == 409

def test_donor_cannot_create_distribution_record():
    db, donation_id, donor_id, ngo_id = setup(); svc=DistributionService(db); ngo=make_user(UserRole.NGO, org=ngo_id)
    svc.confirm_received(donation_id, ngo)
    with pytest.raises(HTTPException) as exc: svc.create(payload(donation_id, 2), make_user(UserRole.DONOR, user_id=donor_id))
    assert exc.value.status_code == 403

def test_donor_sees_only_own_distribution_records():
    db, donation_id, donor_id, ngo_id = setup(); svc=DistributionService(db); ngo=make_user(UserRole.NGO, org=ngo_id)
    svc.confirm_received(donation_id, ngo); svc.create(payload(donation_id, 2), ngo)
    assert len(svc.list_for_user(make_user(UserRole.DONOR, user_id=donor_id))) == 1
    assert svc.list_for_user(make_user(UserRole.DONOR)) == []
