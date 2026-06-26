"""API routers."""

from app.routers.applications import router as applications_router
from app.routers.config import router as config_router
from app.routers.enrichment import router as enrichment_router
from app.routers.health import router as health_router
from app.routers.interview_preps import router as interview_preps_router
from app.routers.job_histories import router as job_histories_router
from app.routers.jobs import router as jobs_router
from app.routers.resume_wizard import router as resume_wizard_router
from app.routers.resumes import router as resumes_router
from app.routers.star_stories import router as star_stories_router

__all__ = [
    "resumes_router",
    "jobs_router",
    "health_router",
    "config_router",
    "applications_router",
    "enrichment_router",
    "resume_wizard_router",
    "star_stories_router",
    "job_histories_router",
    "interview_preps_router",
]
