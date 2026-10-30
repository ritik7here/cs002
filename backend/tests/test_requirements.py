def test_create_requirement_requires_authentication(client):
    response = client.post("/api/v1/requirements", json={})
    assert response.status_code == 401


def test_donor_cannot_create_requirement(client, donor_token):
    response = client.post(
        "/api/v1/requirements",
        json={
            "title": "Emergency food kits",
            "category": "Food & Groceries",
            "cause": "Hunger & Nutrition",
            "target_quantity": 100,
            "unit": "kits",
            "urgency": "High",
            "description": "Food kits for households.",
            "beneficiary_group": "Local families",
            "needed_by_date": "2026-11-15",
        },
        headers={"Authorization": f"Bearer {donor_token}"},
    )
    assert response.status_code == 403
    assert "NGO representative" in response.json()["detail"]
