"""LLM prompt templates for interview preparation generation.

Four templates:
1. SELECT_RELEVANT_STORIES_PROMPT     — pick the most relevant STAR stories for a JD
2. GENERATE_MOCK_QA_PROMPT            — generate mock interview Q&A pairs
3. GENERATE_SELF_INTRO_PROMPT         — generate a self-introduction script
4. GENERATE_QUESTIONS_TO_ASK_PROMPT   — generate questions the candidate can ask

All prompts are plain strings formatted with ``.format()`` — no template engine.
Output is always valid JSON (consumed by ``complete_json`` in app.llm).
"""

SELECT_RELEVANT_STORIES_PROMPT = """You are an expert career coach who selects the best STAR stories for a job interview.

## Input

### Job Description
{job_description}

### Available STAR Stories
{star_stories}

## Rules
1. Select 4-8 most relevant stories — fewer if fewer are available
2. Prioritize stories that directly address key requirements in the job description
3. Ensure variety: technical skills, leadership, problem-solving, collaboration
4. Return story IDs in priority order — most relevant first
5. Do NOT invent stories or change story content
6. Output valid JSON only — no markdown, no code fences, no explanation

## Output Format
{{
  "selected_story_ids": ["story_id_1", "story_id_2", ...],
  "reasoning": "Brief explanation of selection strategy"
}}
"""

GENERATE_MOCK_QA_PROMPT = """You are an expert technical interviewer and career coach.

Given the candidate's STAR stories, job history, and the target job description, generate a comprehensive set of mock interview Q&A pairs.

## Input

### Job Description
{job_description}

### Candidate's STAR Stories
{star_stories}

### Candidate's Job History
{job_histories}

## Rules
1. Generate questions that are SPECIFIC to the job description — target the key skills and responsibilities mentioned in the JD
2. Each answer must be grounded in the candidate's actual STAR stories or job history — DO NOT invent experiences, metrics, or achievements
3. Cite which STAR story supports each answer by story_id
4. Question type distribution (approximate):
   - 40% Behavioral (Tell me about a time...)
   - 30% Technical (How would you... / Explain...)
   - 20% Situational (What would you do if...)
   - 10% Motivational (Why this company / role)
5. Generate answers in {output_language}
6. Answers should be 3-5 sentences, concise and impactful
7. Include a follow-up question for at least half the questions (use null if no follow-up)
8. If the answer draws from Job History rather than a specific STAR story, set story_id to null
9. Do NOT include any preamble or explanation — output JSON only

## Output Format
{{
  "mock_qa": [
    {{
      "question": "Full question text",
      "answer": "Concise 3-5 sentence answer grounded in real experience",
      "story_id": "story_id_string_or_null",
      "type": "behavioral",
      "follow_up": "Optional follow-up question or null"
    }}
  ]
}}
"""

GENERATE_SELF_INTRO_PROMPT = """You are an expert career coach who helps candidates craft compelling self introductions.

## Input

### Job Description
{job_description}

### Candidate's Background Summary
{job_histories_summary}

### Key STAR Stories
{key_stories_summary}

## Rules
1. Create a 60-90 second self introduction (approximately 150-250 words)
2. Structure: Hook → Relevant Experience → Key Achievement → Why this role → Closing
3. Ground every claim in actual experience from the provided stories/history — DO NOT invent companies, titles, or achievements
4. Align the introduction with the JD's key requirements
5. Tone: confident but not arrogant, conversational but professional
6. Generate in {output_language}
7. Output valid JSON only — no markdown, no code fences

## Output Format
{{
  "self_introduction": "Full introduction text — a single paragraph",
  "duration_estimate": "75 seconds",
  "key_points_covered": ["point1", "point2", "point3"]
}}
"""

GENERATE_QUESTIONS_TO_ASK_PROMPT = """You are a career strategist who helps candidates ask insightful questions in job interviews.

Good questions demonstrate preparation, critical thinking, and genuine interest.

## Input

### Job Description
{job_description}

### Company Name
{company_name}

### Role Title
{role_title}

## Rules
1. Generate 8-12 questions organized by category
2. Categories must include: role, team, company, culture, growth
3. Questions should demonstrate deep understanding of the role and company
4. Avoid questions easily answerable by public information or the JD itself
5. Include 1-2 "bold" questions that show confidence and strategic thinking
6. For each question, provide a rationale explaining why it's insightful to ask
7. Generate in {output_language}
8. Output valid JSON only — no markdown, no code fences

## Output Format
{{
  "questions": [
    {{
      "question": "The question text",
      "category": "role",
      "rationale": "Why this question is insightful and what to listen for",
      "bold": false
    }}
  ]
}}
"""
