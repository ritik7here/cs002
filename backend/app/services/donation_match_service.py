from typing import Any, Dict, List, Tuple
from fastapi import Depends, HTTPException, status
from ..core.database import get_db
from ..schemas.auth import UserProfile, UserRole
from ..schemas.donation import DonationStatus
from ..schemas.requirement import RequirementStatus
from ..schemas.donation_match import DonationMatchRecommendation


def _same_text(left: Any, right: Any) -> bool:
    return str(left or "").strip().casefold() == str(right or "").strip().casefold() and bool(str(left or "").strip())


def calculate_match_score(donation: Dict[str, Any], requirement: Dict[str, Any]) -> Tuple[float, List[str]]:
    """Score an eligible same-category pair. This recommends; it never reserves a donation."""
    if donation.get("category") != requirement.get("category"):
        return 0.0, []

    score = 60
    reasons = ["Donation category matches the NGO requirement"]

    if _same_text(donation.get("city"), requirement.get("ngo_city")):
        score += 15
        reasons.append("Donation and NGO are in the same city")

    # The current requirements schema has no NGO state field in its API payload. The
    # caller may supply ngo_state from the organization row when it is available.
    if _same_text(donation.get("state"), requirement.get("ngo_state")):
        score += 10
        reasons.append("Donation and NGO are in the same state")

    if donation.get("urgency") == requirement.get("urgency"):
        score += 10
        reasons.append("Donation urgency aligns with the requirement")

    if _same_text(donation.get("unit"), requirement.get("unit")):
        remaining = max(0, int(requirement.get("target_quantity", 0)) - int(requirement.get("fulfilled_quantity", 0)))
        if int(donation.get("quantity", 0)) >= remaining:
            score += 5
            reasons.append("Donation quantity can cover the remaining requirement")
        else:
            score += 2
            reasons.append("Donation unit matches, but more quantity may be needed")

    return float(min(score, 100)), reasons


class DonationMatchService:
    def __init__(self, db_client=None):
        self.db = db_client

    def list_recommendations(self, user: UserProfile) -> List[DonationMatchRecommendation]:
        if self.db is None:
            raise HTTPException(status_code=503, detail="Database service not available")
        if user.role not in (UserRole.DONOR, UserRole.NGO):
            raise HTTPException(status_code=403, detail="Only donors and verified NGOs can view donation match recommendations")

        if user.role == UserRole.NGO:
            if user.organization_id is None:
                raise HTTPException(status_code=403, detail="Your account must be linked to an NGO organization")
            ngo_result = self.db.table("ngos").select("id,name,city,state,verification_status").eq("id", str(user.organization_id)).execute()
            if not ngo_result.data or ngo_result.data[0].get("verification_status") != "verified":
                raise HTTPException(status_code=403, detail="Your NGO must be verified to view matching recommendations")
            org_rows = ngo_result.data
            requirement_query = self.db.table("requirements").select("*").eq("ngo_id", str(user.organization_id))
        else:
            org_result = self.db.table("ngos").select("id,name,city,state,verification_status").eq("verification_status", "verified").execute()
            org_rows = org_result.data or []
            requirement_query = self.db.table("requirements").select("*")

        org_by_id = {str(org["id"]): org for org in org_rows}
        requirement_rows = requirement_query.in_("status", [RequirementStatus.OPEN.value, RequirementStatus.PARTIALLY_FULFILLED.value]).execute().data or []
        requirement_rows = [row for row in requirement_rows if str(row.get("ngo_id")) in org_by_id and org_by_id[str(row["ngo_id"])].get("verification_status") == "verified"]

        donation_query = self.db.table("donations").select("id,donor_id,title,category,description,quantity,unit,city,state,urgency,condition,status,matched_ngo_id,created_at")
        donation_query = donation_query.eq("status", DonationStatus.SUBMITTED.value).is_("matched_ngo_id", "null")
        if user.role == UserRole.DONOR:
            donation_query = donation_query.eq("donor_id", str(user.id))
        donation_rows = donation_query.order("created_at", desc=True).execute().data or []

        donor_names: Dict[str, str] = {}
        if user.role == UserRole.NGO and donation_rows:
            donor_ids = sorted({str(row["donor_id"]) for row in donation_rows if row.get("donor_id")})
            if donor_ids:
                profiles = self.db.table("profiles").select("id,name").in_("id", donor_ids).execute().data or []
                donor_names = {str(row["id"]): row.get("name") or "Anonymous Donor" for row in profiles}

        recommendations: List[Dict[str, Any]] = []
        persisted_matches: List[Dict[str, Any]] = []
        for donation in donation_rows:
            for requirement in requirement_rows:
                if donation.get("category") != requirement.get("category"):
                    continue
                organization = org_by_id[str(requirement["ngo_id"])]
                enriched_requirement = {**requirement, "ngo_name": organization.get("name") or "Community NGO", "ngo_city": organization.get("city") or "", "ngo_state": organization.get("state") or ""}
                score, reasons = calculate_match_score(donation, enriched_requirement)
                if score <= 0:
                    continue
                donation_for_response = {
                    "id": donation["id"], "title": donation["title"], "category": donation["category"],
                    "description": donation.get("description") or "", "quantity": donation["quantity"],
                    "unit": donation["unit"], "city": donation.get("city") or "", "state": donation.get("state") or "",
                    "urgency": donation["urgency"], "condition": donation["condition"], "status": donation["status"],
                    "donor_name": donor_names.get(str(donation.get("donor_id"))) if user.role == UserRole.NGO else None,
                }
                requirement_for_response = {key: value for key, value in enriched_requirement.items() if key in {
                    "id", "ngo_id", "ngo_name", "ngo_city", "title", "category", "cause", "target_quantity",
                    "fulfilled_quantity", "unit", "urgency", "description", "beneficiary_group", "needed_by_date", "status"
                }}
                recommendations.append({"score": score, "reasons": reasons, "donation": donation_for_response, "requirement": requirement_for_response})
                persisted_matches.append({"donation_id": donation["id"], "requirement_id": requirement["id"], "score": score})

        # Keep the existing table as the persisted candidate index. It does not alter
        # donation status, matched_ngo_id, target_requirement_id, or request decisions.
        if persisted_matches:
            self.db.table("donation_matches").upsert(persisted_matches, on_conflict="donation_id,requirement_id").execute()

        recommendations.sort(key=lambda item: (-item["score"], item["requirement"]["urgency"], item["requirement"]["title"]))
        return [DonationMatchRecommendation(**item) for item in recommendations]


def get_donation_match_service(db=Depends(get_db)) -> DonationMatchService:
    return DonationMatchService(db_client=db)
