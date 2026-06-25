"""Tests for interview prep LLM prompt templates.

These tests verify that the prompts exist, contain the required placeholders,
and format correctly with realistic input. They do NOT call the LLM — they
only validate the prompt text itself.
"""

import json

import pytest

from app.prompts.interview_prep import (
    GENERATE_MOCK_QA_PROMPT,
    GENERATE_QUESTIONS_TO_ASK_PROMPT,
    GENERATE_SELF_INTRO_PROMPT,
    SELECT_RELEVANT_STORIES_PROMPT,
)


# ── Sanity: importability & basic shape ────────────────────────────


class TestPromptExistence:
    def test_all_four_prompts_are_strings(self):
        assert isinstance(SELECT_RELEVANT_STORIES_PROMPT, str)
        assert isinstance(GENERATE_MOCK_QA_PROMPT, str)
        assert isinstance(GENERATE_SELF_INTRO_PROMPT, str)
        assert isinstance(GENERATE_QUESTIONS_TO_ASK_PROMPT, str)

    def test_all_prompts_are_nonempty(self):
        assert len(SELECT_RELEVANT_STORIES_PROMPT) > 100
        assert len(GENERATE_MOCK_QA_PROMPT) > 100
        assert len(GENERATE_SELF_INTRO_PROMPT) > 100
        assert len(GENERATE_QUESTIONS_TO_ASK_PROMPT) > 100


# ── Placeholder checks ─────────────────────────────────────────────


class TestStorySelectionPrompt:
    def test_required_placeholders_exist(self):
        assert "{job_description}" in SELECT_RELEVANT_STORIES_PROMPT
        assert "{star_stories}" in SELECT_RELEVANT_STORIES_PROMPT

    def test_format_returns_string(self):
        result = SELECT_RELEVANT_STORIES_PROMPT.format(
            job_description="Backend Engineer",
            star_stories=json.dumps([{"story_id": "s1", "title": "T"}], ensure_ascii=False),
        )
        assert isinstance(result, str)
        assert "Backend Engineer" in result
        assert "s1" in result

    def test_prompt_mentions_4_8_stories(self):
        """Selection should aim for 4-8 stories per the design spec."""
        assert "4" in SELECT_RELEVANT_STORIES_PROMPT and "8" in SELECT_RELEVANT_STORIES_PROMPT

    def test_output_mentions_json(self):
        """The LLM should be instructed to output valid JSON only."""
        assert "JSON" in SELECT_RELEVANT_STORIES_PROMPT

    def test_output_schema_includes_selected_story_ids(self):
        assert "selected_story_ids" in SELECT_RELEVANT_STORIES_PROMPT


class TestMockQAPrompt:
    def test_required_placeholders_exist(self):
        assert "{job_description}" in GENERATE_MOCK_QA_PROMPT
        assert "{star_stories}" in GENERATE_MOCK_QA_PROMPT
        assert "{job_histories}" in GENERATE_MOCK_QA_PROMPT
        assert "{output_language}" in GENERATE_MOCK_QA_PROMPT

    def test_format_returns_string(self):
        result = GENERATE_MOCK_QA_PROMPT.format(
            job_description="Backend Engineer",
            star_stories=json.dumps([]),
            job_histories=json.dumps([]),
            output_language="English",
        )
        assert isinstance(result, str)
        assert "Backend Engineer" in result
        assert "English" in result

    def test_mentions_all_four_question_types(self):
        assert "behavioral" in GENERATE_MOCK_QA_PROMPT.lower()
        assert "technical" in GENERATE_MOCK_QA_PROMPT.lower()
        assert "situational" in GENERATE_MOCK_QA_PROMPT.lower()
        assert "motivational" in GENERATE_MOCK_QA_PROMPT.lower()

    def test_mentions_not_inventing_experiences(self):
        """Crucial rule: LLM must not fabricate experiences."""
        text = GENERATE_MOCK_QA_PROMPT.lower()
        assert "do not invent" in text or "invent" in text or "not invent" in text

    def test_output_includes_follow_up(self):
        """Q&A items should include optional follow-up questions."""
        assert "follow_up" in GENERATE_MOCK_QA_PROMPT


class TestSelfIntroPrompt:
    def test_required_placeholders_exist(self):
        assert "{job_description}" in GENERATE_SELF_INTRO_PROMPT
        assert "{job_histories_summary}" in GENERATE_SELF_INTRO_PROMPT
        assert "{key_stories_summary}" in GENERATE_SELF_INTRO_PROMPT
        assert "{output_language}" in GENERATE_SELF_INTRO_PROMPT

    def test_format_returns_string(self):
        result = GENERATE_SELF_INTRO_PROMPT.format(
            job_description="Backend Engineer",
            job_histories_summary="Google — Senior Engineer",
            key_stories_summary="Optimized latency",
            output_language="English",
        )
        assert isinstance(result, str)
        assert "Senior Engineer" in result

    def test_mentions_duration_target(self):
        """Self intro should target 60-90 seconds per design spec."""
        text = GENERATE_SELF_INTRO_PROMPT.lower()
        assert "60" in text and "90" in text

    def test_output_includes_self_introduction_key(self):
        assert "self_introduction" in GENERATE_SELF_INTRO_PROMPT


class TestQuestionsToAskPrompt:
    def test_required_placeholders_exist(self):
        assert "{job_description}" in GENERATE_QUESTIONS_TO_ASK_PROMPT
        assert "{company_name}" in GENERATE_QUESTIONS_TO_ASK_PROMPT
        assert "{role_title}" in GENERATE_QUESTIONS_TO_ASK_PROMPT
        assert "{output_language}" in GENERATE_QUESTIONS_TO_ASK_PROMPT

    def test_format_returns_string(self):
        result = GENERATE_QUESTIONS_TO_ASK_PROMPT.format(
            job_description="Backend Engineer",
            company_name="Acme",
            role_title="Senior Engineer",
            output_language="English",
        )
        assert isinstance(result, str)
        assert "Acme" in result
        assert "Senior Engineer" in result

    def test_mentions_all_five_categories(self):
        text = GENERATE_QUESTIONS_TO_ASK_PROMPT.lower()
        assert "role" in text
        assert "team" in text
        assert "company" in text
        assert "culture" in text
        assert "growth" in text

    def test_mentions_rationale(self):
        """Each question should include why it's a good question."""
        assert "rationale" in GENERATE_QUESTIONS_TO_ASK_PROMPT

    def test_mentions_bold(self):
        """Some questions should be marked as bold/strategic."""
        assert "bold" in GENERATE_QUESTIONS_TO_ASK_PROMPT.lower()


# ── JSON structure hints ───────────────────────────────────────────


class TestJsonOutputHints:
    def test_story_selection_output_has_mockqa_keys(self):
        """The output JSON should contain a 'mock_qa' array with expected keys."""
        # Just verify the prompt instructs the correct structure
        assert '"question"' in GENERATE_MOCK_QA_PROMPT
        assert '"answer"' in GENERATE_MOCK_QA_PROMPT
        assert '"story_id"' in GENERATE_MOCK_QA_PROMPT
        assert '"type"' in GENERATE_MOCK_QA_PROMPT

    def test_questions_to_ask_has_question_and_category(self):
        assert '"question"' in GENERATE_QUESTIONS_TO_ASK_PROMPT
        assert '"category"' in GENERATE_QUESTIONS_TO_ASK_PROMPT
