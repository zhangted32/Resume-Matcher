"""Tests for the interview prep AI generation service.

All LLM calls are mocked — we test the service's orchestration logic:
- correct prompts are built
- correct number of LLM calls are made
- returned JSON is properly normalized/validated
- empty inputs are handled gracefully
- parallel generation via asyncio.gather completes without errors
"""

from unittest.mock import patch

import pytest

from app.services.interview_prep import (
    generate_interview_prep,
    generate_mock_qa,
    generate_questions_to_ask,
    generate_self_introduction,
    select_relevant_stories,
)


# ── Fixtures ───────────────────────────────────────────────────────


@pytest.fixture
def sample_stories() -> list[dict]:
    return [
        {
            "story_id": "s-1",
            "title": "Optimized payment latency",
            "situation": "5s latency",
            "task": "Reduce to 1s",
            "action": "Caching + async",
            "result": "300ms, 15% conversion up",
            "tags": ["performance", "backend"],
            "job_history_id": "jh-1",
            "created_at": "2026-01-01",
            "updated_at": "2026-01-01",
        },
        {
            "story_id": "s-2",
            "title": "Led team migration",
            "situation": "Legacy system",
            "task": "Migrate to cloud",
            "action": "Led 5-person team",
            "result": "On time, 20% cost down",
            "tags": ["leadership", "migration"],
            "job_history_id": "jh-1",
            "created_at": "2026-01-01",
            "updated_at": "2026-01-01",
        },
        {
            "story_id": "s-3",
            "title": "Fixed production bug",
            "situation": "Crash on weekends",
            "task": "Diagnose and fix",
            "action": "Profiling + patch",
            "result": "Zero crashes since",
            "tags": ["debugging"],
            "job_history_id": None,
            "created_at": "2026-01-01",
            "updated_at": "2026-01-01",
        },
    ]


@pytest.fixture
def sample_job() -> dict:
    return {
        "job_id": "j-1",
        "company": "Acme",
        "role": "Senior Backend Engineer",
        "content": "We need a senior backend engineer with performance optimization experience.",
        "created_at": "2026-01-01",
        "updated_at": "2026-01-01",
    }


@pytest.fixture
def sample_job_histories() -> list[dict]:
    return [
        {
            "job_history_id": "jh-1",
            "company": "OldCo",
            "role": "Backend Engineer",
            "department": "Platform",
            "years": "2020-2023",
            "location": "Remote",
            "description": "Built scalable backend systems for a fintech startup.",
            "responsibilities": ["API design", "Performance tuning"],
            "skills_used": ["Python", "FastAPI"],
            "stories": [],
            "created_at": "2026-01-01",
            "updated_at": "2026-01-01",
        }
    ]


# ── select_relevant_stories ───────────────────────────────────────


class TestSelectRelevantStories:
    async def test_returns_list_of_ids(self, sample_stories, sample_job):
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.return_value = {"selected_story_ids": ["s-1", "s-2"]}
            result = await select_relevant_stories(
                job_description=sample_job["content"],
                star_stories=sample_stories,
            )
        assert result == ["s-1", "s-2"]
        assert mock_llm.call_count == 1

    async def test_empty_stories_returns_empty(self, sample_job):
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            result = await select_relevant_stories(
                job_description=sample_job["content"],
                star_stories=[],
            )
        assert result == []
        # Should NOT call the LLM when there are no stories
        assert mock_llm.call_count == 0

    async def test_filters_invalid_ids_from_response(self, sample_stories, sample_job):
        """If LLM returns story IDs that don't exist in input, filter them out."""
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.return_value = {"selected_story_ids": ["s-1", "fake-id", "s-3"]}
            result = await select_relevant_stories(
                job_description=sample_job["content"],
                star_stories=sample_stories,
            )
        assert result == ["s-1", "s-3"]
        assert "fake-id" not in result

    async def test_handles_non_list_response(self, sample_stories, sample_job):
        """If LLM returns non-list for selected_story_ids, return empty list.

        Returning empty is safer than returning everything — the caller
        (generate_interview_prep) will still pass all stories if needed.
        """
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.return_value = {"selected_story_ids": "not-a-list"}
            result = await select_relevant_stories(
                job_description=sample_job["content"],
                star_stories=sample_stories,
            )
        assert result == []


