from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import Depends, HTTPException, status
from ..schemas.donation import (
    DonationCreate,
    DonationResponse,
    DonationCategory,
    DonationStatus,
    ItemCondition,
    UrgencyLevel,
    TimelineStep,
    DonationStatusHistoryEntry,
)
from ..schemas.auth import UserProfile, UserRole
from ..core.database import get_db

STATUS_ORDER = [
    DonationStatus.SUBMITTED,
    DonationStatus.MATCHED,
    DonationStatus.PICKUP_SCHEDULED,
    DonationStatus.IN_TRANSIT,
    DonationStatus.RECEIVED_BY_NGO,
    DonationStatus.DISTRIBUTED,
]

def derive_timeline(
    current_status: DonationStatus,
    created_at: Optional[datetime],
    updated_at: Optional[datetime] = None,
    ngo_name: Optional[str] = None,
    history: Optional[List[dict]] = None,
) -> List[TimelineStep]:
    """Build milestone timestamps only from persisted transition events.

    Existing donations may predate history tracking. Their current state can
    establish which sequential milestones were reached, but never the exact
    time of those earlier milestones. Such timestamps deliberately stay null.
    """
    steps = [
        (DonationStatus.SUBMITTED, "Donation Pledged", "Pledged by donor; pending review/matching"),
        (DonationStatus.MATCHED, "Matched with NGO", f"Matched with {ngo_name or 'verified NGO partner'}"),
        (DonationStatus.PICKUP_SCHEDULED, "Pickup Scheduled", "Logistics scheduled for package collection"),
        (DonationStatus.IN_TRANSIT, "In Transit", "Package picked up and in courier transit"),
        (DonationStatus.RECEIVED_BY_NGO, "Received by NGO", f"Inspected and acknowledged by {ngo_name or 'NGO'}"),
        (DonationStatus.DISTRIBUTED, "Distributed to Beneficiaries", "Distribution recorded for beneficiaries"),
    ]
    # Kept in the signature for compatibility with earlier fixture/call sites;
    # updated_at is deliberately not used as a milestone timestamp.
    _ = updated_at
    history = history or []
    reached_statuses = set()
    timestamps = {}
    for event in history:
        for key in ("from_status", "to_status"):
            raw_status = event.get(key)
            if not raw_status:
                continue
            try:
                event_status = DonationStatus(raw_status)
            except ValueError:
                continue
            reached_statuses.add(event_status)
        raw_to = event.get("to_status")
        raw_time = event.get("changed_at")
        if raw_to and raw_time:
            try:
                event_status = DonationStatus(raw_to)
            except ValueError:
                continue
            try:
                parsed_time = datetime.fromisoformat(raw_time.replace("Z", "+00:00")) if isinstance(raw_time, str) else raw_time
            except (ValueError, AttributeError):
                parsed_time = None
            if parsed_time and event_status not in timestamps:
                timestamps[event_status] = parsed_time.isoformat()

    current_idx = STATUS_ORDER.index(current_status) if current_status in STATUS_ORDER else -1
    timeline: List[TimelineStep] = []
    for idx, (step_status, label, description) in enumerate(steps):
        is_completed = idx <= current_idx or step_status in reached_statuses
        timestamp = timestamps.get(step_status)
        if step_status == DonationStatus.SUBMITTED and not timestamp and created_at:
            timestamp = created_at.isoformat()
        notes = description if is_completed else None
        if is_completed and not timestamp:
            notes = f"{description}. Historical timestamp unavailable; this milestone predates persistent status history."
        timeline.append(TimelineStep(
            status=step_status,
            label=label,
            timestamp=timestamp,
            completed=is_completed,
            notes=notes,
        ))

    if current_status == DonationStatus.CANCELLED or DonationStatus.CANCELLED in reached_statuses:
        cancelled_time = timestamps.get(DonationStatus.CANCELLED)
        timeline.append(TimelineStep(
            status=DonationStatus.CANCELLED,
            label="Donation Cancelled",
            timestamp=cancelled_time,
            completed=DonationStatus.CANCELLED in reached_statuses or current_status == DonationStatus.CANCELLED,
            notes=("Donation was cancelled." if cancelled_time else "Cancellation recorded; exact timestamp unavailable."),
        ))
    return timeline

