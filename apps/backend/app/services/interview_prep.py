"""Interview preparation generation service.

Orchestrates LLM calls to produce a complete interview prep bundle:
- Story auto-selection (optional — skipped when user provides IDs)
- Mock interview Q&A (behavioral / technical / situational / motivational)
- Self-introduction script
- Questions to ask the interviewer

The three generation steps (mock QA, self-intro, questions) run in parallel
via ``asyncio.gather`` after story selection completes.
"""

import asyncio
import json
import logging
from typing import Any

from app.llm import complete_json
from app.prompts import (
    GENERATE_MOCK_QA_PROMPT,
    GENERATE_QUESTIONS_TO_ASK_PROMPT,
    GENERATE_SELF_INTRO_PROMPT,
    SELECT_RELEVANT_STORIES_PROMPT,
    get_language_name,
)
from app.services.improver import _sanitize_user_input

logger = logging.getLogger(__name__)


# ── Story selection ────────────────────────────────────────────────


async def select_relevant_stories(
    job_description: str,
    star_stories: list[dict[str, Any]],
    language: str = "en",
) -> list[str]:
    """Select the most relevant STAR stories for a given job description.

    Returns a list of story IDs in priority order (most relevant first).
    Returns an empty list if no stories are provided (no LLM call needed).
    Silently filters out any IDs returned by the LLM that don't exist in the
    input (safety net against hallucination).
    """
    if not star_stories:
        return []

    stories_json = json.dumps(star_stories, ensure_ascii=False)
    sanitized_jd = _sanitize_user_input(job_description)

    prompt = SELECT_RELEVANT_STORIES_PROMPT.format(
        job_description=sanitized_jd,
        star_stories=stories_json,
    )

    try:
        result = await complete_json(
            prompt=prompt,
            system_prompt="You are an expert career coach. Output only valid JSON.",
            max_tokens=2048,
            schema_type="keywords",
        )
    except Exception as exc:
        logger.warning("Story selection LLM call failed: %s", exc)
        return []

    selected = result.get("selected_story_ids", [])
    if not isinstance(selected, list):
        logger.warning("LLM returned non-list selected_story_ids: %s", type(selected))
        return []

    # Validate against input — silently drop hallucinated IDs
    valid_ids = {s["story_id"] for s in star_stories}
    filtered = [sid for sid in selected if isinstance(sid, str) and sid in valid_ids]
    logger.info("Selected %d of %d available stories", len(filtered), len(star_stories))
    return filtered


# ── Mock QA generation ─────────────────────────────────────────────


async def generate_mock_qa(
    job_description: str,
    star_stories: list[dict[str, Any]],
    job_histories: list[dict[str, Any]],
    language: str = "en",
) -> list[dict[str, Any]]:
    """Generate mock interview Q&A pairs.

    Each returned dict has keys: question, answer, story_id (or None),
    type (behavioral/technical/situational/motivational), follow_up (or None).
    """
    output_language = get_language_name(language)
    sanitized_jd = _sanitize_user_input(job_description)
    stories_json = json.dumps(star_stories, ensure_ascii=False)
    histories_json = json.dumps(job_histories, ensure_ascii=False)

    prompt = GENERATE_MOCK_QA_PROMPT.format(
        job_description=sanitized_jd,
        star_stories=stories_json,
        job_histories=histories_json,
        output_language=output_language,
    )

    try:
        result = await complete_json(
            prompt=prompt,
            system_prompt="You are an expert technical interviewer. Output only valid JSON.",
            max_tokens=4096,
            schema_type="resume",
        )
    except Exception as exc:
        logger.error("Mock QA generation failed: %s", exc)
        return []

    mock_qa = result.get("mock_qa", [])
    if not isinstance(mock_qa, list):
        logger.warning("LLM returned non-list mock_qa: %s", type(mock_qa))
        return []

    normalized: list[dict[str, Any]] = []
    for item in mock_qa:
        if not isinstance(item, dict):
            continue
        normalized.append({
            "question": str(item.get("question", "")),
            "answer": str(item.get("answer", "")),
            "story_id": item.get("story_id"),
            "type": item.get("type", "behavioral"),
            "follow_up": item.get("follow_up"),
        })

    return normalized


# ── Self introduction generation ───────────────────────────────────


