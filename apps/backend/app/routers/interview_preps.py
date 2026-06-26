"""Interview preparation generation and query endpoints.

Three main operations:
- POST /generate  — trigger AI generation for a specific job
- GET  /          — list all generated prep bundles
- GET  /{prep_id} — get a single bundle with full Q&A
- DELETE /{prep_id} — remove a prep bundle
"""

import logging
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.database import db
from app.schemas import (
    GenerateInterviewPrepRequest,
    InterviewPrepListResponse,
    InterviewPrepResponse,
)
from app.services.interview_prep import generate_interview_prep

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interview-preps", tags=["Interview Prep"])


@router.post("/generate", response_model=InterviewPrepResponse, status_code=201)
async def generate_prep(request: GenerateInterviewPrepRequest) -> InterviewPrepResponse:
    """Generate interview preparation materials for a specific job.

    If ``star_story_ids`` is empty, the AI auto-selects the most relevant
    stories. If ``job_history_ids`` is None, all available job history is used.
    The generated bundle is persisted and returned.
    """
    # Fetch the target job
    job = await db.get_job(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Fetch star stories — user-selected or all
    if request.star_story_ids:
        star_stories = []
        for sid in request.star_story_ids:
            story = await db.get_star_story(sid)
            if story:
                star_stories.append(story)
    else:
        star_stories = await db.list_star_stories()

    # Fetch job histories — user-selected or all
    if request.job_history_ids is not None:
        job_histories = []
        for hid in request.job_history_ids:
            hist = await db.get_job_history(hid)
            if hist:
                job_histories.append(hist)
    else:
        job_histories = await db.list_job_histories()

    # Run AI generation
    try:
        result = await generate_interview_prep(
            job=job,
            star_stories=star_stories,
            job_histories=job_histories,
            selected_story_ids=request.star_story_ids or None,
            language=request.language,
        )
    except Exception as exc:
        logger.exception("Interview prep generation failed")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate interview materials: {exc}",
        ) from exc

    # Persist the result
    prep = await db.create_interview_prep(
        job_id=request.job_id,
        star_story_ids=result["star_story_ids"],
        mock_qa=result["mock_qa"],
        self_introduction=result["self_introduction"],
        questions_to_ask=result["questions_to_ask"],
        company_name=result["company_name"],
        role_title=result["role_title"],
    )

    return InterviewPrepResponse(**prep)


@router.get("", response_model=InterviewPrepListResponse)
async def list_interview_preps() -> InterviewPrepListResponse:
    """List all generated interview prep bundles, newest first."""
    preps = await db.list_interview_preps()
    return InterviewPrepListResponse(
        request_id=str(uuid4()),
        data=[InterviewPrepResponse(**p) for p in preps],
    )


@router.get("/{prep_id}", response_model=InterviewPrepResponse)
async def get_interview_prep(prep_id: str) -> InterviewPrepResponse:
    """Get a single interview prep bundle by ID."""
    prep = await db.get_interview_prep(prep_id)
    if not prep:
        raise HTTPException(status_code=404, detail="Interview prep not found")
    return InterviewPrepResponse(**prep)


@router.delete("/{prep_id}", status_code=204)
async def delete_interview_prep(prep_id: str) -> None:
    """Delete an interview prep bundle."""
    deleted = await db.delete_interview_prep(prep_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Interview prep not found")
