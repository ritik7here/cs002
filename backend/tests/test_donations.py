from uuid import uuid4
from backend.tests.conftest import DONATION_1_ID, DONATION_5_ID

def test_list_donations_public(client):
    """Happy path: listing donations is accessible and returns items."""
    response = client.get("/api/v1/donations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    # Public donation browsing must not expose private donor/pickup details.
    for donation in data:
        assert "donor_id" not in donation
        assert "donor_name" not in donation
        assert "donor_email" not in donation
        assert "pickup_address" not in donation
        assert "pincode" not in donation
        assert "proof_photos" not in donation

def test_list_donations_filter_by_status(client):
    """Happy path: filtering donations by status works."""
    distributed_res = client.get("/api/v1/donations?status=Distributed")
    assert distributed_res.status_code == 200
    for d in distributed_res.json():
        assert d["status"] == "Distributed"

    submitted_res = client.get("/api/v1/donations?status=Submitted")
    assert submitted_res.status_code == 200
    for d in submitted_res.json():
        assert d["status"] == "Submitted"

def test_list_donations_filter_by_category(client):
    """Happy path: filtering donations by category works."""
    food_res = client.get("/api/v1/donations?category=Food%20%26%20Groceries")
    assert food_res.status_code == 200
    for d in food_res.json():
        assert d["category"] == "Food & Groceries"

def test_get_donation_by_id_success(client, donor_token):
    """Owner can get private details with derived timeline and enriched profile."""
    response = client.get(
        f"/api/v1/donations/{DONATION_1_ID}",
        headers={"Authorization": f"Bearer {donor_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Nutritious High-Protein Grain & Pulse Food Parcels (80 Kits)"
    assert data["donor_name"] == "Sophia Chen"
    assert data["matched_ngo_name"] == "Aashraya Community Foundation"
    assert len(data["proof_photos"]) > 0
    # Derived timeline checks
    assert len(data["tracking_timeline"]) == 6
    assert data["tracking_timeline"][0]["status"] == "Submitted"
    assert data["tracking_timeline"][0]["completed"] is True
    assert data["tracking_timeline"][5]["status"] == "Distributed"
    assert data["tracking_timeline"][5]["completed"] is True

def test_get_donation_by_id_not_found(client, donor_token):
    """404: authenticated request for a non-existent donation returns 404."""
    response = client.get(
        f"/api/v1/donations/{uuid4()}",
        headers={"Authorization": f"Bearer {donor_token}"},
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_get_donation_by_id_requires_authentication(client):
    response = client.get(f"/api/v1/donations/{DONATION_1_ID}")
    assert response.status_code == 401


def test_donor_cannot_read_another_donors_private_donation(client, ananya_donor_token):
    response = client.get(
        f"/api/v1/donations/{DONATION_1_ID}",
        headers={"Authorization": f"Bearer {ananya_donor_token}"},
    )
    assert response.status_code == 403


def test_ngo_cannot_use_my_donations_endpoint(client, ngo_token):
    response = client.get(
        "/api/v1/donations/my",
        headers={"Authorization": f"Bearer {ngo_token}"},
    )
    assert response.status_code == 403


def test_create_donation_without_token(client):
    """401: pledging donation without authentication returns 401."""
    payload = {
        "title": "Winter Woolen Blankets",
        "category": "Clothing & Blankets",
        "quantity": 25,
        "unit": "Blanket Sets",
        "condition": "Brand New",
        "pickup_address": "123 Hill Road, Bandra",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400050",
    }
    response = client.post("/api/v1/donations", json=payload)
    assert response.status_code == 401

def test_create_donation_forbidden_for_ngo(client, ngo_token):
    """403: users with 'ngo' role cannot pledge donations (donor role only)."""
    payload = {
        "title": "Winter Woolen Blankets",
        "category": "Clothing & Blankets",
        "quantity": 25,
        "unit": "Blanket Sets",
        "condition": "Brand New",
        "pickup_address": "123 Hill Road, Bandra",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400050",
    }
    response = client.post(
        "/api/v1/donations",
        json=payload,
        headers={"Authorization": f"Bearer {ngo_token}"}
    )
    assert response.status_code == 403

def test_create_donation_validation_zero_or_negative_quantity(client, donor_token):
    """422: quantity <= 0 is rejected by schema validator."""
    payload = {
        "title": "Winter Woolen Blankets",
        "category": "Clothing & Blankets",
        "quantity": 0,  # Invalid
        "unit": "Blanket Sets",
        "condition": "Brand New",
        "pickup_address": "123 Hill Road, Bandra",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400050",
    }
    response = client.post(
        "/api/v1/donations",
        json=payload,
        headers={"Authorization": f"Bearer {donor_token}"}
    )
    assert response.status_code == 422

def test_create_donation_validation_missing_required_address(client, donor_token):
    """422: missing pickup location fields (defect #10: no silent defaults allowed)."""
    payload = {
        "title": "Winter Woolen Blankets",
        "category": "Clothing & Blankets",
        "quantity": 10,
        "unit": "Blanket Sets",
        "condition": "Brand New",
        # Missing pickup_address, city, state, pincode
    }
    response = client.post(
        "/api/v1/donations",
        json=payload,
        headers={"Authorization": f"Bearer {donor_token}"}
    )
    assert response.status_code == 422

def test_create_donation_success(client, donor_token):
    """Happy path: donor pledges donation with full required data."""
    payload = {
        "title": "30 Pediatric First Aid Kits",
        "category": "Medical Supplies",
        "description": "Essential sterile dressings and pediatric supplies.",
        "quantity": 30,
        "unit": "Kits",
        "estimated_value": 450.0,
        "condition": "Brand New",
        "pickup_address": "Flat 802, Ocean View, Worli",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400018",
        "urgency": "High",
    }
    response = client.post(
        "/api/v1/donations",
        json=payload,
        headers={"Authorization": f"Bearer {donor_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "30 Pediatric First Aid Kits"
    assert data["quantity"] == 30
    assert data["status"] == "Submitted"
    assert data["donor_name"] == "Sophia Chen"
    assert len(data["tracking_timeline"]) == 6
    assert data["tracking_timeline"][0]["status"] == "Submitted"
    assert data["tracking_timeline"][0]["completed"] is True
    assert data["tracking_timeline"][1]["completed"] is False

def test_list_my_donations(client, donor_token, ananya_donor_token):
    """Happy path: donor retrieves their own pledged donations."""
    sophia_res = client.get(
        "/api/v1/donations/my",
        headers={"Authorization": f"Bearer {donor_token}"}
    )
    assert sophia_res.status_code == 200
    for d in sophia_res.json():
        assert d["donor_name"] == "Sophia Chen"

    ananya_res = client.get(
        "/api/v1/donations/my",
        headers={"Authorization": f"Bearer {ananya_donor_token}"}
    )
    assert ananya_res.status_code == 200
    for d in ananya_res.json():
        assert d["donor_name"] == "Ananya Sharma"
