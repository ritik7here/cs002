from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import UUID, uuid4

from fastapi import Depends, HTTPException
from ..core.database import get_db
from .notification_service import emit_notification, notify_organization
from ..schemas.auth import UserProfile, UserRole
from ..schemas.donation import DonationStatus
from ..schemas.pickup import PickupScheduleCreate, PickupStatus, PickupStatusUpdate, PickupResponse


class PickupService:
    def __init__(self, db_client=None):
        self.db = db_client

    def list_for_user(self, user: UserProfile) -> List[PickupResponse]:
        self._require_db()
        if user.role == UserRole.DONOR:
            donation_rows = self.db.table("donations").select("id").eq("donor_id", str(user.id)).execute().data or []
        elif user.role == UserRole.NGO:
            if not user.organization_id:
                raise HTTPException(status_code=403, detail="NGO account is not linked to an organization")
            donation_rows = self.db.table("donations").select("id").eq("matched_ngo_id", str(user.organization_id)).execute().data or []
        elif user.role == UserRole.ADMIN:
            donation_rows = self.db.table("donations").select("id").execute().data or []
        else:
            raise HTTPException(status_code=403, detail="Not authorized to view pickups")
        donation_ids = [str(row["id"]) for row in donation_rows]
        if not donation_ids:
            return []
        rows = self.db.table("pickups").select("*").in_("donation_id", donation_ids).order("created_at", desc=True).execute().data or []
        return [self._enrich(row) for row in rows]

    def schedule(self, payload: PickupScheduleCreate, user: UserProfile) -> PickupResponse:
        self._require_db()
        donation = self._get_donation(payload.donation_id)
        self._authorize_participant(user, donation)
        if not donation.get("matched_ngo_id"):
            raise HTTPException(status_code=409, detail="A donation must be accepted by an NGO before pickup can be scheduled")
        if donation.get("status") not in (DonationStatus.MATCHED.value, DonationStatus.PICKUP_SCHEDULED.value):
            raise HTTPException(status_code=409, detail="Pickup can only be scheduled for a matched donation that has not been picked up")
        scheduled_date = payload.scheduled_date
        if scheduled_date.tzinfo is None:
            scheduled_date = scheduled_date.replace(tzinfo=timezone.utc)
        if scheduled_date <= datetime.now(timezone.utc):
            raise HTTPException(status_code=422, detail="Pickup date and time must be in the future")
        now = datetime.now(timezone.utc).isoformat()
        existing_rows = self.db.table("pickups").select("*").eq("donation_id", str(payload.donation_id)).execute().data or []
        created_new = False
        if existing_rows:
            existing = existing_rows[0]
            if existing.get("status") == PickupStatus.PICKED_UP.value:
                raise HTTPException(status_code=409, detail="This donation has already been picked up")
            pickup_id = existing["id"]
            self.db.table("pickups").update({
                "scheduled_date": scheduled_date.isoformat(), "notes": payload.notes.strip(),
                "status": PickupStatus.SCHEDULED.value, "updated_at": now,
            }).eq("id", pickup_id).execute()
        else:
            pickup_id = str(uuid4())
            row = {
                "id": pickup_id, "donation_id": str(payload.donation_id),
                "scheduled_date": scheduled_date.isoformat(), "picked_up_at": None,
                "status": PickupStatus.SCHEDULED.value, "notes": payload.notes.strip(),
                "created_at": now, "updated_at": now,
            }
            try:
                self.db.table("pickups").insert(row).execute()
                created_new = True
            except Exception as exc:
                raise HTTPException(status_code=409, detail="A pickup already exists for this donation. Refresh and try again.") from exc
        self.db.table("donations").update({"status": DonationStatus.PICKUP_SCHEDULED.value, "updated_at": now}).eq("id", str(payload.donation_id)).eq("matched_ngo_id", donation["matched_ngo_id"]).eq("status", donation.get("status")).execute()
        donation_check = self.db.table("donations").select("status,matched_ngo_id").eq("id", str(payload.donation_id)).execute().data or []
        if (not donation_check or donation_check[0].get("status") != DonationStatus.PICKUP_SCHEDULED.value or donation_check[0].get("matched_ngo_id") != donation["matched_ngo_id"]):
            if created_new:
                self.db.table("pickups").update({"status": PickupStatus.CANCELLED.value, "updated_at": now}).eq("id", pickup_id).execute()
            raise HTTPException(status_code=409, detail="Donation status changed while scheduling pickup. Refresh and try again.")
        self._audit(user, "pickup_scheduled", pickup_id, {"donation_id": str(payload.donation_id), "scheduled_date": scheduled_date.isoformat()})
        donor_id = donation.get("donor_id")
        matched_ngo_id = donation.get("matched_ngo_id")
        title = "Pickup scheduled"
        message = f"Pickup for {donation.get('title') or 'your donation'} is scheduled for {scheduled_date.isoformat()}."
        if user.role != UserRole.DONOR:
            emit_notification(self.db, donor_id, title, message, "info", "pickup-coordination", str(payload.donation_id))
        if user.role != UserRole.NGO:
            notify_organization(self.db, matched_ngo_id, title, message, "info", "pickup-coordination", str(payload.donation_id), str(user.id))
        saved = self.db.table("pickups").select("*").eq("id", pickup_id).execute().data or []
        if not saved:
            raise HTTPException(status_code=500, detail="Pickup was saved but could not be reloaded")
        return self._enrich(saved[0])

    def update_status(self, pickup_id: UUID, payload: PickupStatusUpdate, user: UserProfile) -> PickupResponse:
        self._require_db()
        pickup_rows = self.db.table("pickups").select("*").eq("id", str(pickup_id)).execute().data or []
        if not pickup_rows:
            raise HTTPException(status_code=404, detail="Pickup not found")
        pickup = pickup_rows[0]
        donation = self._get_donation(UUID(pickup["donation_id"]))
        self._authorize_participant(user, donation)
        current = PickupStatus(pickup.get("status", "scheduled"))
        target = payload.status
        allowed = {
            PickupStatus.SCHEDULED: {PickupStatus.CONFIRMED, PickupStatus.CANCELLED},
            PickupStatus.CONFIRMED: {PickupStatus.PICKED_UP, PickupStatus.CANCELLED},
            PickupStatus.PICKED_UP: set(),
            PickupStatus.CANCELLED: set(),
        }
        if target not in allowed[current]:
            raise HTTPException(status_code=409, detail=f"Pickup cannot transition from {current.value} to {target.value}")
        now = datetime.now(timezone.utc).isoformat()
        updates: Dict[str, Any] = {"status": target.value, "updated_at": now}
        if payload.notes is not None:
            updates["notes"] = payload.notes.strip()
        if target == PickupStatus.PICKED_UP:
            updates["picked_up_at"] = now
        self.db.table("pickups").update(updates).eq("id", str(pickup_id)).eq("status", current.value).execute()
        saved = self.db.table("pickups").select("*").eq("id", str(pickup_id)).execute().data or []
        if not saved or saved[0].get("status") != target.value:
            raise HTTPException(status_code=409, detail="Pickup status changed concurrently. Refresh and try again.")

        donation_status = None
        if target == PickupStatus.PICKED_UP:
            donation_status = DonationStatus.IN_TRANSIT.value
        elif target == PickupStatus.CANCELLED and donation.get("status") == DonationStatus.PICKUP_SCHEDULED.value:
            donation_status = DonationStatus.MATCHED.value
        if donation_status:
            self.db.table("donations").update({"status": donation_status, "updated_at": now}).eq("id", str(pickup["donation_id"])).eq("matched_ngo_id", str(donation.get("matched_ngo_id"))).execute()
        self._audit(user, f"pickup_{target.value}", str(pickup["donation_id"]), {"donation_id": str(pickup["donation_id"]), "from_status": current.value, "to_status": target.value})
        title_map = {PickupStatus.CONFIRMED: "Pickup confirmed", PickupStatus.PICKED_UP: "Donation picked up", PickupStatus.CANCELLED: "Pickup cancelled"}
        title = title_map.get(target, "Pickup updated")
        message = f"Pickup for {donation.get('title') or 'a donation'} is now {target.value.replace('_', ' ')}."
        if user.role != UserRole.DONOR:
            emit_notification(self.db, donation.get("donor_id"), title, message, "success" if target != PickupStatus.CANCELLED else "warning", "pickup-coordination", str(pickup["donation_id"]))
        if user.role != UserRole.NGO:
            notify_organization(self.db, donation.get("matched_ngo_id"), title, message, "success" if target != PickupStatus.CANCELLED else "warning", "pickup-coordination", str(pickup["donation_id"]), str(user.id))
        return self._enrich(saved[0])

    def _require_db(self):
        if self.db is None:
            raise HTTPException(status_code=503, detail="Database service not available")

    def _get_donation(self, donation_id: UUID) -> Dict[str, Any]:
        rows = self.db.table("donations").select("*").eq("id", str(donation_id)).execute().data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Donation not found")
        return rows[0]

    @staticmethod
    def _authorize_participant(user: UserProfile, donation: Dict[str, Any]) -> None:
        if user.role == UserRole.ADMIN:
            return
        if user.role == UserRole.DONOR and donation.get("donor_id") == str(user.id):
            return
        if user.role == UserRole.NGO and user.organization_id and donation.get("matched_ngo_id") == str(user.organization_id):
            return
        raise HTTPException(status_code=403, detail="Only the donation owner, assigned NGO, or an administrator can manage this pickup")

    def _audit(self, user: UserProfile, action: str, entity_id: str, details: Dict[str, Any]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        try:
            self.db.table("audit_logs").insert({
                "id": str(uuid4()), "actor_id": str(user.id), "entity_type": "pickup",
                "entity_id": str(entity_id), "action": action, "details": details, "created_at": now,
            }).execute()
        except Exception:
            # Pickup state remains authoritative; audit failures should be visible in server logs.
            import logging
            logging.getLogger(__name__).exception("Failed to write pickup audit log")

    def _enrich(self, row: Dict[str, Any]) -> PickupResponse:
        donation_rows = self.db.table("donations").select("id,title,city,status,donor_id,matched_ngo_id").eq("id", row["donation_id"]).execute().data or []
        donation = donation_rows[0] if donation_rows else {}
        donor_name = None
        ngo_name = None
        if donation.get("donor_id"):
            profiles = self.db.table("profiles").select("name").eq("id", donation["donor_id"]).execute().data or []
            if profiles:
                donor_name = profiles[0].get("name")
        if donation.get("matched_ngo_id"):
            ngos = self.db.table("ngos").select("name").eq("id", donation["matched_ngo_id"]).execute().data or []
            if ngos:
                ngo_name = ngos[0].get("name")
        return PickupResponse(
            id=UUID(row["id"]), donation_id=UUID(row["donation_id"]),
            scheduled_date=row.get("scheduled_date"), picked_up_at=row.get("picked_up_at"),
            status=PickupStatus(row.get("status", "scheduled")), notes=row.get("notes") or "",
            created_at=row.get("created_at"), updated_at=row.get("updated_at"),
            donation_title=donation.get("title"), donation_city=donation.get("city"),
            donation_status=donation.get("status"), donor_id=UUID(donation["donor_id"]) if donation.get("donor_id") else None,
            donor_name=donor_name, ngo_id=UUID(donation["matched_ngo_id"]) if donation.get("matched_ngo_id") else None,
            ngo_name=ngo_name,
        )


def get_pickup_service(db=Depends(get_db)) -> PickupService:
    return PickupService(db_client=db)
