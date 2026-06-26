"""STAR story management endpoints.

Full CRUD for STAR-format behavioral interview stories.
All endpoints return Pydantic-validated responses.
"""

from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query

from app.database import db
from app.schemas import (
    StarStoryCreateRequest,
    StarStoryListResponse,
    StarStoryResponse,
    StarStoryUpdateRequest,
)

router = APIRouter(prefix="/star-stories", tags=["Star Stories"])


@router.get("", response_model=StarStoryListResponse)
async def list_star_stories(
    tag: str | None = Query(None, description="Filter stories by tag"),
    job_history_id: str | None = Query(None, description="Filter by linked job history ID"),
) -> StarStoryListResponse:
    """List all STAR stories, optionally filtered by tag or job history."""
    stories = await db.list_star_stories(tag=tag, job_history_id=job_history_id)
    return StarStoryListResponse(
        request_id=str(uuid4()),
        data=[StarStoryResponse(**s) for s in stories],
    )


@router.get("/{story_id}", response_model=StarStoryResponse)
async def get_star_story(story_id: str) -> StarStoryResponse:
    """Get a single STAR story by ID."""
    story = await db.get_star_story(story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return StarStoryResponse(**story)


@router.post("", response_model=StarStoryResponse, status_code=201)
async def create_star_story(request: StarStoryCreateRequest) -> StarStoryResponse:
    """Create a new STAR story."""
    story = await db.create_star_story(
        title=request.title,
        situation=request.situation,
        task=request.task,
        action=request.action,
        result=request.result,
        tags=request.tags,
        job_history_id=request.job_history_id,
    )
    return StarStoryResponse(**story)


@router.put("/{story_id}", response_model=StarStoryResponse)
async def update_star_story(
    story_id: str,
    request: StarStoryUpdateRequest,
) -> StarStoryResponse:
    """Update a STAR story. Only provided fields are modified."""
    update_data = request.model_dump(exclude_unset=True)
    story = await db.update_star_story(story_id, **update_data)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return StarStoryResponse(**story)


@router.delete("/{story_id}", status_code=204)
async def delete_star_story(story_id: str) -> None:
    """Delete a STAR story."""
    deleted = await db.delete_star_story(story_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Story not found")
