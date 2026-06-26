"""Integration tests for STAR stories CRUD endpoints.

Uses httpx ASGITransport + AsyncClient against the FastAPI app, with
the database facade mocked via AsyncMock. Tests verify request/response
shapes, status codes, and error handling.
"""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.fixture
def sample_story():
    return {
        "story_id": "s-1",
        "title": "Optimized payment latency",
        "situation": "5s latency",
        "task": "Reduce to 1s",
        "action": "Caching + async",
        "result": "300ms, 15% conversion up",
        "tags": ["performance", "backend"],
        "job_history_id": None,
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    }


class TestListStarStories:
    """GET /api/v1/star-stories"""

    @patch("app.routers.star_stories.db", new_callable=AsyncMock)
    async def test_returns_list_wrapped_in_data(self, mock_db, client, sample_story):
        mock_db.list_star_stories.return_value = [sample_story]
        async with client:
            resp = await client.get("/api/v1/star-stories")
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data
        assert "request_id" in data
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == sample_story["title"]

    @patch("app.routers.star_stories.db", new_callable=AsyncMock)
    async def test_accepts_tag_query_param(self, mock_db, client, sample_story):
        mock_db.list_star_stories.return_value = [sample_story]
        async with client:
            resp = await client.get("/api/v1/star-stories?tag=performance")
        assert resp.status_code == 200
        mock_db.list_star_stories.assert_called_once_with(tag="performance", job_history_id=None)

    @patch("app.routers.star_stories.db", new_callable=AsyncMock)
    async def test_accepts_job_history_id_query_param(self, mock_db, client, sample_story):
        mock_db.list_star_stories.return_value = []
        async with client:
            resp = await client.get("/api/v1/star-stories?job_history_id=jh-1")
        assert resp.status_code == 200
        mock_db.list_star_stories.assert_called_once_with(tag=None, job_history_id="jh-1")


class TestGetStarStory:
    """GET /api/v1/star-stories/{story_id}"""

    @patch("app.routers.star_stories.db", new_callable=AsyncMock)
    async def test_returns_story_on_found(self, mock_db, client, sample_story):
        mock_db.get_star_story.return_value = sample_story
        async with client:
            resp = await client.get("/api/v1/star-stories/s-1")
        assert resp.status_code == 200
        assert resp.json()["story_id"] == "s-1"

    @patch("app.routers.star_stories.db", new_callable=AsyncMock)
    async def test_returns_404_on_missing(self, mock_db, client):
        mock_db.get_star_story.return_value = None
        async with client:
            resp = await client.get("/api/v1/star-stories/nonexistent")
        assert resp.status_code == 404


class TestCreateStarStory:
    """POST /api/v1/star-stories"""

    @patch("app.routers.star_stories.db", new_callable=AsyncMock)
    async def test_creates_and_returns_201(self, mock_db, client, sample_story):
        mock_db.create_star_story.return_value = sample_story
        async with client:
            resp = await client.post("/api/v1/star-stories", json={
                "title": "Optimized payment latency",
                "situation": "5s latency",
                "task": "Reduce to 1s",
                "action": "Caching + async",
                "result": "300ms, 15% conversion up",
                "tags": ["performance", "backend"],
            })
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Optimized payment latency"
        mock_db.create_star_story.assert_called_once()

    async def test_missing_required_field_returns_422(self, client):
        async with client:
            resp = await client.post("/api/v1/star-stories", json={
                "title": "Only title",
            })
        assert resp.status_code == 422


class TestUpdateStarStory:
    """PUT /api/v1/star-stories/{story_id}"""

    @patch("app.routers.star_stories.db", new_callable=AsyncMock)
    async def test_updates_and_returns(self, mock_db, client, sample_story):
        updated = dict(sample_story, title="New Title")
        mock_db.update_star_story.return_value = updated
        async with client:
            resp = await client.put("/api/v1/star-stories/s-1", json={
                "title": "New Title",
            })
        assert resp.status_code == 200
        assert resp.json()["title"] == "New Title"

    @patch("app.routers.star_stories.db", new_callable=AsyncMock)
    async def test_update_missing_returns_404(self, mock_db, client):
        mock_db.update_star_story.return_value = None
        async with client:
            resp = await client.put("/api/v1/star-stories/nonexistent", json={
                "title": "X",
            })
        assert resp.status_code == 404


class TestDeleteStarStory:
    """DELETE /api/v1/star-stories/{story_id}"""

    @patch("app.routers.star_stories.db", new_callable=AsyncMock)
    async def test_delete_returns_204(self, mock_db, client):
        mock_db.delete_star_story.return_value = True
        async with client:
            resp = await client.delete("/api/v1/star-stories/s-1")
        assert resp.status_code == 204

    @patch("app.routers.star_stories.db", new_callable=AsyncMock)
    async def test_delete_missing_returns_404(self, mock_db, client):
        mock_db.delete_star_story.return_value = False
        async with client:
            resp = await client.delete("/api/v1/star-stories/nonexistent")
        assert resp.status_code == 404
