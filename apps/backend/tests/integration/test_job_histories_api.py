"""Integration tests for job history CRUD endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.fixture
def sample_history():
    return {
        "job_history_id": "jh-1",
        "company": "TechCorp",
        "role": "Senior Engineer",
        "years": "2022 - 2024",
        "description": "Led backend team",
        "department": "Platform",
        "location": "Remote",
        "responsibilities": ["Designed APIs", "Led team"],
        "skills_used": ["Python", "Kubernetes"],
        "star_stories": [],
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    }


class TestListJobHistories:
    """GET /api/v1/job-histories"""

    @patch("app.routers.job_histories.db", new_callable=AsyncMock)
    async def test_returns_list_wrapped_in_data(self, mock_db, client, sample_history):
        mock_db.list_job_histories.return_value = [sample_history]
        async with client:
            resp = await client.get("/api/v1/job-histories")
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data
        assert "request_id" in data
        assert len(data["data"]) == 1
        assert data["data"][0]["company"] == "TechCorp"


class TestGetJobHistory:
    """GET /api/v1/job-histories/{job_history_id}"""

    @patch("app.routers.job_histories.db", new_callable=AsyncMock)
    async def test_returns_history_on_found(self, mock_db, client, sample_history):
        mock_db.get_job_history.return_value = sample_history
        async with client:
            resp = await client.get("/api/v1/job-histories/jh-1")
        assert resp.status_code == 200
        assert resp.json()["job_history_id"] == "jh-1"

    @patch("app.routers.job_histories.db", new_callable=AsyncMock)
    async def test_returns_404_on_missing(self, mock_db, client):
        mock_db.get_job_history.return_value = None
        async with client:
            resp = await client.get("/api/v1/job-histories/nonexistent")
        assert resp.status_code == 404


class TestCreateJobHistory:
    """POST /api/v1/job-histories"""

    @patch("app.routers.job_histories.db", new_callable=AsyncMock)
    async def test_creates_and_returns_201(self, mock_db, client, sample_history):
        mock_db.create_job_history.return_value = sample_history
        async with client:
            resp = await client.post("/api/v1/job-histories", json={
                "company": "TechCorp",
                "role": "Senior Engineer",
                "years": "2022 - 2024",
                "description": "Led backend team",
                "department": "Platform",
                "location": "Remote",
                "responsibilities": ["Designed APIs", "Led team"],
                "skills_used": ["Python", "Kubernetes"],
            })
        assert resp.status_code == 201
        data = resp.json()
        assert data["company"] == "TechCorp"
        mock_db.create_job_history.assert_called_once()

    async def test_missing_required_fields_returns_422(self, client):
        async with client:
            resp = await client.post("/api/v1/job-histories", json={
                "company": "Only company",
            })
        assert resp.status_code == 422


class TestUpdateJobHistory:
    """PUT /api/v1/job-histories/{job_history_id}"""

    @patch("app.routers.job_histories.db", new_callable=AsyncMock)
    async def test_updates_and_returns(self, mock_db, client, sample_history):
        updated = dict(sample_history, role="Staff Engineer")
        mock_db.update_job_history.return_value = updated
        async with client:
            resp = await client.put("/api/v1/job-histories/jh-1", json={
                "role": "Staff Engineer",
            })
        assert resp.status_code == 200
        assert resp.json()["role"] == "Staff Engineer"

    @patch("app.routers.job_histories.db", new_callable=AsyncMock)
    async def test_update_missing_returns_404(self, mock_db, client):
        mock_db.update_job_history.return_value = None
        async with client:
            resp = await client.put("/api/v1/job-histories/nonexistent", json={
                "role": "X",
            })
        assert resp.status_code == 404


class TestDeleteJobHistory:
    """DELETE /api/v1/job-histories/{job_history_id}"""

    @patch("app.routers.job_histories.db", new_callable=AsyncMock)
    async def test_delete_returns_204(self, mock_db, client):
        mock_db.delete_job_history.return_value = True
        async with client:
            resp = await client.delete("/api/v1/job-histories/jh-1")
        assert resp.status_code == 204

    @patch("app.routers.job_histories.db", new_callable=AsyncMock)
    async def test_delete_missing_returns_404(self, mock_db, client):
        mock_db.delete_job_history.return_value = False
        async with client:
            resp = await client.delete("/api/v1/job-histories/nonexistent")
        assert resp.status_code == 404
