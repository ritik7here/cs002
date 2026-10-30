from backend.app.services.donation_match_service import calculate_match_score


def _donation(**overrides):
    row = {
        "category": "Food & Groceries",
        "city": "Mumbai",
        "state": "Maharashtra",
        "urgency": "High",
        "quantity": 100,
        "unit": "kits",
    }
    row.update(overrides)
    return row


def _requirement(**overrides):
    row = {
        "category": "Food & Groceries",
        "ngo_city": "Mumbai",
        "ngo_state": "Maharashtra",
        "urgency": "High",
        "target_quantity": 80,
        "fulfilled_quantity": 10,
        "unit": "KITS",
    }
    row.update(overrides)
    return row


def test_exact_category_and_logistics_match_scores_transparently():
    score, reasons = calculate_match_score(_donation(), _requirement())
    assert score == 100
    assert "Donation category matches the NGO requirement" in reasons
    assert "Donation and NGO are in the same city" in reasons
    assert "Donation quantity can cover the remaining requirement" in reasons


def test_category_mismatch_is_not_recommended():
    score, reasons = calculate_match_score(
        _donation(category="Medical Supplies"), _requirement()
    )
    assert score == 0
    assert reasons == []


def test_category_only_match_has_a_clear_base_score():
    score, reasons = calculate_match_score(
        _donation(city="Pune", state="Goa", urgency="Low", unit="boxes"),
        _requirement(ngo_city="Mumbai", ngo_state="Maharashtra", urgency="High", unit="kits"),
    )
    assert score == 60
    assert reasons == ["Donation category matches the NGO requirement"]


def test_matching_unit_with_insufficient_quantity_gets_partial_quantity_credit():
    score, reasons = calculate_match_score(
        _donation(quantity=10), _requirement(target_quantity=80, fulfilled_quantity=10)
    )
    assert score == 97
    assert "Donation unit matches, but more quantity may be needed" in reasons


class _Result:
    def __init__(self, data):
        self.data = data


class _Query:
    def __init__(self, db, table):
        self.db = db
        self.table_name = table
        self.filters = []
        self.payload = None

    def select(self, *_args):
        return self

    def eq(self, key, value):
        self.filters.append(("eq", key, value))
        return self

    def in_(self, key, values):
        self.filters.append(("in", key, values))
        return self

    def is_(self, key, value):
        self.filters.append(("is", key, value))
        return self

    def order(self, *_args, **_kwargs):
        return self

    def upsert(self, payload, **_kwargs):
        self.payload = payload
        self.db.upserted.extend(payload)
        return self

    def execute(self):
        if self.payload is not None:
            return _Result(self.payload)
        rows = list(self.db.tables.get(self.table_name, []))
        for op, key, value in self.filters:
            if op == "eq":
                rows = [row for row in rows if str(row.get(key)) == str(value)]
            elif op == "in":
                rows = [row for row in rows if row.get(key) in value]
            elif op == "is" and value == "null":
                rows = [row for row in rows if row.get(key) is None]
        return _Result(rows)


class _FakeDB:
    def __init__(self, tables):
        self.tables = tables
        self.upserted = []

    def table(self, table_name):
        return _Query(self, table_name)


def _active_donation(donation_id, donor_id, **overrides):
    row = {
        "id": donation_id, "donor_id": donor_id, "title": "Food kits",
        "category": "Food & Groceries", "description": "Sealed kits", "quantity": 100,
        "unit": "kits", "city": "Mumbai", "state": "Maharashtra", "urgency": "High",
        "condition": "Brand New", "status": "Submitted", "matched_ngo_id": None,
        "created_at": "2026-10-25T10:00:00+00:00",
    }
    row.update(overrides)
    return row


def _active_requirement(requirement_id, ngo_id, **overrides):
    row = {
        "id": requirement_id, "ngo_id": ngo_id, "title": "Food support kits",
        "category": "Food & Groceries", "cause": "Hunger & Nutrition", "target_quantity": 80,
        "fulfilled_quantity": 10, "unit": "kits", "urgency": "High", "description": "For families",
        "beneficiary_group": "Local families", "needed_by_date": None, "status": "Open",
    }
    row.update(overrides)
    return row


def test_donor_recommendations_only_include_their_own_submitted_donations():
    from uuid import UUID
    from backend.app.schemas.auth import UserProfile, UserRole
    from backend.app.services.donation_match_service import DonationMatchService

    donor_id = "a0000000-0000-0000-0000-000000000001"
    other_donor_id = "a0000000-0000-0000-0000-000000000005"
    ngo_id = "b0000000-0000-0000-0000-000000000001"
    db = _FakeDB({
        "ngos": [{"id": ngo_id, "name": "Verified NGO", "city": "Mumbai", "state": "Maharashtra", "verification_status": "verified"}],
        "requirements": [_active_requirement("c0000000-0000-0000-0000-000000000001", ngo_id)],
        "donations": [
            _active_donation("d0000000-0000-0000-0000-000000000001", donor_id),
            _active_donation("d0000000-0000-0000-0000-000000000005", other_donor_id),
        ],
        "profiles": [],
    })
    user = UserProfile(id=UUID(donor_id), name="Donor", email="donor@example.org", role=UserRole.DONOR)

    matches = DonationMatchService(db).list_recommendations(user)

    assert len(matches) == 1
    assert str(matches[0].donation.id) == "d0000000-0000-0000-0000-000000000001"
    assert len(db.upserted) == 1
    assert db.tables["donations"][0]["status"] == "Submitted"  # recommendations never reserve donations


def test_unverified_ngo_cannot_get_recommendations():
    from uuid import UUID
    import pytest
    from fastapi import HTTPException
    from backend.app.schemas.auth import UserProfile, UserRole
    from backend.app.services.donation_match_service import DonationMatchService

    ngo_user_id = "a0000000-0000-0000-0000-000000000006"
    ngo_id = "b0000000-0000-0000-0000-000000000005"
    db = _FakeDB({"ngos": [{"id": ngo_id, "name": "Pending NGO", "city": "Kolkata", "state": "West Bengal", "verification_status": "pending"}]})
    user = UserProfile(id=UUID(ngo_user_id), name="NGO Rep", email="ngo@example.org", role=UserRole.NGO, organization_id=UUID(ngo_id))

    with pytest.raises(HTTPException) as error:
        DonationMatchService(db).list_recommendations(user)
    assert error.value.status_code == 403
