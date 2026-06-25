"""Tests for the Interview Prep Pydantic schemas.

These tests verify the request/response shapes are importable, accept the
documented input, and reject malformed input. The schemas are pure data
shapes so no database or LLM is involved.
"""

import pytest
from pydantic import ValidationError

from app.schemas.models import (
    GenerateInterviewPrepRequest,
    InterviewPrepResponse,
    InterviewPrepListResponse,
    JobHistoryCreateRequest,
    JobHistoryResponse,
    JobHistoryUpdateRequest,
    MockQAItem,
    QuestionToAskItem,
    StarStoryCreateRequest,
    StarStoryListResponse,
    StarStoryResponse,
    StarStorySummary,
    StarStoryUpdateRequest,
)


# ── STAR Story schemas ────────────────────────────────────────────


class TestStarStorySchemas:
    def test_create_request_minimum_required_fields(self):
        req = StarStoryCreateRequest(
            title="Title", situation="S", task="T", action="A", result="R"
        )
        assert req.title == "Title"
        assert req.tags == []
        assert req.job_history_id is None

    def test_create_request_with_all_fields(self):
        req = StarStoryCreateRequest(
            title="T",
            situation="S",
            task="Ta",
            action="Ac",
            result="R",
            tags=["x", "y"],
            job_history_id="jh-1",
        )
        assert req.tags == ["x", "y"]
        assert req.job_history_id == "jh-1"

    def test_create_request_missing_required_field_raises(self):
        with pytest.raises(ValidationError):
            StarStoryCreateRequest(title="T", situation="S", task="T", action="A")  # type: ignore[call-arg]

    def test_update_request_all_optional(self):
        req = StarStoryUpdateRequest()
        assert req.title is None
        assert req.tags is None

    def test_update_request_partial(self):
        req = StarStoryUpdateRequest(title="New")
        assert req.title == "New"
        assert req.situation is None

    def test_response_shape(self):
        resp = StarStoryResponse(
            story_id="s1",
            title="T",
            situation="S",
            task="Ta",
            action="Ac",
            result="R",
            tags=["a"],
            job_history_id=None,
            created_at="2026-01-01T00:00:00",
            updated_at="2026-01-01T00:00:00",
        )
        assert resp.story_id == "s1"
        assert resp.tags == ["a"]

    def test_list_response_wraps_data(self):
        resp = StarStoryListResponse(
            request_id="req-1",
            data=[
                StarStoryResponse(
                    story_id="s1",
                    title="T",
                    situation="S",
                    task="Ta",
                    action="Ac",
                    result="R",
                    tags=[],
                    job_history_id=None,
                    created_at="2026-01-01T00:00:00",
                    updated_at="2026-01-01T00:00:00",
                )
            ],
        )
        assert resp.request_id == "req-1"
        assert len(resp.data) == 1


# ── Job History schemas ───────────────────────────────────────────


class TestJobHistorySchemas:
    def test_create_request_required_fields(self):
        req = JobHistoryCreateRequest(
            company="Acme", role="Engineer", years="2020-2023", description="Did things"
        )
        assert req.company == "Acme"
        assert req.department is None
        assert req.responsibilities == []
        assert req.skills_used == []

    def test_create_request_full(self):
        req = JobHistoryCreateRequest(
            company="Acme",
            role="Engineer",
            department="Platform",
            years="2020-2023",
            location="Remote",
            description="Did things",
            responsibilities=["A", "B"],
            skills_used=["Python"],
        )
        assert req.department == "Platform"
        assert req.skills_used == ["Python"]

    def test_update_request_all_optional(self):
        req = JobHistoryUpdateRequest()
        assert req.company is None

    def test_response_includes_stories_default_empty(self):
        resp = JobHistoryResponse(
            job_history_id="jh-1",
            company="Acme",
            role="Engineer",
            department=None,
            years="2020-2023",
            location=None,
            description="D",
            responsibilities=[],
            skills_used=[],
            created_at="2026-01-01T00:00:00",
            updated_at="2026-01-01T00:00:00",
        )
        assert resp.stories == []

    def test_response_with_story_summaries(self):
        resp = JobHistoryResponse(
            job_history_id="jh-1",
            company="Acme",
            role="Engineer",
            department=None,
            years="2020-2023",
            location=None,
            description="D",
            responsibilities=[],
            skills_used=[],
            stories=[
                StarStorySummary(story_id="s1", title="T", tags=["x"]),
            ],
            created_at="2026-01-01T00:00:00",
            updated_at="2026-01-01T00:00:00",
        )
        assert len(resp.stories) == 1
        assert resp.stories[0].story_id == "s1"


# ── Mock QA + Questions schemas ───────────────────────────────────


class TestMockQAItem:
    def test_minimum_valid(self):
        item = MockQAItem(question="Q?", answer="A", type="behavioral")
        assert item.story_id is None
        assert item.follow_up is None

    def test_invalid_type_rejected(self):
        with pytest.raises(ValidationError):
            MockQAItem(question="Q", answer="A", type="invalid")  # type: ignore[arg-type]

    @pytest.mark.parametrize(
        "t", ["behavioral", "technical", "situational", "motivational"]
    )
    def test_all_valid_types(self, t: str) -> None:
        item = MockQAItem(question="Q", answer="A", type=t)  # type: ignore[arg-type]
        assert item.type == t


class TestQuestionToAskItem:
    def test_minimum_valid(self):
        item = QuestionToAskItem(question="Q?", category="role", rationale="Why not")
        assert item.bold is False

    def test_invalid_category_rejected(self):
        with pytest.raises(ValidationError):
            QuestionToAskItem(
                question="Q", category="invalid", rationale="r"  # type: ignore[arg-type]
            )

    @pytest.mark.parametrize("c", ["role", "team", "company", "culture", "growth"])
    def test_all_valid_categories(self, c: str) -> None:
        item = QuestionToAskItem(question="Q", category=c, rationale="r")  # type: ignore[arg-type]
        assert item.category == c


# ── Generate request / response ───────────────────────────────────


class TestGenerateRequest:
    def test_minimum(self):
        req = GenerateInterviewPrepRequest(job_id="j-1")
        assert req.job_id == "j-1"
        assert req.star_story_ids == []
        assert req.job_history_ids is None
        assert req.language == "en"

    def test_with_all(self):
        req = GenerateInterviewPrepRequest(
            job_id="j-1",
            star_story_ids=["s1"],
            job_history_ids=["jh-1"],
            language="zh",
        )
        assert req.star_story_ids == ["s1"]
        assert req.language == "zh"

    def test_missing_job_id_raises(self):
        with pytest.raises(ValidationError):
            GenerateInterviewPrepRequest()  # type: ignore[call-arg]


class TestInterviewPrepResponse:
    def test_full_response(self):
        resp = InterviewPrepResponse(
            prep_id="p-1",
            job_id="j-1",
            company_name="Acme",
            role_title="Engineer",
            self_introduction="Hi",
            mock_qa=[
                MockQAItem(
                    question="Q1", answer="A1", type="behavioral", story_id="s1"
                )
            ],
            questions_to_ask=[
                QuestionToAskItem(
                    question="?", category="role", rationale="r"
                )
            ],
            star_story_ids=["s1"],
            created_at="2026-01-01T00:00:00",
        )
        assert resp.company_name == "Acme"
        assert len(resp.mock_qa) == 1
        assert resp.mock_qa[0].story_id == "s1"
        assert len(resp.questions_to_ask) == 1

    def test_list_response(self):
        resp = InterviewPrepListResponse(
            request_id="r-1",
            data=[],
        )
        assert resp.request_id == "r-1"
        assert resp.data == []
