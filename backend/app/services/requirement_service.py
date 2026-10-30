from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import Depends, HTTPException, status
from ..core.database import get_db
from ..schemas.auth import UserProfile, UserRole
from ..schemas.requirement import RequirementCreate, RequirementFulfillment, RequirementResponse, RequirementStatus

class RequirementService:
    def __init__(self, db_client=None):
        self.db = db_client

    def _response(self, row: dict) -> RequirementResponse:
        if self.db is None:
            raise HTTPException(status_code=503, detail="Database service not available")
        ngo_result = self.db.table("ngos").select("name,city,verification_status").eq("id", str(row["ngo_id"])).execute()
        ngo = (ngo_result.data or [{}])[0]
        return RequirementResponse(**row, ngo_name=ngo.get("name", ""), ngo_city=ngo.get("city", ""), ngo_verified=ngo.get("verification_status") == "verified")

    def list_requirements(self, ngo_id: Optional[UUID] = None) -> List[RequirementResponse]:
        if self.db is None:
            raise HTTPException(status_code=503, detail="Database service not available")
        query = self.db.table("requirements").select("*")
        if ngo_id:
            query = query.eq("ngo_id", str(ngo_id))
        response = query.order("created_at", desc=True).execute()
        return [self._response(row) for row in (response.data or [])]

    def create_requirement(self, data: RequirementCreate, user: UserProfile) -> RequirementResponse:
        if user.role != UserRole.NGO or user.organization_id is None:
            raise HTTPException(status_code=403, detail="A linked NGO representative account is required")
        if self.db is None:
            raise HTTPException(status_code=503, detail="Database service not available")
        ngo_result = self.db.table("ngos").select("id,verification_status").eq("id", str(user.organization_id)).execute()
        if not ngo_result.data:
            raise HTTPException(status_code=404, detail="Linked NGO organization not found")
        if ngo_result.data[0].get("verification_status") != "verified":
            raise HTTPException(status_code=403, detail="Your NGO must be verified by an administrator before publishing requirements")
        payload = data.model_dump(mode="json")
        payload.update({"id": str(uuid4()), "ngo_id": str(user.organization_id), "fulfilled_quantity": 0, "status": RequirementStatus.OPEN.value, "created_at": datetime.now(timezone.utc).isoformat()})
        result = self.db.table("requirements").insert(payload).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Requirement could not be created")
        self.db.table("audit_logs").insert({"id": str(uuid4()), "actor_id": str(user.id), "entity_type": "requirement", "entity_id": result.data[0]["id"], "action": "created", "details": {"title": data.title}, "created_at": datetime.now(timezone.utc).isoformat()}).execute()
        return self._response(result.data[0])

    def fulfill(self, requirement_id: UUID, update: RequirementFulfillment, user: UserProfile) -> RequirementResponse:
        if user.role != UserRole.NGO or user.organization_id is None:
            raise HTTPException(status_code=403, detail="Only linked NGO representatives may update requirements")
        if self.db is None:
            raise HTTPException(status_code=503, detail="Database service not available")
        result = self.db.table("requirements").select("*").eq("id", str(requirement_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Requirement not found")
        row = result.data[0]
        if str(row["ngo_id"]) != str(user.organization_id):
            raise HTTPException(status_code=403, detail="You may only update requirements belonging to your organization")
        if row["status"] == RequirementStatus.CLOSED.value:
            raise HTTPException(status_code=400, detail="Closed requirements cannot be fulfilled")
        fulfilled = min(int(row["target_quantity"]), int(row.get("fulfilled_quantity", 0)) + update.amount)
        new_status = RequirementStatus.FULFILLED.value if fulfilled >= int(row["target_quantity"]) else RequirementStatus.PARTIALLY_FULFILLED.value if fulfilled > 0 else RequirementStatus.OPEN.value
        updated = self.db.table("requirements").update({"fulfilled_quantity": fulfilled, "status": new_status}).eq("id", str(requirement_id)).execute()
        if not updated.data:
            raise HTTPException(status_code=500, detail="Requirement fulfillment could not be saved")
        self.db.table("audit_logs").insert({"id": str(uuid4()), "actor_id": str(user.id), "entity_type": "requirement", "entity_id": str(requirement_id), "action": "fulfillment_updated", "details": {"amount_added": update.amount, "fulfilled_quantity": fulfilled, "status": new_status}, "created_at": datetime.now(timezone.utc).isoformat()}).execute()
        return self._response(updated.data[0])

def get_requirement_service(db=Depends(get_db)) -> RequirementService:
    return RequirementService(db_client=db)
