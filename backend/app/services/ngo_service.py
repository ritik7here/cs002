import re
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from ..schemas.ngo import NGOCreate, NGOUpdate, NGOResponse, NGOVerificationUpdate, VerificationStatus, CauseCategory
from ..schemas.auth import UserProfile, UserRole
from ..core.database import get_db
from .notification_service import notify_organization

def slugify(text: str) -> str:
    """Convert text to URL-safe slug."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text or "ngo"

def generate_logo_initial(name: str) -> str:
    """Generate 1-2 character initials for logo."""
    words = [w for w in name.strip().split() if w]
    if len(words) >= 2:
        return f"{words[0][0]}{words[1][0]}".upper()
    elif words:
        return words[0][:2].upper()
    return "NG"

class NGOService:
    def __init__(self, db_client=None):
        self.db = db_client

    def list_ngos(self, verification_status: Optional[VerificationStatus] = None) -> List[NGOResponse]:
        if self.db is not None:
            query = self.db.table("ngos").select("*")
            if verification_status:
                query = query.eq("verification_status", verification_status.value)
            response = query.order("name").execute()
            return [NGOResponse(**item) for item in (response.data or [])]
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service not available"
        )

    def get_ngo_by_id(self, ngo_id: UUID) -> NGOResponse:
        if self.db is not None:
            response = self.db.table("ngos").select("*").eq("id", str(ngo_id)).execute()
            data = response.data
            if not data or len(data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"NGO with ID '{ngo_id}' not found"
                )
            return NGOResponse(**data[0])
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service not available"
        )

    def create_ngo(self, data: NGOCreate, creator: UserProfile) -> NGOResponse:
        """
        Register a new NGO and link it to the creator profile.
        New NGOs always start with status 'pending'.
        """
        if creator.role != UserRole.NGO:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only users with the 'ngo' role can register an NGO organization"
            )

        if creator.organization_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already associated with an existing NGO organization"
            )

        base_slug = slugify(data.name)
        slug = base_slug
        now = datetime.now(timezone.utc)
        ngo_id = uuid4()

        payload = {
            "id": str(ngo_id),
            "name": data.name,
            "slug": slug,
            "registration_number": data.registration_number,
            "tax_exempt_id": data.tax_exempt_id,
            "verification_status": VerificationStatus.PENDING.value,
            "description": data.description,
            "mission_statement": data.mission_statement,
            "contact_email": data.contact_email,
            "phone": data.phone,
            "address": data.address,
            "city": data.city,
            "state": data.state,
            "website": data.website or "",
            "founded_year": data.founded_year,
            "beneficiaries_count": 0,
            "active_campaigns_count": 0,
            "causes": [c.value if isinstance(c, CauseCategory) else str(c) for c in data.causes],
            "certifications": data.certifications,
            "trust_score": 70,
            "logo_initial": generate_logo_initial(data.name),
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }

        if self.db is not None:
            # Insert NGO
            ngo_res = self.db.table("ngos").insert(payload).execute()
            inserted_ngo = ngo_res.data[0]

            # Update creator profile with new organization_id
            self.db.table("profiles").update({"organization_id": str(ngo_id)}).eq("id", str(creator.id)).execute()

            # Record audit log
            self.db.table("audit_logs").insert({
                "id": str(uuid4()),
                "actor_id": str(creator.id),
                "entity_type": "ngo",
                "entity_id": str(ngo_id),
                "action": "registered",
                "details": {"name": data.name, "registration_number": data.registration_number},
                "created_at": now.isoformat()
            }).execute()

            return NGOResponse(**inserted_ngo)

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service not available"
        )

    def update_profile(self, ngo_id: UUID, update_data: NGOUpdate, user: UserProfile) -> NGOResponse:
        """Update editable fields for the NGO linked to the authenticated representative."""
        if user.role != UserRole.NGO:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only NGO representatives can update an organization profile")
        if user.organization_id is None or str(user.organization_id) != str(ngo_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You may only update the NGO organization linked to your account")

        changes = update_data.model_dump(exclude_unset=True)
        if not changes:
            return self.get_ngo_by_id(ngo_id)
        if "name" in changes and changes["name"]:
            changes["slug"] = slugify(changes["name"])
            changes["logo_initial"] = generate_logo_initial(changes["name"])
        changes["updated_at"] = datetime.now(timezone.utc).isoformat()

        if self.db is not None:
            response = self.db.table("ngos").update(changes).eq("id", str(ngo_id)).execute()
            if not response.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"NGO with ID '{ngo_id}' not found")
            updated = response.data[0]
            self.db.table("audit_logs").insert({
                "id": str(uuid4()),
                "actor_id": str(user.id),
                "entity_type": "ngo",
                "entity_id": str(ngo_id),
                "action": "profile_updated",
                "details": {"updated_fields": sorted(k for k in changes if k != "updated_at")},
                "created_at": changes["updated_at"],
            }).execute()
            return NGOResponse(**updated)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database service not available")

    def update_verification(
        self,
        ngo_id: UUID,
        update_data: NGOVerificationUpdate,
        admin_user: UserProfile
    ) -> NGOResponse:
        """
        Admin endpoint to update NGO verification status.
        Only admins may call this (enforced in router / dependencies).
        """
        if admin_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can update NGO verification status"
            )

        existing_ngo = self.get_ngo_by_id(ngo_id)
        old_status = existing_ngo.verification_status
        new_status = update_data.verification_status

        # If verified, adjust trust score upwards if below threshold
        new_trust_score = existing_ngo.trust_score
        if new_status == VerificationStatus.VERIFIED and new_trust_score < 80:
            new_trust_score = 85

        now = datetime.now(timezone.utc)
        update_payload = {
            "verification_status": new_status.value,
            "trust_score": new_trust_score,
            "updated_at": now.isoformat(),
        }

        if self.db is not None:
            res = self.db.table("ngos").update(update_payload).eq("id", str(ngo_id)).execute()
            if not res.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"NGO '{ngo_id}' not found")
            updated = res.data[0]

            # Write audit log
            self.db.table("audit_logs").insert({
                "id": str(uuid4()),
                "actor_id": str(admin_user.id),
                "entity_type": "ngo",
                "entity_id": str(ngo_id),
                "action": "verification_status_updated",
                "details": {
                    "old_status": old_status.value if isinstance(old_status, VerificationStatus) else str(old_status),
                    "new_status": new_status.value,
                    "reason": update_data.reason or ""
                },
                "created_at": now.isoformat()
            }).execute()

            if old_status != new_status:
                label = new_status.value.replace("_", " ").title()
                notify_organization(self.db, str(ngo_id), f"NGO verification: {label}", f"Your organization’s verification status is now {label.lower()}." + (f" Review note: {update_data.reason.strip()}" if update_data.reason and update_data.reason.strip() else ""), "success" if new_status == VerificationStatus.VERIFIED else "warning", "ngo-dashboard")
            return NGOResponse(**updated)

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service not available"
        )

def get_ngo_service(db=Depends(get_db)) -> NGOService:
    return NGOService(db_client=db)
