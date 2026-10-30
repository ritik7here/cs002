from fastapi import APIRouter
from .endpoints import health, auth, ngos, donations, requirements, donation_requests, donation_matches, pickups, distributions, notifications

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(ngos.router, prefix="/ngos")
api_router.include_router(donations.router, prefix="/donations")
api_router.include_router(requirements.router, prefix="/requirements")
api_router.include_router(donation_requests.router, prefix="/donation-requests")
api_router.include_router(donation_matches.router, prefix="/donation-matches")
api_router.include_router(pickups.router, prefix="/pickups")
api_router.include_router(distributions.router, prefix="/distributions")

api_router.include_router(notifications.router, prefix="/notifications")
