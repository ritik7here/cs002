from uuid import uuid4
from backend.tests.conftest import VERIFIED_NGO_ID, PENDING_NGO_ID

def test_list_ngos_public(client):
    """Happy path: listing NGOs is public and returns list."""
    response = client.get("/api/v1/ngos")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2

def test_list_ngos_filter_by_status(client):
    """Happy path: filtering NGOs by verification status works."""
    verified_res = client.get("/api/v1/ngos?status=verified")
    assert verified_res.status_code == 200
    for ngo in verified_res.json():
        assert ngo["verification_status"] == "verified"

    pending_res = client.get("/api/v1/ngos?status=pending")
    assert pending_res.status_code == 200
    for ngo in pending_res.json():
        assert ngo["verification_status"] == "pending"

def test_get_ngo_by_id_success(client):
    """Happy path: retrieve NGO details by ID."""
    response = client.get(f"/api/v1/ngos/{VERIFIED_NGO_ID}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Aashraya Community Foundation"
    assert data["verification_status"] == "verified"

def test_get_ngo_by_id_not_found(client):
    """404: querying non-existent NGO returns 404."""
    response = client.get(f"/api/v1/ngos/{uuid4()}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_register_ngo_without_token(client):
    """401: registering an NGO without authentication returns 401."""
    payload = {
        "name": "New Hope Trust",
        "registration_number": "MH/2026/001122",
        "tax_exempt_id": "AACTA1234F",
        "contact_email": "contact@newhopetrust.org",
        "phone": "+91 98765 43210",
        "address": "123 Main Street",
        "city": "Pune",
        "state": "Maharashtra",
        "causes": ["Education & Youth"],
    }
    response = client.post("/api/v1/ngos", json=payload)
    assert response.status_code == 401

def test_register_ngo_by_donor_forbidden(client, donor_token):
    """403: user with 'donor' role cannot register an NGO."""
    payload = {
        "name": "New Hope Trust",
        "registration_number": "MH/2026/001122",
        "tax_exempt_id": "AACTA1234F",
        "contact_email": "contact@newhopetrust.org",
        "phone": "+91 98765 43210",
        "address": "123 Main Street",
        "city": "Pune",
        "state": "Maharashtra",
        "causes": ["Education & Youth"],
    }
    response = client.post(
        "/api/v1/ngos",
        json=payload,
        headers={"Authorization": f"Bearer {donor_token}"}
    )
    assert response.status_code == 403
    assert "Only users with the 'ngo' role" in response.json()["detail"]

def test_register_ngo_validation_failure(client, unlinked_ngo_token):
    """422: invalid input (e.g. malformed email or missing required fields) fails validation."""
    invalid_payload = {
        "name": "N",  # Too short (min 2)
        "registration_number": "",  # Empty
        "contact_email": "not-an-email",  # Invalid email
    }
    response = client.post(
        "/api/v1/ngos",
        json=invalid_payload,
        headers={"Authorization": f"Bearer {unlinked_ngo_token}"}
    )
    assert response.status_code == 422

def test_register_ngo_success(client, unlinked_ngo_token):
    """Happy path: unlinked NGO user registers an NGO successfully."""
    payload = {
        "name": "Sahyog Child Welfare Mission",
        "registration_number": "DL/2026/009988",
        "tax_exempt_id": "DDTR8877FF009",
        "contact_email": "info@sahyogmission.org",
        "phone": "+91 98111 22334",
        "address": "45 Institutional Area",
        "city": "New Delhi",
        "state": "Delhi",
        "website": "https://sahyogmission.org",
        "founded_year": 2026,
        "description": "Child welfare and nutrition support across regional schools.",
        "causes": ["Education & Youth", "Hunger & Nutrition"],
    }
    response = client.post(
        "/api/v1/ngos",
        json=payload,
        headers={"Authorization": f"Bearer {unlinked_ngo_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Sahyog Child Welfare Mission"
    assert data["verification_status"] == "pending"
    assert data["slug"] == "sahyog-child-welfare-mission"
    assert data["logo_initial"] == "SC"
    assert data["trust_score"] == 70

def test_register_ngo_already_associated(client, ngo_token):
    """400: user already linked to an NGO cannot register a second one."""
    payload = {
        "name": "Duplicate Organization",
        "registration_number": "MH/2026/009911",
        "tax_exempt_id": "DUMMY1234",
        "contact_email": "dup@example.org",
        "phone": "+91 98000 00000",
        "address": "Somewhere",
        "city": "Mumbai",
        "state": "Maharashtra",
    }
    response = client.post(
        "/api/v1/ngos",
        json=payload,
        headers={"Authorization": f"Bearer {ngo_token}"}
    )
    assert response.status_code == 400
    assert "already associated" in response.json()["detail"]

def test_update_verification_without_token(client):
    """401: updating verification without token returns 401."""
    response = client.patch(
        f"/api/v1/ngos/{PENDING_NGO_ID}/verification",
        json={"verification_status": "verified"}
    )
    assert response.status_code == 401

def test_update_verification_forbidden_for_non_admin(client, ngo_token, donor_token):
    """403: updating verification by donor or NGO is forbidden."""
    for token in [ngo_token, donor_token]:
        response = client.patch(
            f"/api/v1/ngos/{PENDING_NGO_ID}/verification",
            json={"verification_status": "verified"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403

def test_update_verification_not_found(client, admin_token):
    """404: admin verifying non-existent NGO returns 404."""
    response = client.patch(
        f"/api/v1/ngos/{uuid4()}/verification",
        json={"verification_status": "verified"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 404

def test_update_verification_validation_failure(client, admin_token):
    """422: invalid status enum value returns 422."""
    response = client.patch(
        f"/api/v1/ngos/{PENDING_NGO_ID}/verification",
        json={"verification_status": "invalid_status_enum"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 422

def test_update_verification_success_by_admin(client, admin_token):
    """Happy path: admin approves pending NGO and updates verification status to verified."""
    response = client.patch(
        f"/api/v1/ngos/{PENDING_NGO_ID}/verification",
        json={"verification_status": "verified", "reason": "All 80G and incorporation documents audited and valid."},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["verification_status"] == "verified"
    assert data["trust_score"] >= 80

def test_verified_ngo_gate_allows_verified_ngo(client, ngo_token):
    """Gate verification: verified NGO user passes the gate."""
    response = client.post(
        "/api/v1/ngos/test/verified-action",
        headers={"Authorization": f"Bearer {ngo_token}"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Action allowed: NGO is verified"

def test_verified_ngo_gate_blocks_unverified_ngo(client, unverified_ngo_token):
    """Gate verification: unverified NGO user is blocked (403 Forbidden)."""
    response = client.post(
        "/api/v1/ngos/test/verified-action",
        headers={"Authorization": f"Bearer {unverified_ngo_token}"}
    )
    assert response.status_code == 403
    assert "NGO verification status is 'pending'" in response.json()["detail"]
    assert "Must be 'verified' by an administrator" in response.json()["detail"]

def test_verified_ngo_gate_blocks_donor(client, donor_token):
    """Gate verification: donor user is blocked from NGO-gated actions."""
    response = client.post(
        "/api/v1/ngos/test/verified-action",
        headers={"Authorization": f"Bearer {donor_token}"}
    )
    assert response.status_code == 403
    assert "restricted to NGO accounts" in response.json()["detail"]


def test_update_own_ngo_profile_success(client, ngo_token):
    response = client.patch(
        f"/api/v1/ngos/{VERIFIED_NGO_ID}",
        json={"name": "Aashraya Community Foundation Updated", "mission_statement": "Supporting local communities."},
        headers={"Authorization": f"Bearer {ngo_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Aashraya Community Foundation Updated"
    assert data["slug"] == "aashraya-community-foundation-updated"
    assert data["mission_statement"] == "Supporting local communities."


def test_update_ngo_profile_cannot_edit_another_organization(client, ngo_token):
    response = client.patch(
        f"/api/v1/ngos/{PENDING_NGO_ID}",
        json={"description": "Unauthorized edit"},
        headers={"Authorization": f"Bearer {ngo_token}"},
    )
    assert response.status_code == 403


def test_update_ngo_profile_forbidden_for_donor(client, donor_token):
    response = client.patch(
        f"/api/v1/ngos/{VERIFIED_NGO_ID}",
        json={"description": "Donor edit"},
        headers={"Authorization": f"Bearer {donor_token}"},
    )
    assert response.status_code == 403
