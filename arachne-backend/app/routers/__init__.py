from fastapi import APIRouter
from app.routers.auth import router as auth_router
from app.routers.incidents import router as incidents_router
from app.routers.nexus import router as nexus_router
from app.routers.ai_insights import router as ai_insights_router
from app.routers.districts import router as districts_router
from app.routers.predictions import router as predictions_router
from app.routers.analytics import router as analytics_router
from app.routers.reports import router as reports_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(incidents_router)
api_router.include_router(nexus_router)
api_router.include_router(ai_insights_router)
api_router.include_router(districts_router)
api_router.include_router(predictions_router)
api_router.include_router(analytics_router)
api_router.include_router(reports_router)

__all__ = ["api_router"]
