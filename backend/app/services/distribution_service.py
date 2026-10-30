from datetime import datetime, timezone
import logging
from typing import Any, Dict, List
from uuid import UUID, uuid4

from fastapi import Depends, HTTPException
from ..core.database import get_db
from .notification_service import emit_notification
from ..schemas.auth import UserProfile, UserRole
from ..schemas.distribution import DistributionCreate, DistributionResponse

logger = logging.getLogger(__name__)


class DistributionService:
    def __init__(self, db_client=None):
        self.db = db_client

    def list_for_user(self, user: UserProfile) -> List[DistributionResponse]:
        self._require_db()
        if user.role == UserRole.ADMIN:
            rows = self.db.table("distributions").select("*").order("created_at", desc=True).execute().data or []
        else:
            if user.role == UserRole.DONOR:
                donation_rows = self.db.table("donations").select("id").eq("donor_id", str(user.id)).execute().data or []
            elif user.role == UserRole.NGO:
                if not user.organization_id:
                    raise HTTPException(status_code=403, detail="NGO account is not linked to an organization")
                donation_rows = self.db.table("donations").select("id").eq("matched_ngo_id", str(user.organization_id)).execute().data or []
            else:
                raise HTTPException(status_code=403, detail="Not authorized to view distributions")
            donation_ids = [str(row["id"]) for row in donation_rows]
            if not donation_ids:
                return []
            rows = self.db.table("distributions").select("*").in_("donation_id", donation_ids).order("created_at", desc=True).execute().data or []
        return [self._enrich(row) for row in rows]

    def confirm_received(self, donation_id: UUID, user: UserProfile) -> Dict[str, Any]:
        self._require_db()
        donation = self._get_donation(donation_id)
        self._authorize_ngo_or_admin(user, donation)
        if donation.get("status") != "In Transit":
            raise HTTPException(status_code=409, detail="Only donations in transit can be marked as received by the NGO")
        if not donation.get("matched_ngo_id"):
            raise HTTPException(status_code=409, detail="Donation has no assigned NGO")
        now = datetime.now(timezone.utc).isoformat()
        self.db.table("donations").update({"status": "Received by NGO", "updated_at": now}).eq("id", str(donation_id)).eq("status", "In Transit").eq("matched_ngo_id", str(donation["matched_ngo_id"])).execute()
        saved = self.db.table("donations").select("id,status,matched_ngo_id").eq("id", str(donation_id)).execute().data or []
        if not saved or saved[0].get("status") != "Received by NGO":
            raise HTTPException(status_code=409, detail="Donation status changed concurrently. Refresh and try again.")
        self._audit(user, "distribution_received_by_ngo", str(donation_id), {"from_status": "In Transit", "to_status": "Received by NGO"})
        emit_notification(self.db, donation.get("donor_id"), "Donation received by NGO", f"The NGO has confirmed receipt of {donation.get('title') or 'your donation'}.", "success", "donor-distribution-tracking", str(donation_id))
        return {"donation_id": str(donation_id), "status": "Received by NGO"}

    def create(self, payload: DistributionCreate, user: UserProfile) -> DistributionResponse:
        self._require_db()
        donation = self._get_donation(payload.donation_id)
        self._authorize_ngo_or_admin(user, donation)
        if donation.get("status") != "Received by NGO":
            raise HTTPException(status_code=409, detail="Confirm NGO receipt before recording distribution")
        if not donation.get("matched_ngo_id"):
            raise HTTPException(status_code=409, detail="Donation has no assigned NGO")
        if payload.distribution_date > datetime.now(timezone.utc).date():
            raise HTTPException(status_code=422, detail="Distribution date cannot be in the future")
        if payload.quantity_distributed > int(donation.get("quantity") or 0):
            raise HTTPException(status_code=422, detail="Distributed quantity cannot exceed the donated quantity")
        rows = self.db.table("distributions").select("quantity_distributed").eq("donation_id", str(payload.donation_id)).execute().data or []
        already_distributed = sum(int(row.get("quantity_distributed") or 0) for row in rows)
        remaining = int(donation.get("quantity") or 0) - already_distributed
        if payload.quantity_distributed > remaining:
            raise HTTPException(status_code=409, detail=f"Only {max(remaining, 0)} {donation.get('unit') or 'units'} remain available for distribution")
        now = datetime.now(timezone.utc).isoformat()
        distribution_id = str(uuid4())
        row = {
            "id": distribution_id,
            "donation_id": str(payload.donation_id),
            "ngo_id": str(donation["matched_ngo_id"]),
            "distribution_date": payload.distribution_date.isoformat(),
            "quantity_distributed": payload.quantity_distributed,
            "location": payload.location.strip(),
            "beneficiaries_reached": payload.beneficiaries_reached,
            "proof_image_url": payload.proof_image_url.strip() if payload.proof_image_url else None,
            "impact_report": payload.impact_report.strip(),
            "notes_to_donor": payload.notes_to_donor.strip(),
            "created_at": now,
            "updated_at": now,
        }
        try:
            self.db.rpc("record_distribution_event", {
                "p_id": distribution_id,
                "p_donation_id": str(payload.donation_id),
                "p_ngo_id": str(donation["matched_ngo_id"]),
                "p_distribution_date": payload.distribution_date.isoformat(),
                "p_quantity_distributed": payload.quantity_distributed,
                "p_location": payload.location.strip(),
                "p_beneficiaries_reached": payload.beneficiaries_reached,
                "p_proof_image_url": payload.proof_image_url.strip() if payload.proof_image_url else None,
                "p_impact_report": payload.impact_report.strip(),
                "p_notes_to_donor": payload.notes_to_donor.strip(),
            }).execute()
        except Exception as exc:
            message = str(exc)
            if "exceeds the remaining" in message:
                raise HTTPException(status_code=409, detail="Distribution quantity exceeds the remaining donated quantity") from exc
            if "must be received" in message or "does not match" in message:
                raise HTTPException(status_code=409, detail="Donation is no longer eligible for this distribution. Refresh and try again.") from exc
            raise HTTPException(status_code=409, detail="Could not save distribution record. Refresh and try again.") from exc

        total_distributed = already_distributed + payload.quantity_distributed
        self._audit(user, "distribution_recorded", distribution_id, {
            "donation_id": str(payload.donation_id),
            "quantity_distributed": payload.quantity_distributed,
            "total_distributed": total_distributed,
            "donation_quantity": int(donation.get("quantity") or 0),
        })
        fully_distributed = total_distributed >= int(donation.get("quantity") or 0)
        donor_message = f"An NGO recorded distribution of {payload.quantity_distributed} {donation.get('unit') or 'units'} from {donation.get('title') or 'your donation'}."
        if fully_distributed:
            donor_message += " The full donated quantity has now been distributed."
        emit_notification(self.db, donation.get("donor_id"), "Donation fully distributed" if fully_distributed else "Distribution update", donor_message, "success", "donor-distribution-tracking", str(payload.donation_id))
        saved = self.db.table("distributions").select("*").eq("id", distribution_id).execute().data or []
        if not saved:
            raise HTTPException(status_code=500, detail="Distribution was saved but could not be reloaded")
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
    def _authorize_ngo_or_admin(user: UserProfile, donation: Dict[str, Any]) -> None:
        if user.role == UserRole.ADMIN:
            return
        if user.role == UserRole.NGO and user.organization_id and donation.get("matched_ngo_id") == str(user.organization_id):
            return
        if user.role == UserRole.NGO and not user.organization_id:
            raise HTTPException(status_code=403, detail="NGO account is not linked to an organization")
        raise HTTPException(status_code=403, detail="Only the assigned NGO or an administrator can confirm receipt or record distribution")

    def _audit(self, user: UserProfile, action: str, entity_id: str, details: Dict[str, Any]) -> None:
        try:
            self.db.table("audit_logs").insert({
                "id": str(uuid4()), "actor_id": str(user.id), "entity_type": "distribution",
                "entity_id": str(entity_id), "action": action, "details": details,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
        except Exception:
            logger.exception("Failed to write distribution audit log")

    def _enrich(self, row: Dict[str, Any]) -> DistributionResponse:
        donation_rows = self.db.table("donations").select("id,title,quantity,unit,status,donor_id,matched_ngo_id").eq("id", row["donation_id"]).execute().data or []
        donation = donation_rows[0] if donation_rows else {}
        donor_name = None
        ngo_name = None
        if donation.get("donor_id"):
            profiles = self.db.table("profiles").select("name").eq("id", donation["donor_id"]).execute().data or []
            if profiles:
                donor_name = profiles[0].get("name")
        if row.get("ngo_id"):
            ngos = self.db.table("ngos").select("name").eq("id", row["ngo_id"]).execute().data or []
            if ngos:
                ngo_name = ngos[0].get("name")
        return DistributionResponse(
            **row,
            donation_title=donation.get("title"),
            donation_quantity=donation.get("quantity"),
            donation_unit=donation.get("unit"),
            donation_status=donation.get("status"),
            donor_id=donation.get("donor_id"),
            donor_name=donor_name,
            ngo_name=ngo_name,
        )


def get_distribution_service(db=Depends(get_db)):
    return DistributionService(db)