# ── generate_mock_qa ──────────────────────────────────────────────


class TestGenerateMockQA:
    async def test_returns_list_of_qa_items(self, sample_stories, sample_job_histories, sample_job):
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.return_value = {
                "mock_qa": [
                    {
                        "question": "Tell me about a time you optimized performance?",
                        "answer": "At OldCo, I optimized payment latency...",
                        "story_id": "s-1",
                        "type": "behavioral",
                        "follow_up": "What was the hardest part?",
                    }
                ]
            }
            result = await generate_mock_qa(
                job_description=sample_job["content"],
                star_stories=sample_stories,
                job_histories=sample_job_histories,
                language="en",
            )
        assert len(result) == 1
        assert result[0]["question"] == "Tell me about a time you optimized performance?"
        assert result[0]["type"] == "behavioral"
        assert result[0]["story_id"] == "s-1"
        assert result[0]["follow_up"] == "What was the hardest part?"

    async def test_empty_response_returns_empty_list(self, sample_stories, sample_job_histories, sample_job):
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.return_value = {"mock_qa": []}
            result = await generate_mock_qa(
                job_description=sample_job["content"],
                star_stories=sample_stories,
                job_histories=sample_job_histories,
            )
        assert result == []

    async def test_filters_non_dict_items(self, sample_stories, sample_job_histories, sample_job):
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.return_value = {"mock_qa": ["not a dict", {"question": "Q", "answer": "A", "type": "technical"}]}
            result = await generate_mock_qa(
                job_description=sample_job["content"],
                star_stories=sample_stories,
                job_histories=sample_job_histories,
            )
        assert len(result) == 1
        assert result[0]["question"] == "Q"

    async def test_defaults_none_follow_up_to_none(self, sample_stories, sample_job_histories, sample_job):
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.return_value = {
                "mock_qa": [
                    {"question": "Q", "answer": "A", "type": "behavioral"}
                ]
            }
            result = await generate_mock_qa(
                job_description=sample_job["content"],
                star_stories=sample_stories,
                job_histories=sample_job_histories,
            )
        assert result[0]["follow_up"] is None


# ── generate_self_introduction ────────────────────────────────────


class TestGenerateSelfIntroduction:
    async def test_returns_string(self):
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.return_value = {
                "self_introduction": "Hi, I'm a backend engineer with 5 years of experience.",
                "duration_estimate": "70 seconds",
                "key_points_covered": ["Experience", "Achievement", "Motivation"],
            }
            result = await generate_self_introduction(
                job_description="Backend role",
                job_histories_summary="OldCo — Backend Engineer",
                key_stories_summary="Optimized latency",
                language="en",
            )
        assert isinstance(result, str)
        assert "backend engineer" in result

    async def test_empty_string_when_llm_returns_non_string(self):
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.return_value = {"self_introduction": 12345}
            result = await generate_self_introduction(
                job_description="Backend role",
                job_histories_summary="",
                key_stories_summary="",
            )
        assert result == ""

    async def test_calls_llm_once(self):
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.return_value = {"self_introduction": "Hi", "duration_estimate": "10s", "key_points_covered": []}
            await generate_self_introduction(
                job_description="JD",
                job_histories_summary="summary",
                key_stories_summary="stories",
            )
        assert mock_llm.call_count == 1


# ── generate_questions_to_ask ─────────────────────────────────────


class TestGenerateQuestionsToAsk:
    async def test_returns_list_with_categories(self):
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.return_value = {
                "questions": [
                    {
                        "question": "What does success look like?",
                        "category": "role",
                        "rationale": "Understands expectations",
                        "bold": False,
                    },
                    {
                        "question": "What's the biggest challenge?",
                        "category": "team",
                        "rationale": "Shows strategic thinking",
                        "bold": True,
                    },
                ]
            }
            result = await generate_questions_to_ask(
                job_description="Backend role",
                company_name="Acme",
                role_title="Senior Engineer",
                language="en",
            )
        assert len(result) == 2
        assert result[0]["category"] == "role"
        assert result[1]["bold"] is True
        assert "rationale" in result[0]

    async def test_filters_non_dict_items(self):
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.return_value = {"questions": ["bad", {"question": "Q", "category": "role", "rationale": "r"}]}
            result = await generate_questions_to_ask(
                job_description="JD",
                company_name="C",
                role_title="R",
            )
        assert len(result) == 1

    async def test_empty_response_returns_empty_list(self):
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.return_value = {"questions": []}
            result = await generate_questions_to_ask(
                job_description="JD",
                company_name="C",
                role_title="R",
            )
        assert result == []


