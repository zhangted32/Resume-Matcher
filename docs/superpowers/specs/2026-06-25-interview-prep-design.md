# Interview Prep — Design Spec

> **Status**: Design
> **Date**: 2026-06-25
> **Scope**: Full-stack feature — STAR story management, Job History management, AI-powered interview material generation, Company Prep display page
>
> This is a standalone feature set that does NOT modify existing resume/ tailoring/ tracker flows except for adding navigation entry points.

---

## 1. Problem Statement

Users currently have a tailored resume and cover letter for each job application, but they lack structured interview preparation materials. After tailoring a resume, the next step in the job application pipeline is the interview. Users need:

1. A place to store and manage STAR stories (structured behavioral interview responses)
2. A place to store detailed job history (separate from the concise resume `workExperience`)
3. AI-generated mock interview Q&A based on their stories + job description
4. A generated self-introduction script
5. A curated list of questions to ask the interviewer
6. A well-organized display page (Company Prep) with a table of contents for easy review before interviews

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (Next.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ STAR Stories│  │ Job History │  │ Generate │  │ Company Prep │ │
│  │  /stories   │  │ /job-history│  │  /generate│  │ /result/:id  │ │
│  └──────┬──────┘  └──────┬──────┘  └─────┬────┘  └──────┬───────┘ │
│         └─────────────────┴───────────────┘                │         │
│                           │                                │         │
│                    ┌──────┴──────┐                  ┌─────┴─────┐   │
│                    │  API Client │                  │ TOC Nav   │   │
│                    └──────┬──────┘                  └───────────┘   │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────────┐
│                     Backend (FastAPI)                               │
│  ┌──────────────┐  ┌──────┴──────┐  ┌───────────────────────────┐  │
│  │ /star-stories│  │/job-histories│  │   /interview-preps        │  │
│  │   CRUD       │  │    CRUD      │  │   /generate (AI)          │  │
│  └──────┬───────┘  └──────┬──────┘  └───────────┬───────────────┘  │
│         │                 │                       │                  │
│  ┌──────┴───────┐  ┌─────┴───────┐      ┌────────┴────────┐         │
│  │ StarStory    │  │ JobHistory  │      │ InterviewPrep   │         │
│  │   Service    │  │   Service   │      │   Service       │         │
│  └──────────────┘  └─────────────┘      └────────┬────────┘         │
│                                                  │                  │
│                                    ┌─────────────┴──────────────┐   │
│                                    │ LLM Prompts                │   │
│                                    │ - Mock QA                  │   │
│                                    │ - Self Intro               │   │
│                                    │ - Questions to Ask         │   │
│                                    │ - Story Selection          │   │
│                                    └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │   SQLite DB    │
                    │ star_stories   │
                    │ job_histories  │
                    │ interview_preps│
                    └────────────────┘
```

## 3. Data Model

### 3.1 Database Tables

```sql
-- STAR story collection (behavioral interview responses)
CREATE TABLE star_stories (
    story_id        TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    situation       TEXT NOT NULL,
    task            TEXT NOT NULL,
    action          TEXT NOT NULL,
    result          TEXT NOT NULL,
    tags            JSON DEFAULT '[]',
    job_history_id  TEXT REFERENCES job_histories(job_history_id) ON DELETE SET NULL,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

-- Detailed job history (independent from resume workExperience)
CREATE TABLE job_histories (
    job_history_id  TEXT PRIMARY KEY,
    company         TEXT NOT NULL,
    role            TEXT NOT NULL,
    department      TEXT,
    years           TEXT NOT NULL,
    location        TEXT,
    description     TEXT NOT NULL,
    responsibilities JSON DEFAULT '[]',
    skills_used     JSON DEFAULT '[]',
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

-- Generated interview preparation materials
CREATE TABLE interview_preps (
    prep_id         TEXT PRIMARY KEY,
    job_id          TEXT NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    star_story_ids  JSON DEFAULT '[]',
    mock_qa         JSON DEFAULT '[]',
    self_introduction TEXT,
    questions_to_ask JSON DEFAULT '[]',
    company_name    TEXT,
    role_title      TEXT,
    created_at      TEXT NOT NULL
);
```

### 3.2 Relationships

- `star_stories.job_history_id` → `job_histories.job_history_id` (optional, nullable)
- `interview_preps.job_id` → `jobs.job_id` (required, cascade delete)
- `interview_preps.star_story_ids` stores a JSON array of `story_id` strings

### 3.3 Design Decisions

- **Job History is independent from resume**: Users may have more detailed records than what appears on their concise resume. The existing `workExperience` in `ResumeData` remains unchanged.
- **Interview Prep links to `jobs` table**: Each JD generates one prep. If a user tailors the same resume for multiple similar jobs, they get multiple preps.
- **Generated content is persisted**: Users can review past preps without re-running LLM calls, saving tokens and time.
- **No user_id**: Resume Matcher is a single-user local application; no multi-tenant support needed.

## 4. Backend API

### 4.1 STAR Stories Router (`/api/v1/star-stories`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/star-stories` | List all stories. Query params: `?tag=`, `?job_history_id=` |
| GET | `/star-stories/{story_id}` | Get single story |
| POST | `/star-stories` | Create story |
| PUT | `/star-stories/{story_id}` | Update story |
| DELETE | `/star-stories/{story_id}` | Delete story |

**Request/Response Schema:**

```python
class StarStoryCreateRequest(BaseModel):
    title: str
    situation: str
    task: str
    action: str
    result: str
    tags: list[str] = Field(default_factory=list)
    job_history_id: str | None = None

class StarStoryResponse(BaseModel):
    story_id: str
    title: str
    situation: str
    task: str
    action: str
    result: str
    tags: list[str]
    job_history_id: str | None
    created_at: str
    updated_at: str

class StarStoryListResponse(BaseModel):
    request_id: str
    data: list[StarStoryResponse]
```

### 4.2 Job Histories Router (`/api/v1/job-histories`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/job-histories` | List all job histories |
| GET | `/job-histories/{job_history_id}` | Get single with nested stories |
| POST | `/job-histories` | Create job history |
| PUT | `/job-histories/{job_history_id}` | Update |
| DELETE | `/job-histories/{job_history_id}` | Delete |

```python
class JobHistoryCreateRequest(BaseModel):
    company: str
    role: str
    department: str | None = None
    years: str
    location: str | None = None
    description: str
    responsibilities: list[str] = Field(default_factory=list)
    skills_used: list[str] = Field(default_factory=list)

class StarStorySummary(BaseModel):
    story_id: str
    title: str
    tags: list[str]

class JobHistoryResponse(BaseModel):
    job_history_id: str
    company: str
    role: str
    department: str | None
    years: str
    location: str | None
    description: str
    responsibilities: list[str]
    skills_used: list[str]
    stories: list[StarStorySummary]
    created_at: str
    updated_at: str
```

### 4.3 Interview Prep Router (`/api/v1/interview-preps`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/interview-preps/generate` | Generate interview materials (AI) |
| GET | `/interview-preps` | List all generated preps |
| GET | `/interview-preps/{prep_id}` | Get single prep detail |
| DELETE | `/interview-preps/{prep_id}` | Delete |

```python
class GenerateInterviewPrepRequest(BaseModel):
    job_id: str
    star_story_ids: list[str] = Field(default_factory=list)
    job_history_ids: list[str] | None = None
    language: str = "en"

class MockQAItem(BaseModel):
    question: str
    answer: str
    story_id: str | None = None
    type: Literal["behavioral", "technical", "situational", "motivational"]
    follow_up: str | None = None

class QuestionToAskItem(BaseModel):
    question: str
    category: Literal["role", "team", "company", "culture", "growth"]
    rationale: str
    bold: bool = False

class InterviewPrepResponse(BaseModel):
    prep_id: str
    job_id: str
    company_name: str
    role_title: str
    self_introduction: str
    mock_qa: list[MockQAItem]
    questions_to_ask: list[QuestionToAskItem]
    star_story_ids: list[str]
    created_at: str
```

### 4.4 AI Generation Service

`app/services/interview_prep.py` — orchestrates LLM calls:

```python
async def generate_interview_prep(
    job: dict[str, Any],
    star_stories: list[dict],
    job_histories: list[dict],
    language: str,
) -> dict[str, Any]:
    """Orchestrate 4 LLM calls (3 can be parallel):
    1. select_relevant_stories (if user didn't specify)
    2. generate_mock_qa
    3. generate_self_introduction
    4. generate_questions_to_ask
    """
```

**Flow:**
```
extract_jd_keywords ──→ [select_relevant_stories] ──→ generate_mock_qa
                                                    ──→ generate_self_introduction
                                                    ──→ generate_questions_to_ask
```

- `select_relevant_stories` is skipped if `star_story_ids` is provided in the request
- Steps 2-4 are independent and can run in parallel via `asyncio.gather`
- All use existing `complete_json()` in `app/llm.py`

## 5. Frontend Design

### 5.1 Navigation

**Dashboard SwissGrid** adds two new entry cards:
- "STAR Stories" → routes to `/interview-prep/stories`
- "Job History" → routes to `/interview-prep/job-history`

**Top navigation** (`layout.tsx`) adds:
- `[Interview Prep]` dropdown or direct link

### 5.2 Routes

```
/interview-prep/stories              # STAR story management (list + CRUD)
/interview-prep/stories/new          # New story form
/interview-prep/stories/[id]/edit    # Edit story form
/interview-prep/job-history          # Job history management
/interview-prep/job-history/new      # New job history form
/interview-prep/generate             # Generation entry page
/interview-prep/result/[prep_id]     # Company Prep display page
```

### 5.3 STAR Stories Page (`/interview-prep/stories`)

**Layout:**
- Header: "STAR STORIES" + `[+ New Story]` button
- Main: Grid of story cards or table view (toggle)
- Each card shows: Title, tags (as pills), linked company (if any), updated date
- Actions: Edit, Delete

**New/Edit Form:**
- Title (input)
- Tags (multi-select / tag input)
- Job History (dropdown, optional)
- Situation (textarea)
- Task (textarea)
- Action (textarea)
- Result (textarea)
- Cancel / Save buttons

All textareas must include `onKeyDown` with `e.stopPropagation()` for Enter key (per coding standards).

### 5.4 Job History Page (`/interview-prep/job-history`)

**Layout:**
- Header: "JOB HISTORY" + `[+ New Entry]` button
- Main: Card list (one card per job history entry)
- Each card: Company, Role, Years, Location, Skills pills, linked story count
- Expandable: Shows full description + responsibilities list
- Actions: Edit, Delete, "View Stories" (filters stories by this job)

### 5.5 Generation Page (`/interview-prep/generate`)

**Three-step wizard layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  GENERATE INTERVIEW PREP                        [en ▼]      │
├─────────────────────────────────────────────────────────────┤
│  Step 1: Select Job                                         │
│  [▼ Choose from existing JDs...]  or  [Paste new JD ▼]    │
│                                                             │
│  Step 2: Select STAR Stories                                │
│  (Auto-selected: 5 most relevant)  [Edit Selection ▼]     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ [✓] S1  │ │ [✓] S2  │ │ [ ] S3  │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
│                                                             │
│  Step 3: Select Job Histories (optional)                    │
│  [✓] Google - Senior Engineer                               │
│  [ ] Meta - Staff Engineer                                  │
│                                                             │
│  [GENERATE MOCK INTERVIEW + SELF INTRO + QUESTIONS]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Story auto-selection calls `POST /interview-preps/generate` with empty `star_story_ids` first (or a separate preview endpoint)
- User can manually override selections
- Generate button shows loading state with spinner
- On completion, redirects to `/interview-prep/result/{prep_id}`

### 5.6 Company Prep Page (`/interview-prep/result/[prep_id]`)

**Core display page — document-style layout:**

```
┌────────────────────────────────────────────────────────────────────────┐
│ ┌──────────┐  GOOGLE — SENIOR BACKEND ENGINEER            [Print ▼]  │
│ │ TABLE OF │  ┌────────────────────────────────────────────────────┐  │
│ │ CONTENTS │  │ 1. SELF INTRODUCTION                               │  │
│ │          │  │    "Hi, I'm Alex..."                               │  │
│ │ 1. Self  │  └────────────────────────────────────────────────────┘  │
│ │    Intro │                                                         │
│ │          │  ┌────────────────────────────────────────────────────┐  │
│ │ 2. Mock  │  │ 2. MOCK INTERVIEW Q&A                              │  │
│ │    Q&A   │  │                                                    │  │
│ │    (8)   │  │  Q1: [behavioral] Tell me about...                 │  │
│ │          │  │  A:  At Google, I led...                           │  │
│ │ 3. Qs to │  │      [Related: "优化支付系统延迟"]                   │  │
│ │    Ask   │  │  ────────────────────────────────────────────────  │  │
│ │    (5)   │  │  Q2: [technical] How would you...                  │  │
│ │          │  │  A:  ...                                             │  │
│ └──────────┘  └────────────────────────────────────────────────────┘  │
│            ┌────────────────────────────────────────────────────┐     │
│            │ 3. QUESTIONS TO ASK THE INTERVIEWER                │     │
│            │                                                    │     │
│            │  [Role] What does success look like...             │     │
│            │  [Team] How is the team structured...              │     │
│            │  [Culture] What do you enjoy most...               │     │
│            └────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────┘
```

**Components:**
- `TocSidebar`: Fixed left sidebar with clickable anchor links
- `TocItem`: Each item shows section number, title, item count (for Q&A)
- `SelfIntroSection`: Full-width card with the introduction text
- `MockQASection`: Collapsible Q&A pairs. Each question shows type badge. Each answer shows related story link (if any).
- `QuestionsToAskSection`: Grouped by category (Role, Team, Company, Culture, Growth). Each question shows rationale tooltip.
- `PrintButton`: Triggers browser print with `@media print` CSS for clean output

**Styling (Swiss International Style):**
- Canvas background `#F0F0E8`
- Black borders (`border-black`)
- Hard shadows (`shadow-sw-default`)
- `rounded-none` everywhere
- Serif font for headers, sans for body, mono for metadata
- Section cards use `border-2 border-black bg-white`

## 6. AI Prompt Design

### 6.1 Prompt Files

`apps/backend/app/prompts/interview_prep.py` contains:

```python
SELECT_RELEVANT_STORIES_PROMPT
GENERATE_MOCK_QA_PROMPT
GENERATE_SELF_INTRO_PROMPT
GENERATE_QUESTIONS_TO_ASK_PROMPT
```

### 6.2 Story Selection Prompt

Selects 4-8 most relevant STAR stories for the target JD. Returns `selected_story_ids` in priority order.

### 6.3 Mock QA Prompt

Generates 8-12 Q&A pairs distributed as:
- 40% Behavioral
- 30% Technical
- 20% Situational
- 10% Motivational

Each answer cites the supporting STAR story. Follow-up questions included where relevant.

### 6.4 Self Introduction Prompt

Generates 150-250 word self introduction with structure: Hook → Relevant Experience → Key Achievement → Why this role → Closing.

### 6.5 Questions to Ask Prompt

Generates 8-12 insightful questions organized by category (Role, Team, Company, Culture, Growth). Includes rationale for each question and 1-2 "bold" questions.

### 6.6 Rules for All Prompts

1. Ground all claims in actual user-provided stories/history — DO NOT invent experiences
2. Target questions specifically to the JD's key requirements
3. Generate in the user's configured content language
4. Output valid JSON only (compatible with `complete_json()`)
5. Use existing `_sanitize_user_input()` for JD input (LLM-011 injection prevention)

## 7. Integration with Existing Flows

### 7.1 Optional Trigger Points

The following integration points are **optional** (Phase 5) and do not block the core feature:

- **Tailor page**: After confirming a tailored resume, show "Prepare for Interview" CTA
- **Tracker card**: Each application card in the Kanban board gets a "Prep" button linking to the generate page with that job pre-selected
- **Dashboard**: SwissGrid cards for Stories and Job History (already in core design)

### 7.2 Data Sharing

- Interview Prep reads from existing `jobs` table (no new job storage)
- Job History and STAR Stories are completely independent from `ResumeData`
- No modifications to existing `resumes.py`, `improver.py`, `refiner.py`

## 8. Testing Strategy

### 8.1 Backend Tests

```
apps/backend/tests/
├── unit/
│   ├── test_star_stories_service.py
│   ├── test_job_history_service.py
│   ├── test_interview_prep_service.py
│   └── test_interview_prep_prompts.py
└── integration/
    ├── test_star_stories_api.py
    ├── test_job_history_api.py
    └── test_interview_prep_api.py
```

### 8.2 Frontend Tests

```
apps/frontend/tests/
├── star-stories-page.test.tsx
├── job-history-page.test.tsx
├── interview-prep-generate.test.tsx
├── company-prep-page.test.tsx
└── toc-sidebar.test.tsx
```

### 8.3 Test Coverage Requirements

- CRUD operations for both new tables
- LLM mock tests for all 4 prompts
- Empty state handling (no stories, no job history)
- Story auto-selection logic
- Print layout verification

## 9. File Change Summary

| # | File | Type | Description |
|---|------|------|-------------|
| 1 | `app/models.py` | Modify | Add `StarStory`, `JobHistory`, `InterviewPrep` ORM models |
| 2 | `app/schemas/models.py` | Modify | Add request/response Pydantic models |
| 3 | `app/prompts/interview_prep.py` | Create | 4 LLM prompt templates |
| 4 | `app/prompts/__init__.py` | Modify | Export new prompts |
| 5 | `app/services/interview_prep.py` | Create | AI generation service |
| 6 | `app/routers/star_stories.py` | Create | STAR stories CRUD API |
| 7 | `app/routers/job_histories.py` | Create | Job history CRUD API |
| 8 | `app/routers/interview_preps.py` | Create | Interview prep generation API |
| 9 | `app/main.py` | Modify | Register new routers |
| 10 | `app/database.py` | Modify | Add facade methods for new tables |
| 11 | `frontend/app/(default)/interview-prep/stories/page.tsx` | Create | Stories list page |
| 12 | `frontend/app/(default)/interview-prep/job-history/page.tsx` | Create | Job history page |
| 13 | `frontend/app/(default)/interview-prep/generate/page.tsx` | Create | Generation wizard |
| 14 | `frontend/app/(default)/interview-prep/result/[prep_id]/page.tsx` | Create | Company prep display |
| 15 | `frontend/components/interview-prep/*.tsx` | Create | UI components (TOC, Q&A cards, etc.) |
| 16 | `frontend/lib/api/interview-prep.ts` | Create | API client |
| 17 | `frontend/messages/*.json` | Modify | i18n strings (en, es, zh, ja) |

## 10. Implementation Order

### Phase 1: Data Layer
1. Add ORM models to `models.py`
2. Create Alembic migration (or rely on SQLAlchemy `create_all`)
3. Add Pydantic schemas
4. Add database facade methods
5. Run backend, verify tables created

### Phase 2: Backend API
6. Implement `star_stories.py` router
7. Implement `job_histories.py` router
8. Implement `interview_prep.py` service + prompts
9. Implement `interview_preps.py` router
10. Wire routers in `main.py`
11. Write backend tests

### Phase 3: Frontend Core Pages
12. Create API client (`lib/api/interview-prep.ts`)
13. Create STAR Stories page
14. Create Job History page
15. Add navigation entries

### Phase 4: Generation + Company Prep
16. Create generation wizard page
17. Create Company Prep display page with TOC
18. Create reusable components

### Phase 5: Integration + Polish
19. Add optional trigger points (Tailor, Tracker)
20. i18n translations
21. Print CSS
22. Final testing and cleanup

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| LLM generates fictional experiences | Medium | High | Prompt explicitly forbids invention; verifier checks story citations exist |
| Large JD + many stories exceed context window | Medium | Medium | Truncate JD to keywords; select top N stories only |
| User has no stories/history yet | High | Low | Empty state with clear CTA to create stories first |
| Generated content quality varies by model | Medium | Medium | Use structured JSON output; fallback to generic questions if parsing fails |
| TOC component complexity | Low | Medium | Use native scrollIntoView + IntersectionObserver for active section |

## 12. Success Criteria

- [ ] Users can CRUD STAR stories
- [ ] Users can CRUD Job History
- [ ] AI generates mock QA, self intro, and questions grounded in real stories
- [ ] Company Prep page displays all materials with working TOC
- [ ] Print layout produces clean output
- [ ] All new backend functions have type hints
- [ ] `npm run lint` passes
- [ ] `uv run pytest` passes for new tests
- [ ] i18n keys added for all UI text
