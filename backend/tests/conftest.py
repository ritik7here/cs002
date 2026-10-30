from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from uuid import UUID, uuid4
import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas.auth import UserProfile, UserRole
from backend.app.schemas.ngo import NGOCreate, NGOUpdate, NGOResponse, NGOVerificationUpdate, VerificationStatus, CauseCategory
from backend.app.schemas.donation import (
    DonationCreate,
    DonationResponse,
    DonationCategory,
    DonationStatus,
    ItemCondition,
    UrgencyLevel,
    TimelineStep,
)
from backend.app.core.security import create_access_token
from backend.app.core.dependencies import get_current_user
from backend.app.services.auth_service import AuthService, get_auth_service
from backend.app.services.ngo_service import NGOService, get_ngo_service, slugify, generate_logo_initial
from backend.app.services.donation_service import DonationService, get_donation_service, derive_timeline

# Fixed UUIDs matching seed data convention
DONOR_ID = UUID("a0000000-0000-0000-0000-000000000001")
NGO_ID = UUID("a0000000-0000-0000-0000-000000000002")
ADMIN_ID = UUID("a0000000-0000-0000-0000-000000000003")
ANANYA_DONOR_ID = UUID("a0000000-0000-0000-0000-000000000005")
UNVERIFIED_NGO_USER_ID = UUID("a0000000-0000-0000-0000-000000000006")
UNLINKED_NGO_USER_ID = UUID("a0000000-0000-0000-0000-000000000007")
SUSPENDED_ID = UUID("a0000000-0000-0000-0000-000000000099")

VERIFIED_NGO_ID = UUID("b0000000-0000-0000-0000-000000000001")
PENDING_NGO_ID = UUID("b0000000-0000-0000-0000-000000000005")

DONATION_1_ID = UUID("d0000000-0000-0000-0000-000000000001")
DONATION_2_ID = UUID("d0000000-0000-0000-0000-000000000002")
DONATION_5_ID = UUID("d0000000-0000-0000-0000-000000000005")

SAMPLE_PROFILES: Dict[str, UserProfile] = {
    str(DONOR_ID): UserProfile(
        id=DONOR_ID,
        name="Sophia Chen",
        email="sophia.chen@example.org",
        role=UserRole.DONOR,
        phone="+1 (555) 438-9021",
        location="San Francisco, CA & Mumbai Hub",
        organization_id=None,
        status="active",
    ),
    str(NGO_ID): UserProfile(
        id=NGO_ID,
        name="Dr. Aarav Patel",
        email="aarav@aashrayatrust.org",
        role=UserRole.NGO,
        phone="+91 98201 54321",
        location="Mumbai, Maharashtra",
        organization_id=VERIFIED_NGO_ID,
        status="active",
    ),
    str(ADMIN_ID): UserProfile(
        id=ADMIN_ID,
        name="Elena Vance",
        email="admin.elena@kindredbridge.org",
        role=UserRole.ADMIN,
        phone="+1 (555) 890-1122",
        location="Global Platform Operations",
        organization_id=None,
        status="active",
    ),
    str(ANANYA_DONOR_ID): UserProfile(
        id=ANANYA_DONOR_ID,
        name="Ananya Sharma",
        email="ananya.sharma@designlab.io",
        role=UserRole.DONOR,
        phone=None,
        location="Bengaluru, Karnataka",
        organization_id=None,
        status="active",
    ),
    str(UNVERIFIED_NGO_USER_ID): UserProfile(
        id=UNVERIFIED_NGO_USER_ID,
        name="Pooja Sharma",
        email="pooja@prernafoundation.org",
        role=UserRole.NGO,
        phone="+91 93301 98765",
        location="Kolkata, West Bengal",
        organization_id=PENDING_NGO_ID,
        status="active",
    ),
    str(UNLINKED_NGO_USER_ID): UserProfile(
        id=UNLINKED_NGO_USER_ID,
        name="Rajesh Verma",
        email="rajesh.unlinked@example.org",
        role=UserRole.NGO,
        phone="+91 91234 56789",
        location="New Delhi, Delhi",
        organization_id=None,
        status="active",
    ),
    str(SUSPENDED_ID): UserProfile(
        id=SUSPENDED_ID,
        name="Suspended User",
        email="suspended@example.org",
        role=UserRole.DONOR,
        status="suspended",
    ),
}

