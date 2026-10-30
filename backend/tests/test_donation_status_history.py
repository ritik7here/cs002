from datetime import datetime, timezone

from backend.app.schemas.donation import DonationStatus
from backend.app.services.donation_service import derive_timeline


def test_timeline_uses_saved_transition_times_not_donation_updated_at():
    created = datetime(2026, 10, 20, 8, 0, tzinfo=timezone.utc)
    history = [
        {"from_status": None, "to_status": "Submitted", "changed_at": "2026-10-20T08:00:00+00:00"},
        {"from_status": "Submitted", "to_status": "Matched", "changed_at": "2026-10-20T10:15:00+00:00"},
        {"from_status": "Matched", "to_status": "Pickup Scheduled", "changed_at": "2026-10-21T12:30:00+00:00"},
        {"from_status": "Pickup Scheduled", "to_status": "In Transit", "changed_at": "2026-10-22T09:05:00+00:00"},
        {"from_status": "In Transit", "to_status": "Received by NGO", "changed_at": "2026-10-22T11:20:00+00:00"},
    ]

    timeline = derive_timeline(
        current_status=DonationStatus.RECEIVED_BY_NGO,
        created_at=created,
        updated_at=datetime(2026, 10, 25, 18, 0, tzinfo=timezone.utc),
        ngo_name="Example NGO",
        history=history,
    )

    assert len(timeline) == 6
    assert timeline[1].timestamp == "2026-10-20T10:15:00+00:00"
    assert timeline[2].timestamp == "2026-10-21T12:30:00+00:00"
    assert timeline[3].timestamp == "2026-10-22T09:05:00+00:00"
    assert timeline[4].timestamp == "2026-10-22T11:20:00+00:00"
    assert timeline[5].completed is False
    assert timeline[5].timestamp is None


def test_pre_migration_donation_does_not_reuse_updated_at_for_old_milestones():
    created = datetime(2026, 10, 20, 8, 0, tzinfo=timezone.utc)
    updated = datetime(2026, 10, 25, 18, 0, tzinfo=timezone.utc)

    timeline = derive_timeline(
        current_status=DonationStatus.DISTRIBUTED,
        created_at=created,
        updated_at=updated,
        history=[],
    )

    assert all(step.completed for step in timeline)
    assert timeline[0].timestamp == created.isoformat()
    assert all(step.timestamp is None for step in timeline[1:])
    assert all("timestamp unavailable" in (step.notes or "").lower() for step in timeline[1:])
