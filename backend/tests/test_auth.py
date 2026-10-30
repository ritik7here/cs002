import pytest
from uuid import uuid4
from backend.app.core.security import create_access_token

def test_health(client):
    """Happy path: health check returns 200 and operational status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data

def test_root(client):
    """Happy path: root landing page returns 200."""
    response = client.get("/")
    assert response.status_code == 200
    assert "KindredBridge API" in response.json()["message"]

def test_me_without_token(client):
    """Unauthorized: calling protected endpoint with no token returns 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_me_with_invalid_token(client):
    """Unauthorized: malformed token returns 401."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer this-is-not-a-valid-token"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid authentication token"

def test_me_with_expired_token(client, expired_token):
    """Unauthorized: expired token returns 401."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Token has expired"

def test_me_success_donor(client, donor_token):
    """Happy path: authenticated donor receives their profile."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {donor_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Sophia Chen"
    assert data["role"] == "donor"
    assert data["email"] == "sophia.chen@example.org"

def test_me_success_ngo(client, ngo_token):
    """Happy path: authenticated NGO user receives their profile."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {ngo_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Dr. Aarav Patel"
    assert data["role"] == "ngo"
    assert data["organization_id"] == "b0000000-0000-0000-0000-000000000001"

def test_me_success_admin(client, admin_token):
    """Happy path: authenticated admin receives their profile."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Elena Vance"
    assert data["role"] == "admin"

def test_me_unknown_user(client):
    """Unauthorized: valid token but unknown user ID in DB returns 401."""
    token = create_access_token({"sub": str(uuid4()), "role": "authenticated"})
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "User profile not found"

def test_suspended_user_forbidden(client, suspended_token):
    """Forbidden: valid token for suspended user returns 403."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {suspended_token}"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "User account is suspended"

def test_admin_role_guard(client, donor_token, admin_token):
    """Role authorization check: non-admin gets 403, admin gets 200."""
    # Donor tries to access admin endpoint
    donor_res = client.get(
        "/api/v1/auth/test/admin",
        headers={"Authorization": f"Bearer {donor_token}"}
    )
    assert donor_res.status_code == 403
    assert "Operation not permitted for role 'donor'" in donor_res.json()["detail"]

    # Admin accesses admin endpoint
    admin_res = client.get(
        "/api/v1/auth/test/admin",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_res.status_code == 200
    assert admin_res.json()["message"] == "Admin access granted"

def test_ngo_role_guard(client, donor_token, ngo_token):
    """Role authorization check: donor gets 403 on NGO route, NGO gets 200."""
    donor_res = client.get(
        "/api/v1/auth/test/ngo",
        headers={"Authorization": f"Bearer {donor_token}"}
    )
    assert donor_res.status_code == 403

    ngo_res = client.get(
        "/api/v1/auth/test/ngo",
        headers={"Authorization": f"Bearer {ngo_token}"}
    )
    assert ngo_res.status_code == 200
    assert ngo_res.json()["message"] == "NGO access granted"