INITIAL_SAMPLE_NGOS: Dict[str, NGOResponse] = {
    str(VERIFIED_NGO_ID): NGOResponse(
        id=VERIFIED_NGO_ID,
        name="Aashraya Community Foundation",
        slug="aashraya-community-foundation",
        registration_number="MH/2018/0094125",
        tax_exempt_id="AACTA9821PF001",
        verification_status=VerificationStatus.VERIFIED,
        description="Providing daily wholesome meals, emergency shelter kits, and holistic care.",
        mission_statement="To ensure no vulnerable citizen sleeps on the street hungry.",
        contact_email="contact@aashrayatrust.org",
        phone="+91 98201 54321",
        address="Plot 44, Chembur Social Welfare Complex",
        city="Mumbai",
        state="Maharashtra",
        website="https://aashrayatrust.org",
        founded_year=2018,
        beneficiaries_count=42800,
        active_campaigns_count=4,
        causes=[CauseCategory.HUNGER_NUTRITION, CauseCategory.SHELTER_CLOTHING, CauseCategory.ELDERLY_CARE],
        certifications=["80G Certified", "FCRA Approved"],
        trust_score=98,
        logo_initial="AC",
    ),
    str(PENDING_NGO_ID): NGOResponse(
        id=PENDING_NGO_ID,
        name="Prerna Women Dignity & Livelihood Center",
        slug="prerna-women-livelihood",
        registration_number="WB/2024/0049218",
        tax_exempt_id="EESTR3412LF005",
        verification_status=VerificationStatus.PENDING,
        description="Vocational tailoring and computer literacy training.",
        mission_statement="Creating self-sustaining economic pathways for women.",
        contact_email="director@prernafoundation.org",
        phone="+91 93301 98765",
        address="Block C, Salt Lake Sector 1",
        city="Kolkata",
        state="West Bengal",
        website="https://prernafoundation.org",
        founded_year=2024,
        beneficiaries_count=3100,
        active_campaigns_count=2,
        causes=[CauseCategory.WOMEN_EMPOWERMENT, CauseCategory.EDUCATION_YOUTH],
        certifications=["Registration Submitted"],
        trust_score=70,
        logo_initial="PW",
    )
}

INITIAL_SAMPLE_DONATIONS: Dict[str, DonationResponse] = {
    str(DONATION_1_ID): DonationResponse(
        id=DONATION_1_ID,
        donor_id=DONOR_ID,
        donor_name="Sophia Chen",
        donor_email="sophia.chen@example.org",
        title="Nutritious High-Protein Grain & Pulse Food Parcels (80 Kits)",
        category=DonationCategory.FOOD_GROCERIES,
        description="80 sealed family grain kits.",
        quantity=80,
        unit="Family Care Kits",
        estimated_value=1200.0,
        condition=ItemCondition.BRAND_NEW,
        pickup_address="Tower 4, Seaface Residency, Worli",
        city="Mumbai",
        state="Maharashtra",
        pincode="400018",
        urgency=UrgencyLevel.CRITICAL_EMERGENCY,
        status=DonationStatus.DISTRIBUTED,
        matched_ngo_id=VERIFIED_NGO_ID,
        matched_ngo_name="Aashraya Community Foundation",
        proof_photos=["/assets/images/community_food_aid.jpg"],
        tracking_timeline=derive_timeline(
            DonationStatus.DISTRIBUTED,
            datetime(2026, 9, 21, tzinfo=timezone.utc),
            datetime(2026, 9, 24, tzinfo=timezone.utc),
            "Aashraya Community Foundation"
        ),
        created_at=datetime(2026, 9, 21, tzinfo=timezone.utc),
        updated_at=datetime(2026, 9, 24, tzinfo=timezone.utc),
    ),
    str(DONATION_5_ID): DonationResponse(
        id=DONATION_5_ID,
        donor_id=ANANYA_DONOR_ID,
        donor_name="Ananya Sharma",
        donor_email="ananya.sharma@designlab.io",
        title="50 Complete Art & Stationery Learning Kits",
        category=DonationCategory.EDUCATIONAL_MATERIAL,
        description="Drawing pads and craft scissors.",
        quantity=50,
        unit="Art Gift Boxes",
        estimated_value=400.0,
        condition=ItemCondition.BRAND_NEW,
        pickup_address="Indiranagar 100ft Road",
        city="Bengaluru",
        state="Karnataka",
        pincode="560038",
        urgency=UrgencyLevel.MEDIUM,
        status=DonationStatus.SUBMITTED,
        matched_ngo_id=None,
        matched_ngo_name=None,
        proof_photos=[],
        tracking_timeline=derive_timeline(
            DonationStatus.SUBMITTED,
            datetime(2026, 9, 25, tzinfo=timezone.utc),
            datetime(2026, 9, 25, tzinfo=timezone.utc)
        ),
        created_at=datetime(2026, 9, 25, tzinfo=timezone.utc),
        updated_at=datetime(2026, 9, 25, tzinfo=timezone.utc),
    ),
}