async def generate_self_introduction(
    job_description: str,
    job_histories_summary: str,
    key_stories_summary: str,
    language: str = "en",
) -> str:
    """Generate a 60-90 second self introduction script.

    Returns the introduction text as a plain string.
    """
    output_language = get_language_name(language)
    sanitized_jd = _sanitize_user_input(job_description)

    prompt = GENERATE_SELF_INTRO_PROMPT.format(
        job_description=sanitized_jd,
        job_histories_summary=job_histories_summary,
        key_stories_summary=key_stories_summary,
        output_language=output_language,
    )

    try:
        result = await complete_json(
            prompt=prompt,
            system_prompt="You are an expert career coach. Output only valid JSON.",
            max_tokens=2048,
            schema_type="keywords",
        )
    except Exception as exc:
        logger.error("Self introduction generation failed: %s", exc)
        return ""

    intro = result.get("self_introduction", "")
    if not isinstance(intro, str):
        logger.warning("LLM returned non-string self_introduction: %s", type(intro))
        return ""

    return intro


# ── Questions to ask generation ────────────────────────────────────


async def generate_questions_to_ask(
    job_description: str,
    company_name: str,
    role_title: str,
    language: str = "en",
) -> list[dict[str, Any]]:
    """Generate questions the candidate can ask the interviewer.

    Each returned dict has keys: question, category (role/team/company/culture/growth),
    rationale, bold (boolean).
    """
    output_language = get_language_name(language)
    sanitized_jd = _sanitize_user_input(job_description)

    prompt = GENERATE_QUESTIONS_TO_ASK_PROMPT.format(
        job_description=sanitized_jd,
        company_name=company_name,
        role_title=role_title,
        output_language=output_language,
    )

    try:
        result = await complete_json(
            prompt=prompt,
            system_prompt="You are a career strategist. Output only valid JSON.",
            max_tokens=2048,
            schema_type="keywords",
        )
    except Exception as exc:
        logger.error("Questions-to-ask generation failed: %s", exc)
        return []

    questions = result.get("questions", [])
    if not isinstance(questions, list):
        logger.warning("LLM returned non-list questions: %s", type(questions))
        return []

    normalized: list[dict[str, Any]] = []
    for item in questions:
        if not isinstance(item, dict):
            continue
        normalized.append({
            "question": str(item.get("question", "")),
            "category": item.get("category", "role"),
            "rationale": str(item.get("rationale", "")),
            "bold": bool(item.get("bold", False)),
        })

    return normalized


# ── Orchestrator ───────────────────────────────────────────────────


async def generate_interview_prep(
    job: dict[str, Any],
    star_stories: list[dict[str, Any]],
    job_histories: list[dict[str, Any]],
    selected_story_ids: list[str] | None = None,
    language: str = "en",
) -> dict[str, Any]:
    """Run the full interview prep generation pipeline.

    Steps:
    1. If ``selected_story_ids`` is None, auto-select via LLM
    2. Generate mock QA, self introduction, and questions (in parallel)
    3. Return a dict matching the InterviewPrepResponse shape (without prep_id)

    The three generation calls run concurrently via ``asyncio.gather``.
    """
    job_id = job.get("job_id", "")
    job_description = job.get("content", "")
    company_name = job.get("company") or "Unknown Company"
    role_title = job.get("role") or "Unknown Role"

    # Step 1: auto-select stories if not provided
    if selected_story_ids is None:
        selected_story_ids = await select_relevant_stories(
            job_description=job_description,
            star_stories=star_stories,
            language=language,
        )

    # Filter stories to the selected set for generation
    story_map = {s["story_id"]: s for s in star_stories}
    selected_stories = [
        story_map[sid] for sid in selected_story_ids if sid in story_map
    ]

    # Build compact summaries for the self-intro prompt
    histories_summary = "\n\n".join(
        f"{h.get('company', '')} — {h.get('role', '')}: {h.get('description', '')}"
        for h in job_histories
    )
    stories_summary = "\n\n".join(
        f"{s.get('title', '')}: {s.get('situation', '')} {s.get('task', '')} {s.get('action', '')} {s.get('result', '')}"
        for s in selected_stories
    )

    # Step 2: parallel generation
    mock_qa_task = generate_mock_qa(
        job_description=job_description,
        star_stories=selected_stories,
        job_histories=job_histories,
        language=language,
    )
    self_intro_task = generate_self_introduction(
        job_description=job_description,
        job_histories_summary=histories_summary,
        key_stories_summary=stories_summary,
        language=language,
    )
    questions_task = generate_questions_to_ask(
        job_description=job_description,
        company_name=company_name,
        role_title=role_title,
        language=language,
    )

    mock_qa, self_introduction, questions_to_ask = await asyncio.gather(
        mock_qa_task,
        self_intro_task,
        questions_task,
    )

    return {
        "job_id": job_id,
        "company_name": company_name,
        "role_title": role_title,
        "self_introduction": self_introduction,
        "mock_qa": mock_qa,
        "questions_to_ask": questions_to_ask,
        "star_story_ids": selected_story_ids,
    }