class DonationService:
    def __init__(self, db_client=None):
        self.db = db_client

    def create_donation(self, data: DonationCreate, donor: UserProfile) -> DonationResponse:
        """
        Creates a new donation pledge. Only donors may create pledges.
        Strictly validates inputs; no silent defaults.
        """
        if donor.role != UserRole.DONOR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only accounts with the 'donor' role may pledge donations"
            )

        donation_id = uuid4()
        now = datetime.now(timezone.utc)

        payload = {
            "id": str(donation_id),
            "donor_id": str(donor.id),
            "title": data.title,
            "category": data.category.value if isinstance(data.category, DonationCategory) else str(data.category),
            "description": data.description,
            "quantity": data.quantity,
            "unit": data.unit,
            "estimated_value": data.estimated_value,
            "condition": data.condition.value if isinstance(data.condition, ItemCondition) else str(data.condition),
            "pickup_address": data.pickup_address,
            "city": data.city,
            "state": data.state,
            "pincode": data.pincode,
            "urgency": data.urgency.value if isinstance(data.urgency, UrgencyLevel) else str(data.urgency),
            "status": DonationStatus.SUBMITTED.value,
            "matched_ngo_id": None,
            "target_requirement_id": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }

        if self.db is not None:
            res = self.db.table("donations").insert(payload).execute()
            inserted = res.data[0]

            # Audit log
            self.db.table("audit_logs").insert({
                "id": str(uuid4()),
                "actor_id": str(donor.id),
                "entity_type": "donation",
                "entity_id": str(donation_id),
                "action": "pledged",
                "details": {"title": data.title, "quantity": data.quantity, "unit": data.unit},
                "created_at": now.isoformat(),
            }).execute()

            return self._enrich_donation_response(inserted, donor=donor)

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service not available"
        )

    def list_donations(
        self,
        status_filter: Optional[DonationStatus] = None,
        category_filter: Optional[DonationCategory] = None,
        donor_id: Optional[UUID] = None
    ) -> List[DonationResponse]:
        """
        List donations with optional status, category, and donor filters.
        """
        if self.db is not None:
            query = self.db.table("donations").select("*")
            if status_filter:
                query = query.eq("status", status_filter.value)
            if category_filter:
                query = query.eq("category", category_filter.value)
            if donor_id:
                query = query.eq("donor_id", str(donor_id))

            res = query.order("created_at", desc=True).execute()
            rows = res.data or []
            return self._enrich_donation_responses(rows)

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service not available"
        )

    def get_donation_by_id(self, donation_id: UUID) -> DonationResponse:
        """
        Retrieve single donation with donor details, matched NGO, proof photos, and derived timeline.
        """
        if self.db is not None:
            res = self.db.table("donations").select("*").eq("id", str(donation_id)).execute()
            rows = res.data or []
            if not rows:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Donation with ID '{donation_id}' not found"
                )
            return self._enrich_donation_response(rows[0])

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service not available"
        )

    def _enrich_donation_responses(self, rows: List[dict]) -> List[DonationResponse]:
        """Enrich a list using batched related-table reads instead of N+1 queries."""
        if not rows:
            return []
        if self.db is None:
            return [self._enrich_donation_response(row) for row in rows]

        donation_ids = list(dict.fromkeys(str(row["id"]) for row in rows if row.get("id")))
        donor_ids = list(dict.fromkeys(str(row["donor_id"]) for row in rows if row.get("donor_id")))
        ngo_ids = list(dict.fromkeys(str(row["matched_ngo_id"]) for row in rows if row.get("matched_ngo_id")))
        related = {"profiles": {}, "ngos": {}, "images": {}, "history": {}}

        if donor_ids:
            result = self.db.table("profiles").select("id,name,email").in_("id", donor_ids).execute()
            related["profiles"] = {str(item["id"]): item for item in (result.data or []) if item.get("id")}
        if ngo_ids:
            result = self.db.table("ngos").select("id,name").in_("id", ngo_ids).execute()
            related["ngos"] = {str(item["id"]): item for item in (result.data or []) if item.get("id")}
        if donation_ids:
            result = self.db.table("donation_images").select("donation_id,image_url").in_("donation_id", donation_ids).execute()
            for item in result.data or []:
                if item.get("donation_id"):
                    related["images"].setdefault(str(item["donation_id"]), []).append(item.get("image_url"))
            result = self.db.table("donation_status_history").select(
                "donation_id,from_status,to_status,changed_at"
            ).in_("donation_id", donation_ids).order("changed_at", desc=False).execute()
            for item in result.data or []:
                if item.get("donation_id"):
                    related["history"].setdefault(str(item["donation_id"]), []).append(item)

        return [self._enrich_donation_response(row, related_data=related) for row in rows]

    def _enrich_donation_response(
        self,
        row: dict,
        donor: Optional[UserProfile] = None,
        related_data: Optional[dict] = None,
    ) -> DonationResponse:
        """
        Internal helper to fetch related profile, NGO name, proof images, and build derived timeline.
        """
        donor_name = donor.name if donor else None
        donor_email = donor.email if donor else None
        ngo_name = None
        proof_photos: List[str] = []

        history_rows = []
        if self.db is not None and related_data is not None:
            profile = related_data["profiles"].get(str(row.get("donor_id")), {})
            if not donor_name:
                donor_name = profile.get("name")
                donor_email = profile.get("email")
            ngo = related_data["ngos"].get(str(row.get("matched_ngo_id")), {})
            ngo_name = ngo.get("name")
            proof_photos = [url for url in related_data["images"].get(str(row.get("id")), []) if url]
            history_rows = related_data["history"].get(str(row.get("id")), [])
        elif self.db is not None:
            # Single-record reads keep the existing lookup path.
            if not donor_name and row.get("donor_id"):
                p_res = self.db.table("profiles").select("name, email").eq("id", row["donor_id"]).execute()
                if p_res.data:
                    donor_name = p_res.data[0].get("name")
                    donor_email = p_res.data[0].get("email")
            if row.get("matched_ngo_id"):
                n_res = self.db.table("ngos").select("name").eq("id", row["matched_ngo_id"]).execute()
                if n_res.data:
                    ngo_name = n_res.data[0].get("name")
            img_res = self.db.table("donation_images").select("image_url").eq("donation_id", row["id"]).execute()
            if img_res.data:
                proof_photos = [img["image_url"] for img in img_res.data]
            history_rows = self.db.table("donation_status_history").select(
                "from_status,to_status,changed_at"
            ).eq("donation_id", row["id"]).order("changed_at", desc=False).execute().data or []

        current_status = DonationStatus(row["status"])
        created_at = datetime.fromisoformat(row["created_at"]) if isinstance(row.get("created_at"), str) else row.get("created_at")
        updated_at = datetime.fromisoformat(row["updated_at"]) if isinstance(row.get("updated_at"), str) else row.get("updated_at")

        timeline = derive_timeline(
            current_status=current_status,
            created_at=created_at,
            history=history_rows,
            ngo_name=ngo_name,
        )
        status_history = [
            DonationStatusHistoryEntry(
                from_status=DonationStatus(event["from_status"]) if event.get("from_status") else None,
                to_status=DonationStatus(event["to_status"]),
                changed_at=datetime.fromisoformat(event["changed_at"].replace("Z", "+00:00")) if isinstance(event.get("changed_at"), str) else event["changed_at"],
            )
            for event in history_rows
            if event.get("to_status") and event.get("changed_at")
        ]

        return DonationResponse(
            id=UUID(row["id"]),
            donor_id=UUID(row["donor_id"]),
            donor_name=donor_name,
            donor_email=donor_email,
            title=row["title"],
            category=DonationCategory(row["category"]),
            description=row.get("description", ""),
            quantity=row["quantity"],
            unit=row["unit"],
            estimated_value=float(row["estimated_value"]) if row.get("estimated_value") is not None else None,
            condition=ItemCondition(row["condition"]),
            pickup_address=row["pickup_address"],
            city=row["city"],
            state=row["state"],
            pincode=row["pincode"],
            urgency=UrgencyLevel(row["urgency"]),
            status=current_status,
            matched_ngo_id=UUID(row["matched_ngo_id"]) if row.get("matched_ngo_id") else None,
            matched_ngo_name=ngo_name,
            target_requirement_id=UUID(row["target_requirement_id"]) if row.get("target_requirement_id") else None,
            proof_photos=proof_photos,
            tracking_timeline=timeline,
            status_history=status_history,
            created_at=created_at,
            updated_at=updated_at,
        )

def get_donation_service(db=Depends(get_db)) -> DonationService:
    return DonationService(db_client=db)
