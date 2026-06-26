"""Integration tests for interview prep endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.fixture
def sample_prep():
    return {
        "prep_id": "prep-1",
        "job_id": "job-1",
        "company_name": "TechCorp",
        "role_title": "Senior Engineer",
        "star_story_ids": ["s-1", "s-2"],
        "mock_qa": [
            {
                "type": "behavioral",
                "question": "Tell me about a challenging project",
                "answer": "I led a team that...",
                "story_id": "s-1",
            },
        ],
        "self_introduction": "Hi, I'm...",
        "questions_to_ask": [
            {"category": "team", "question": "How is the team structured?", "rationale": "Understand team dynamics"},
        ],
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    }


@pytest.fixture
def sample_job():
    return {
        "job_id": "job-1",
        "content": "Senior Engineer at TechCorp",
        "created_at": "2026-01-01T00:00:00",
    }


@pytest.fixture
def sample_story():
    return {
        "story_id": "s-1",
        "title": "Optimized latency",
        "situation": "5s latency",
        "task": "Reduce to 1s",
        "action": "Caching",
        "result": "300ms",
        "tags": ["performance"],
        "job_history_id": None,
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    }


@pytest.fixture
def generation_result():
    return {
        "star_story_ids": ["s-1", "s-2"],
        "company_name": "TechCorp",
        "role_title": "Senior Engineer",
        "mock_qa": [
            {"type": "behavioral", "question": "Q1", "answer": "A1", "story_id": "s-1"},
        ],
        "self_introduction": "I'm a senior engineer...",
        "questions_to_ask": [
            {"category": "culture", "question": "What's the team culture?", "rationale": "Understand fit"},
        ],
    }


class TestGenerateInterviewPrep:
    """POST /api/v1/interview-preps/generate"""

    @patch("app.routers.interview_preps.generate_interview_prep", new_callable=AsyncMock)
    @patch("app.routers.interview_preps.db", new_callable=AsyncMock)
    async def test_generate_success_returns_201(
        self, mock_db, mock_generate, client, sample_job, sample_story,
        sample_prep, generation_result,
    ):
        mock_db.get_job.return_value = sample_job
        mock_db.list_star_stories.return_value = [sample_story]
        mock_db.list_job_histories.return_value = []
        mock_generate.return_value = generation_result
        mock_db.create_interview_prep.return_value = sample_prep

        async with client:
            resp = await client.post("/api/v1/interview-preps/generate", json={
                "job_id": "job-1",
                "language": "en",
            })

        assert resp.status_code == 201
        data = resp.json()
        assert data["prep_id"] == "prep-1"
        assert data["company_name"] == "TechCorp"
        mock_generate.assert_called_once()
        mock_db.create_interview_prep.assert_called_once()

    @patch("app.routers.interview_preps.db", new_callable=AsyncMock)
    async def test_job_not_found_returns_404(self, mock_db, client):
        mock_db.get_job.return_value = None
        async with client:
            resp = await client.post("/api/v1/interview-preps/generate", json={
                "job_id": "nonexistent",
            })
        assert resp.status_code == 404

    @patch("app.routers.interview_preps.generate_interview_prep", new_callable=AsyncMock)
    @patch("app.routers.interview_preps.db", new_callable=AsyncMock)
    async def test_uses_user_selected_stories(
        self, mock_db, mock_generate, client, sample_job, sample_story,
        sample_prep, generation_result,
    ):
        mock_db.get_job.return_value = sample_job
        mock_db.get_star_story.return_value = sample_story
        mock_db.list_job_histories.return_value = []
        mock_generate.return_value = generation_result
        mock_db.create_interview_prep.return_value = sample_prep

        async with client:
            resp = await client.post("/api/v1/interview-preps/generate", json={
                "job_id": "job-1",
                "star_story_ids": ["s-1"],
                "language": "en",
            })

        assert resp.status_code == 201
        mock_db.get_star_story.assert_called_with("s-1")
        mock_db.list_star_stories.assert_not_called()

    async def test_missing_job_id_returns_422(self, client):
        async with client:
            resp = await client.post("/api/v1/interview-preps/generate", json={
                "language": "en",
            })
        assert resp.status_code == 422


class TestListInterviewPreps:
    """GET /api/v1/interview-preps"""

    @patch("app.routers.interview_preps.db", new_callable=AsyncMock)
    async def test_returns_list_wrapped_in_data(self, mock_db, client, sample_prep):
        mock_db.list_interview_preps.return_value = [sample_prep]
        async with client:
            resp = await client.get("/api/v1/interview-preps")
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data
        assert "request_id" in data
        assert len(data["data"]) == 1
        assert data["data"][0]["prep_id"] == "prep-1"


class TestGetInterviewPrep:
    """GET /api/v1/interview-preps/{prep_id}"""

    @patch("app.routers.interview_preps.db", new_callable=AsyncMock)
    async def test_returns_prep_on_found(self, mock_db, client, sample_prep):
        mock_db.get_interview_prep.return_value = sample_prep
        async with client:
            resp = await client.get("/api/v1/interview-preps/prep-1")
        assert resp.status_code == 200
        assert resp.json()["prep_id"] == "prep-1"

    @patch("app.routers.interview_preps.db", new_callable=AsyncMock)
    async def test_returns_404_on_missing(self, mock_db, client):
        mock_db.get_interview_prep.return_value = None
        async with client:
            resp = await client.get("/api/v1/interview-preps/nonexistent")
        assert resp.status_code == 404


class TestDeleteInterviewPrep:
    """DELETE /api/v1/interview-preps/{prep_id}"""

    @patch("app.routers.interview_preps.db", new_callable=AsyncMock)
    async def test_delete_returns_204(self, mock_db, client):
        mock_db.delete_interview_prep.return_value = True
        async with client:
            resp = await client.delete("/api/v1/interview-preps/prep-1")
        assert resp.status_code == 204

    @patch("app.routers.interview_preps.db", new_callable=AsyncMock)
    async def test_delete_missing_returns_404(self, mock_db, client):
        mock_db.delete_interview_prep.return_value = False
        async with client:
            resp = await client.delete("/api/v1/interview-preps/nonexistent")
        assert resp.status_code == 404
