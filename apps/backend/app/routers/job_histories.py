"""Job history management endpoints.

Full CRUD for detailed job history entries independent from resume workExperience.
Stories linked to a job history are included as summary objects in GET responses.
"""

from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.database import db
from app.schemas import (
    JobHistoryCreateRequest,
    JobHistoryListResponse,
    JobHistoryResponse,
    JobHistoryUpdateRequest,
)

router = APIRouter(prefix="/job-histories", tags=["Job Histories"])


@router.get("", response_model=JobHistoryListResponse)
async def list_job_histories() -> JobHistoryListResponse:
    """List all job history entries, newest first."""
    histories = await db.list_job_histories()
    return JobHistoryListResponse(
        request_id=str(uuid4()),
        data=[JobHistoryResponse(**h) for h in histories],
    )


@router.get("/{job_history_id}", response_model=JobHistoryResponse)
async def get_job_history(job_history_id: str) -> JobHistoryResponse:
    """Get a single job history entry with linked story summaries."""
    history = await db.get_job_history(job_history_id)
    if not history:
        raise HTTPException(status_code=404, detail="Job history not found")
    return JobHistoryResponse(**history)


@router.post("", response_model=JobHistoryResponse, status_code=201)
async def create_job_history(request: JobHistoryCreateRequest) -> JobHistoryResponse:
    """Create a new job history entry."""
    history = await db.create_job_history(
        company=request.company,
        role=request.role,
        years=request.years,
        description=request.description,
        department=request.department,
        location=request.location,
        responsibilities=request.responsibilities,
        skills_used=request.skills_used,
    )
    return JobHistoryResponse(**history)


@router.put("/{job_history_id}", response_model=JobHistoryResponse)
async def update_job_history(
    job_history_id: str,
    request: JobHistoryUpdateRequest,
) -> JobHistoryResponse:
    """Update a job history entry. Only provided fields are modified."""
    update_data = request.model_dump(exclude_unset=True)
    history = await db.update_job_history(job_history_id, **update_data)
    if not history:
        raise HTTPException(status_code=404, detail="Job history not found")
    return JobHistoryResponse(**history)


@router.delete("/{job_history_id}", status_code=204)
async def delete_job_history(job_history_id: str) -> None:
    """Delete a job history entry.

    Linked STAR stories are preserved (their job_history_id becomes NULL).
    """
    deleted = await db.delete_job_history(job_history_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Job history not found")
