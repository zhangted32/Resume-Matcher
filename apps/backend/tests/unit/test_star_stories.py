"""Tests for STAR story ORM model and facade methods.

TDD: these tests are written BEFORE the production code.
They should fail (red) when first run, then pass (green) once
the ORM model and facade methods are implemented.
"""

import pytest

from app.models import Base
from app.database import Database


@pytest.fixture
async def db(tmp_path):
    database = Database(db_path=tmp_path / "test_star_stories.db")
    yield database
    await database.close()


class TestStarStoryModel:
    """Verify the StarStory ORM model creates the expected table schema."""

    async def test_star_story_table_exists_in_metadata(self):
        """The StarStory class must be registered with SQLAlchemy Base."""
        from app.models import StarStory

        assert StarStory.__tablename__ == "star_stories"
        assert "story_id" in StarStory.__table__.columns
        assert "title" in StarStory.__table__.columns
        assert "situation" in StarStory.__table__.columns
        assert "task" in StarStory.__table__.columns
        assert "action" in StarStory.__table__.columns
        assert "result" in StarStory.__table__.columns
        assert "tags" in StarStory.__table__.columns
        assert "job_history_id" in StarStory.__table__.columns
        assert "created_at" in StarStory.__table__.columns
        assert "updated_at" in StarStory.__table__.columns

    async def test_star_story_table_creates_successfully(self, db):
        """The star_stories table must be created by init_models_sync."""
        # Init runs in db._ensure_initialized() (called by facade property).
        db._ensure_initialized()
        # The table should exist in the Base metadata.
        assert "star_stories" in Base.metadata.tables


class TestStarStoryFacade:
    """Verify Database facade methods for STAR stories."""

    async def test_create_star_story(self, db):
        story = await db.create_star_story(
            title="Optimized payment latency",
            situation="Our payment system had 5s latency",
            task="Reduce latency to under 1s",
            action="Implemented caching and async processing",
            result="Reduced to 300ms, improved conversion by 15%",
            tags=["performance", "backend"],
        )
        assert story["title"] == "Optimized payment latency"
        assert story["story_id"]
        assert story["situation"] == "Our payment system had 5s latency"
        assert story["tags"] == ["performance", "backend"]
        assert story["job_history_id"] is None
        assert story["created_at"]
        assert story["updated_at"]

    async def test_create_star_story_with_job_history(self, db):
        """Can link a story to a job_history_id."""
        # First need a job history to link to — but the foreign key is optional
        # and we can pass any string in tests since FK is nullable.
        story = await db.create_star_story(
            title="Test",
            situation="S",
            task="T",
            action="A",
            result="R",
            job_history_id="fake-job-history-id",
        )
        assert story["job_history_id"] == "fake-job-history-id"

    async def test_create_star_story_default_empty_tags(self, db):
        """Tags default to empty list when not provided."""
        story = await db.create_star_story(
            title="No tags", situation="S", task="T", action="A", result="R"
        )
        assert story["tags"] == []

    async def test_get_star_story(self, db):
        created = await db.create_star_story(
            title="Story", situation="S", task="T", action="A", result="R"
        )
        fetched = await db.get_star_story(created["story_id"])
        assert fetched is not None
        assert fetched["title"] == "Story"

    async def test_get_missing_star_story_returns_none(self, db):
        assert await db.get_star_story("nonexistent-id") is None

    async def test_list_star_stories(self, db):
        await db.create_star_story(title="A", situation="S", task="T", action="A", result="R")
        await db.create_star_story(title="B", situation="S", task="T", action="A", result="R")
        stories = await db.list_star_stories()
        assert len(stories) == 2

    async def test_list_star_stories_by_tag(self, db):
        await db.create_star_story(
            title="Performance", situation="S", task="T", action="A", result="R",
            tags=["performance", "backend"]
        )
        await db.create_star_story(
            title="Leadership", situation="S", task="T", action="A", result="R",
            tags=["leadership"]
        )
        perf = await db.list_star_stories(tag="performance")
        assert len(perf) == 1
        assert perf[0]["title"] == "Performance"

    async def test_list_star_stories_by_job_history(self, db):
        await db.create_star_story(
            title="Linked", situation="S", task="T", action="A", result="R",
            job_history_id="jh-1"
        )
        await db.create_star_story(
            title="Unlinked", situation="S", task="T", action="A", result="R"
        )
        linked = await db.list_star_stories(job_history_id="jh-1")
        assert len(linked) == 1
        assert linked[0]["title"] == "Linked"

    async def test_update_star_story(self, db):
        created = await db.create_star_story(
            title="Original", situation="S", task="T", action="A", result="R"
        )
        updated = await db.update_star_story(
            created["story_id"], title="Updated Title"
        )
        assert updated is not None
        assert updated["title"] == "Updated Title"
        # updated_at should advance
        assert updated["updated_at"] >= created["updated_at"]

    async def test_update_missing_star_story_returns_none(self, db):
        assert await db.update_star_story("nonexistent", title="X") is None

    async def test_delete_star_story(self, db):
        created = await db.create_star_story(
            title="To Delete", situation="S", task="T", action="A", result="R"
        )
        assert await db.delete_star_story(created["story_id"]) is True
        assert await db.get_star_story(created["story_id"]) is None

    async def test_delete_missing_star_story_returns_false(self, db):
        assert await db.delete_star_story("nonexistent") is False
