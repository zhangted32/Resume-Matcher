"""Tests for Job History and Interview Prep facade methods."""

import pytest

from app.database import Database


@pytest.fixture
async def db(tmp_path):
    database = Database(db_path=tmp_path / "test_job_history.db")
    yield database
    await database.close()


# ── Job History ────────────────────────────────────────────────────


class TestJobHistoryFacade:
    async def test_create_job_history(self, db: Database) -> None:
        created = await db.create_job_history(
            company="Acme",
            role="Senior Engineer",
            years="2020-2023",
            description="Built scalable systems",
            department="Platform",
            location="Remote",
            responsibilities=["Designed APIs", "Mentored juniors"],
            skills_used=["Python", "FastAPI"],
        )
        assert created["job_history_id"]
        assert created["company"] == "Acme"
        assert created["department"] == "Platform"
        assert created["responsibilities"] == ["Designed APIs", "Mentored juniors"]
        assert created["skills_used"] == ["Python", "FastAPI"]
        assert created["stories"] == []
        assert created["created_at"]
        assert created["updated_at"]

    async def test_create_job_history_minimum(self, db: Database) -> None:
        created = await db.create_job_history(
            company="X",
            role="Y",
            years="2018",
            description="Did things",
        )
        assert created["department"] is None
        assert created["location"] is None
        assert created["responsibilities"] == []
        assert created["skills_used"] == []

    async def test_get_job_history(self, db: Database) -> None:
        created = await db.create_job_history(
            company="X", role="Y", years="2018", description="D"
        )
        fetched = await db.get_job_history(created["job_history_id"])
        assert fetched is not None
        assert fetched["company"] == "X"

    async def test_get_missing_job_history(self, db: Database) -> None:
        assert await db.get_job_history("nonexistent") is None

    async def test_list_job_histories(self, db: Database) -> None:
        await db.create_job_history(company="A", role="R", years="y", description="d")
        await db.create_job_history(company="B", role="R", years="y", description="d")
        histories = await db.list_job_histories()
        assert len(histories) == 2

    async def test_update_job_history(self, db: Database) -> None:
        created = await db.create_job_history(
            company="X", role="Y", years="2018", description="D"
        )
        updated = await db.update_job_history(
            created["job_history_id"], company="New Co", role="Senior Y"
        )
        assert updated is not None
        assert updated["company"] == "New Co"
        assert updated["role"] == "Senior Y"
        assert updated["updated_at"] >= created["updated_at"]

    async def test_update_missing_job_history(self, db: Database) -> None:
        assert await db.update_job_history("nope", company="X") is None

    async def test_delete_job_history(self, db: Database) -> None:
        created = await db.create_job_history(
            company="X", role="Y", years="2018", description="D"
        )
        assert await db.delete_job_history(created["job_history_id"]) is True
        assert await db.get_job_history(created["job_history_id"]) is None

    async def test_delete_missing_job_history(self, db: Database) -> None:
        assert await db.delete_job_history("nope") is False

    async def test_job_history_includes_linked_stories(self, db: Database) -> None:
        """A JobHistory response embeds summaries of stories linked via job_history_id."""
        history = await db.create_job_history(
            company="X", role="Y", years="2018", description="D"
        )
        await db.create_star_story(
            title="Linked",
            situation="S",
            task="T",
            action="A",
            result="R",
            job_history_id=history["job_history_id"],
        )
        await db.create_star_story(
            title="Unlinked",
            situation="S",
            task="T",
            action="A",
            result="R",
        )
        fetched = await db.get_job_history(history["job_history_id"])
        assert fetched is not None
        assert len(fetched["stories"]) == 1
        assert fetched["stories"][0]["title"] == "Linked"


# ── Interview Prep ─────────────────────────────────────────────────


class TestInterviewPrepFacade:
    async def test_create_and_get(self, db: Database) -> None:
        mock_qa = [
            {
                "question": "Q1",
                "answer": "A1",
                "story_id": None,
                "type": "behavioral",
                "follow_up": None,
            }
        ]
        questions = [
            {
                "question": "What is success?",
                "category": "role",
                "rationale": "Understand expectations",
                "bold": False,
            }
        ]
        created = await db.create_interview_prep(
            job_id="j-1",
            star_story_ids=["s-1"],
            mock_qa=mock_qa,
            self_introduction="Hi, I'm ...",
            questions_to_ask=questions,
            company_name="Acme",
            role_title="Engineer",
        )
        assert created["prep_id"]
        assert created["job_id"] == "j-1"
        assert created["company_name"] == "Acme"
        assert created["self_introduction"] == "Hi, I'm ..."
        assert len(created["mock_qa"]) == 1
        assert len(created["questions_to_ask"]) == 1

        fetched = await db.get_interview_prep(created["prep_id"])
        assert fetched is not None
        assert fetched["company_name"] == "Acme"
        assert fetched["self_introduction"] == "Hi, I'm ..."

    async def test_get_missing(self, db: Database) -> None:
        assert await db.get_interview_prep("nonexistent") is None

    async def test_list_interview_preps(self, db: Database) -> None:
        await db.create_interview_prep(
            job_id="j-1",
            star_story_ids=[],
            mock_qa=[],
            self_introduction="",
            questions_to_ask=[],
            company_name="A",
            role_title="R",
        )
        await db.create_interview_prep(
            job_id="j-2",
            star_story_ids=[],
            mock_qa=[],
            self_introduction="",
            questions_to_ask=[],
            company_name="B",
            role_title="R",
        )
        preps = await db.list_interview_preps()
        assert len(preps) == 2

    async def test_delete_interview_prep(self, db: Database) -> None:
        created = await db.create_interview_prep(
            job_id="j-1",
            star_story_ids=[],
            mock_qa=[],
            self_introduction="",
            questions_to_ask=[],
            company_name="A",
            role_title="R",
        )
        assert await db.delete_interview_prep(created["prep_id"]) is True
        assert await db.get_interview_prep(created["prep_id"]) is None

    async def test_delete_missing_interview_prep(self, db: Database) -> None:
        assert await db.delete_interview_prep("nope") is False

    async def test_create_with_empty_lists(self, db: Database) -> None:
        """Empty mock_qa / questions are stored as [] not null."""
        created = await db.create_interview_prep(
            job_id="j-1",
            star_story_ids=[],
            mock_qa=[],
            self_introduction="",
            questions_to_ask=[],
            company_name=None,
            role_title=None,
        )
        assert created["mock_qa"] == []
        assert created["questions_to_ask"] == []
        assert created["star_story_ids"] == []
        assert created["company_name"] is None
