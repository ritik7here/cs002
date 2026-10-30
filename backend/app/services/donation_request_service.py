from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import Depends, HTTPException, status
from ..core.database import get_db
from ..schemas.auth import UserProfile, UserRole
from ..schemas.donation import DonationStatus
from .notification_service import emit_notification, notify_organization
from ..schemas.donation_request import (
    DonationRequestCreate,
    DonationRequestDecision,
    DonationRequestResponse,
    DonationRequestStatus,
)


class DonationRequestService:
    def __init__(self, db_client=None):
        self.db = db_client

    def create(self, payload: DonationRequestCreate, user: UserProfile) -> DonationRequestResponse:
        if user.role != UserRole.NGO or not user.organization_id:
            raise HTTPException(status_code=403, detail="A linked NGO account is required to request a donation")
        if self.db is None:
            raise HTTPException(status_code=503, detail="Database service not available")

        donation_result = self.db.table("donations").select("*").eq("id", str(payload.donation_id)).execute()
        donation_rows = donation_result.data or []
        if not donation_rows:
            raise HTTPException(status_code=404, detail="Donation not found")
        donation = donation_rows[0]
        if donation.get("status") != DonationStatus.SUBMITTED.value or donation.get("matched_ngo_id"):
            raise HTTPException(status_code=409, detail="This donation is no longer available for requests")

        existing = self.db.table("donation_requests").select("id,status").eq("donation_id", str(payload.donation_id)).eq("ngo_id", str(user.organization_id)).execute()
        if any(row.get("status") in ("pending", "accepted") for row in (existing.data or [])):
            raise HTTPException(status_code=409, detail="Your organization already has an active request for this donation")
        accepted = self.db.table("donation_requests").select("id").eq("donation_id", str(payload.donation_id)).eq("status", "accepted").execute()
        if accepted.data:
            raise HTTPException(status_code=409, detail="This donation has already been accepted by another NGO")

        now = datetime.now(timezone.utc).isoformat()
        row = {
            "id": str(uuid4()),
            "donation_id": str(payload.donation_id),
            "ngo_id": str(user.organization_id),
            "status": DonationRequestStatus.PENDING.value,
            "proposed_pickup_date": payload.proposed_pickup_date.isoformat() if payload.proposed_pickup_date else None,
            "notes": payload.notes.strip(),
            "created_at": now,
            "updated_at": now,
        }
        try:
            result = self.db.table("donation_requests").insert(row).execute()
        except Exception as exc:
            # A concurrent request can win after the availability check. The
            # database unique indexes in the companion migration are the final guard.
            raise HTTPException(status_code=409, detail="A conflicting request already exists for this donation") from exc
        rows = result.data or [row]
        emit_notification(
            self.db, donation.get("donor_id"), "New donation request",
            f"An NGO has requested your donation: {donation.get('title') or 'Donation' }.",
            "info", "donor-donation-details", str(payload.donation_id),
        )
        return self._enrich(rows[0])

    def list_for_user(self, user: UserProfile) -> List[DonationRequestResponse]:
        if self.db is None:
            raise HTTPException(status_code=503, detail="Database service not available")
        if user.role == UserRole.NGO:
            if not user.organization_id:
                raise HTTPException(status_code=403, detail="NGO account is not linked to an organization")
            result = self.db.table("donation_requests").select("*").eq("ngo_id", str(user.organization_id)).order("created_at", desc=True).execute()
            rows = result.data or []
        elif user.role == UserRole.DONOR:
            donations = self.db.table("donations").select("id").eq("donor_id", str(user.id)).execute()
            donation_ids = [row["id"] for row in (donations.data or [])]
            if not donation_ids:
                return []
            result = self.db.table("donation_requests").select("*").in_("donation_id", donation_ids).order("created_at", desc=True).execute()
            rows = result.data or []
        elif user.role == UserRole.ADMIN:
            result = self.db.table("donation_requests").select("*").order("created_at", desc=True).execute()
            rows = result.data or []
        else:
            raise HTTPException(status_code=403, detail="Not authorized to view donation requests")
        return [self._enrich(row) for row in rows]

    def decide(self, request_id: UUID, payload: DonationRequestDecision, user: UserProfile) -> DonationRequestResponse:
        if user.role not in (UserRole.DONOR, UserRole.ADMIN):
            raise HTTPException(status_code=403, detail="Only the donation owner or an administrator can decide a request")
        if payload.status not in (DonationRequestStatus.ACCEPTED, DonationRequestStatus.DECLINED):
            raise HTTPException(status_code=422, detail="Decision must be accepted or declined")
        if self.db is None:
            raise HTTPException(status_code=503, detail="Database service not available")
        request_result = self.db.table("donation_requests").select("*").eq("id", str(request_id)).execute()
        request_rows = request_result.data or []
        if not request_rows:
            raise HTTPException(status_code=404, detail="Donation request not found")
        request = request_rows[0]
        donation_result = self.db.table("donations").select("*").eq("id", request["donation_id"]).execute()
        donation_rows = donation_result.data or []
        if not donation_rows:
            raise HTTPException(status_code=404, detail="Donation not found")
        donation = donation_rows[0]
        if user.role == UserRole.DONOR and donation.get("donor_id") != str(user.id):
            raise HTTPException(status_code=403, detail="You can only decide requests for your own donations")
        if request.get("status") != DonationRequestStatus.PENDING.value:
            raise HTTPException(status_code=409, detail="Only pending requests can be decided")

        now = datetime.now(timezone.utc).isoformat()
        if payload.status == DonationRequestStatus.ACCEPTED:
            if donation.get("status") != DonationStatus.SUBMITTED.value or donation.get("matched_ngo_id"):
                raise HTTPException(status_code=409, detail="This donation is no longer available")
            # Conditional update prevents two concurrent acceptances from claiming the same donation.
            # Supabase/PostgREST's update filter builder does not expose .select()
            # in all supported client versions. Execute the conditional update, then
            # read the row back to confirm that this request won the claim.
            self.db.table("donations").update({
                "matched_ngo_id": request["ngo_id"],
                "status": DonationStatus.MATCHED.value,
                "updated_at": now,
            }).eq("id", request["donation_id"]).eq("status", DonationStatus.SUBMITTED.value).is_("matched_ngo_id", "null").execute()
            claim_check = self.db.table("donations").select("id,status,matched_ngo_id").eq("id", request["donation_id"]).execute()
            claimed_rows = claim_check.data or []
            if (not claimed_rows or
                    claimed_rows[0].get("status") != DonationStatus.MATCHED.value or
                    claimed_rows[0].get("matched_ngo_id") != request["ngo_id"]):
                raise HTTPException(status_code=409, detail="This donation was already claimed or changed")

        # Do not depend on update().select(), which is unsupported by some
        # supabase-py/postgrest-py SyncFilterRequestBuilder versions. Updates may
        # return no representation, so verify the persisted state with a SELECT.
        self.db.table("donation_requests").update({"status": payload.status.value, "updated_at": now}).eq("id", str(request_id)).eq("status", "pending").execute()
        update_check = self.db.table("donation_requests").select("*").eq("id", str(request_id)).execute()
        updated_rows = update_check.data or []
        if not updated_rows or updated_rows[0].get("status") != payload.status.value:
            if payload.status == DonationRequestStatus.ACCEPTED:
                # Best-effort compensation only if this request's NGO still owns the claim.
                self.db.table("donations").update({"matched_ngo_id": None, "status": DonationStatus.SUBMITTED.value, "updated_at": now}).eq("id", request["donation_id"]).eq("matched_ngo_id", request["ngo_id"]).execute()
            raise HTTPException(status_code=409, detail="This request was already decided")
        updated_request = updated_rows[0]

        if payload.status == DonationRequestStatus.ACCEPTED:
            # Notify competing NGOs as their pending requests are closed by the winning acceptance.
            competing = self.db.table("donation_requests").select("id,ngo_id").eq("donation_id", request["donation_id"]).eq("status", "pending").neq("id", str(request_id)).execute().data or []
            self.db.table("donation_requests").update({"status": "declined", "updated_at": now}).eq("donation_id", request["donation_id"]).eq("status", "pending").neq("id", str(request_id)).execute()
            for competitor in competing:
                notify_organization(self.db, competitor.get("ngo_id"), "Donation request closed", f"Another NGO's request was accepted for {donation.get('title') or 'this donation'}, so your pending request was declined.", "warning", "ngo-donation-requests", str(request["donation_id"]))
        title = "Donation request accepted" if payload.status == DonationRequestStatus.ACCEPTED else "Donation request declined"
        message = (f"Your request for {donation.get('title') or 'a donation'} was {payload.status.value}." )
        notify_organization(self.db, request.get("ngo_id"), title, message, "success" if payload.status == DonationRequestStatus.ACCEPTED else "warning", "ngo-donation-requests", str(request["donation_id"]))
        return self._enrich(updated_request)

    def _enrich(self, row: dict) -> DonationRequestResponse:
        donation = {}
        ngo_name = None
        if self.db is not None:
            dres = self.db.table("donations").select("id,title,category,city,quantity,unit,donor_id").eq("id", row["donation_id"]).execute()
            if dres.data:
                donation = dres.data[0]
            nres = self.db.table("ngos").select("name").eq("id", row["ngo_id"]).execute()
            if nres.data:
                ngo_name = nres.data[0].get("name")
        return DonationRequestResponse(
            id=UUID(row["id"]), donation_id=UUID(row["donation_id"]), ngo_id=UUID(row["ngo_id"]),
            status=DonationRequestStatus(row["status"]), proposed_pickup_date=row.get("proposed_pickup_date"),
            notes=row.get("notes", ""), created_at=row.get("created_at"), updated_at=row.get("updated_at"),
            donation_title=donation.get("title"), donation_category=donation.get("category"),
            donation_city=donation.get("city"), donation_quantity=donation.get("quantity"),
            donation_unit=donation.get("unit"), donor_id=UUID(donation["donor_id"]) if donation.get("donor_id") else None,
            ngo_name=ngo_name,
        )


def get_donation_request_service(db=Depends(get_db)) -> DonationRequestService:
    return DonationRequestService(db_client=db)