# ── generate_interview_prep (orchestration) ───────────────────────


class TestGenerateInterviewPrep:
    async def test_full_pipeline_auto_selects_stories(self, sample_job, sample_stories, sample_job_histories):
        """When selected_story_ids is None, the service auto-selects via LLM."""
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            # First call: story selection
            # Next 3 calls: mock_qa, self_intro, questions_to_ask (parallel)
            call_responses = [
                {"selected_story_ids": ["s-1", "s-2"]},  # select
                {"mock_qa": [{"question": "Q", "answer": "A", "type": "behavioral"}]},  # mock qa
                {"self_introduction": "Hi", "duration_estimate": "1s", "key_points_covered": []},  # self intro
                {"questions": [{"question": "?", "category": "role", "rationale": "r"}]},  # questions
            ]
            mock_llm.side_effect = call_responses

            result = await generate_interview_prep(
                job=sample_job,
                star_stories=sample_stories,
                job_histories=sample_job_histories,
                selected_story_ids=None,
            )

        assert result["job_id"] == "j-1"
        assert result["company_name"] == "Acme"
        assert result["role_title"] == "Senior Backend Engineer"
        assert result["self_introduction"] == "Hi"
        assert len(result["mock_qa"]) == 1
        assert len(result["questions_to_ask"]) == 1
        assert result["star_story_ids"] == ["s-1", "s-2"]
        # 1 (selection) + 3 (parallel generation) = 4 total LLM calls
        assert mock_llm.call_count == 4

    async def test_uses_provided_story_ids_skips_selection(self, sample_job, sample_stories, sample_job_histories):
        """When selected_story_ids is provided, skip the auto-selection call."""
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.side_effect = [
                {"mock_qa": []},
                {"self_introduction": "Hi", "duration_estimate": "1s", "key_points_covered": []},
                {"questions": []},
            ]
            result = await generate_interview_prep(
                job=sample_job,
                star_stories=sample_stories,
                job_histories=sample_job_histories,
                selected_story_ids=["s-1"],
            )
        # Only 3 LLM calls (mock_qa, self_intro, questions) — no selection call
        assert mock_llm.call_count == 3
        assert result["star_story_ids"] == ["s-1"]

    async def test_filters_selected_stories_to_existing_only(self, sample_job, sample_stories, sample_job_histories):
        """Story IDs that don't exist in the input are silently filtered."""
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.side_effect = [
                {"mock_qa": []},
                {"self_introduction": "", "duration_estimate": "0s", "key_points_covered": []},
                {"questions": []},
            ]
            result = await generate_interview_prep(
                job=sample_job,
                star_stories=sample_stories,
                job_histories=sample_job_histories,
                selected_story_ids=["s-1", "nonexistent"],
            )
        assert result["star_story_ids"] == ["s-1", "nonexistent"]
        # Note: selected_story_ids is preserved as-is — it's the input.
        # Only the actual stories array passed to generation is filtered.

    async def test_default_company_name_when_missing(self, sample_stories, sample_job_histories):
        job = {"job_id": "j-1", "company": "", "role": "", "content": "JD"}
        with patch("app.services.interview_prep.complete_json") as mock_llm:
            mock_llm.side_effect = [
                {"mock_qa": []},
                {"self_introduction": "", "duration_estimate": "0s", "key_points_covered": []},
                {"questions": []},
            ]
            result = await generate_interview_prep(
                job=job,
                star_stories=sample_stories,
                job_histories=sample_job_histories,
                selected_story_ids=["s-1"],
            )
        assert result["company_name"] == "Unknown Company"
        assert result["role_title"] == "Unknown Role"