class MockAuthService(AuthService):
    def get_profile_by_id(self, user_id: str) -> UserProfile:
        profile = SAMPLE_PROFILES.get(user_id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if profile.status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is suspended"
            )
        return profile

class MockNGOService(NGOService):
    def __init__(self):
        super().__init__(db_client=None)
        self.ngos = {k: v.model_copy() for k, v in INITIAL_SAMPLE_NGOS.items()}

    def list_ngos(self, verification_status: Optional[VerificationStatus] = None) -> List[NGOResponse]:
        result = list(self.ngos.values())
        if verification_status:
            result = [ngo for ngo in result if ngo.verification_status == verification_status]
        return result

    def get_ngo_by_id(self, ngo_id: UUID) -> NGOResponse:
        ngo = self.ngos.get(str(ngo_id))
        if not ngo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"NGO with ID '{ngo_id}' not found"
            )
        return ngo

    def create_ngo(self, data: NGOCreate, creator: UserProfile) -> NGOResponse:
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

        new_id = uuid4()
        now = datetime.now(timezone.utc)
        ngo = NGOResponse(
            id=new_id,
            name=data.name,
            slug=slugify(data.name),
            registration_number=data.registration_number,
            tax_exempt_id=data.tax_exempt_id,
            verification_status=VerificationStatus.PENDING,
            description=data.description,
            mission_statement=data.mission_statement,
            contact_email=data.contact_email,
            phone=data.phone,
            address=data.address,
            city=data.city,
            state=data.state,
            website=data.website or "",
            founded_year=data.founded_year,
            causes=data.causes,
            certifications=data.certifications,
            trust_score=70,
            logo_initial=generate_logo_initial(data.name),
            created_at=now,
            updated_at=now,
        )
        self.ngos[str(new_id)] = ngo
        SAMPLE_PROFILES[str(creator.id)].organization_id = new_id
        return ngo

    def update_profile(self, ngo_id: UUID, update_data: NGOUpdate, user: UserProfile) -> NGOResponse:
        if user.role != UserRole.NGO:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only NGO representatives can update an organization profile")
        if user.organization_id is None or str(user.organization_id) != str(ngo_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You may only update the NGO organization linked to your account")
        ngo = self.get_ngo_by_id(ngo_id)
        changes = update_data.model_dump(exclude_unset=True)
        for key, value in changes.items():
            setattr(ngo, key, value)
        if "name" in changes:
            ngo.slug = slugify(ngo.name)
            ngo.logo_initial = generate_logo_initial(ngo.name)
        ngo.updated_at = datetime.now(timezone.utc)
        return ngo

    def update_verification(
        self,
        ngo_id: UUID,
        update_data: NGOVerificationUpdate,
        admin_user: UserProfile
    ) -> NGOResponse:
        if admin_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can update NGO verification status"
            )
        ngo = self.get_ngo_by_id(ngo_id)
        ngo.verification_status = update_data.verification_status
        if update_data.verification_status == VerificationStatus.VERIFIED and ngo.trust_score < 80:
            ngo.trust_score = 85
        ngo.updated_at = datetime.now(timezone.utc)
        return ngo

