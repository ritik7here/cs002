from uuid import uuid4

from app.schemas.donation import DonationNGOResponse


def test_ngo_donation_summary_includes_relationship_ids_without_private_contact_fields():
    donation_id = uuid4()
    ngo_id = uuid4()
    requirement_id = uuid4()

    response = DonationNGOResponse(
        id=donation_id,
        title="Food parcels",
        category="Food & Groceries",
        description="Shelf-stable food parcels",
        quantity=25,
        unit="kits",
        condition="Brand New",
        city="Dehradun",
        state="Uttarakhand",
        urgency="Medium",
        status="Matched",
        donor_name="Donor Display Name",
        matched_ngo_id=ngo_id,
        target_requirement_id=requirement_id,
    )

    payload = response.model_dump()

    assert payload["matched_ngo_id"] == ngo_id
    assert payload["target_requirement_id"] == requirement_id
    assert payload["donor_name"] == "Donor Display Name"
    assert "donor_email" not in payload
    assert "pickup_address" not in payload
    assert "pincode" not in payload