class MockDonationService(DonationService):
    def __init__(self):
        super().__init__(db_client=None)
        self.donations = {k: v.model_copy() for k, v in INITIAL_SAMPLE_DONATIONS.items()}

    def create_donation(self, data: DonationCreate, donor: UserProfile) -> DonationResponse:
        if donor.role != UserRole.DONOR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only accounts with the 'donor' role may pledge donations"
            )

        new_id = uuid4()
        now = datetime.now(timezone.utc)
        timeline = derive_timeline(DonationStatus.SUBMITTED, now, now)

        res = DonationResponse(
            id=new_id,
            donor_id=donor.id,
            donor_name=donor.name,
            donor_email=donor.email,
            title=data.title,
            category=data.category,
            description=data.description,
            quantity=data.quantity,
            unit=data.unit,
            estimated_value=data.estimated_value,
            condition=data.condition,
            pickup_address=data.pickup_address,
            city=data.city,
            state=data.state,
            pincode=data.pincode,
            urgency=data.urgency,
            status=DonationStatus.SUBMITTED,
            matched_ngo_id=None,
            matched_ngo_name=None,
            target_requirement_id=None,
            proof_photos=[],
            tracking_timeline=timeline,
            created_at=now,
            updated_at=now,
        )
        self.donations[str(new_id)] = res
        return res

    def list_donations(
        self,
        status_filter: Optional[DonationStatus] = None,
        category_filter: Optional[DonationCategory] = None,
        donor_id: Optional[UUID] = None
    ) -> List[DonationResponse]:
        result = list(self.donations.values())
        if status_filter:
            result = [d for d in result if d.status == status_filter]
        if category_filter:
            result = [d for d in result if d.category == category_filter]
        if donor_id:
            result = [d for d in result if d.donor_id == donor_id]
        return result

    def get_donation_by_id(self, donation_id: UUID) -> DonationResponse:
        donation = self.donations.get(str(donation_id))
        if not donation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Donation with ID '{donation_id}' not found"
            )
        return donation

@pytest.fixture
def client():
    mock_auth = MockAuthService()
    mock_ngo = MockNGOService()
    mock_donation = MockDonationService()

    app.dependency_overrides[get_auth_service] = lambda: mock_auth
    app.dependency_overrides[get_ngo_service] = lambda: mock_ngo
    app.dependency_overrides[get_donation_service] = lambda: mock_donation

    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def donor_token() -> str:
    return create_access_token({"sub": str(DONOR_ID), "role": "authenticated"})

@pytest.fixture
def ananya_donor_token() -> str:
    return create_access_token({"sub": str(ANANYA_DONOR_ID), "role": "authenticated"})

@pytest.fixture
def ngo_token() -> str:
    return create_access_token({"sub": str(NGO_ID), "role": "authenticated"})

@pytest.fixture
def unverified_ngo_token() -> str:
    return create_access_token({"sub": str(UNVERIFIED_NGO_USER_ID), "role": "authenticated"})

@pytest.fixture
def unlinked_ngo_token() -> str:
    return create_access_token({"sub": str(UNLINKED_NGO_USER_ID), "role": "authenticated"})

@pytest.fixture
def admin_token() -> str:
    return create_access_token({"sub": str(ADMIN_ID), "role": "authenticated"})

@pytest.fixture
def suspended_token() -> str:
    return create_access_token({"sub": str(SUSPENDED_ID), "role": "authenticated"})

@pytest.fixture
def expired_token() -> str:
    return create_access_token(
        {"sub": str(DONOR_ID), "role": "authenticated"},
        expires_delta=timedelta(seconds=-3600)
    )
