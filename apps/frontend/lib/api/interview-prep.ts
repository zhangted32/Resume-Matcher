import { API_BASE, apiFetch, apiPost, apiPut, apiDelete } from './client';

export interface StarStory {
  story_id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string[];
  job_history_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StarStoryListResponse {
  request_id: string;
  data: StarStory[];
}

export interface StarStoryCreateRequest {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags?: string[];
  job_history_id?: string | null;
}

export interface StarStoryUpdateRequest {
  title?: string;
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  tags?: string[];
  job_history_id?: string | null;
}

export interface JobHistory {
  job_history_id: string;
  company: string;
  role: string;
  years: string;
  description: string;
  department: string | null;
  location: string | null;
  responsibilities: string[];
  skills_used: string[];
  star_stories: StarStory[];
  created_at: string;
  updated_at: string;
}

export interface JobHistoryListResponse {
  request_id: string;
  data: JobHistory[];
}

export interface JobHistoryCreateRequest {
  company: string;
  role: string;
  years: string;
  description: string;
  department?: string | null;
  location?: string | null;
  responsibilities?: string[];
  skills_used?: string[];
}

export interface JobHistoryUpdateRequest {
  company?: string;
  role?: string;
  years?: string;
  description?: string;
  department?: string | null;
  location?: string | null;
  responsibilities?: string[];
  skills_used?: string[];
}

export type QuestionCategory = 'role' | 'team' | 'company' | 'culture' | 'growth';

export type QuestionType = 'behavioral' | 'situational' | 'technical' | 'knowledge';

export interface MockQA {
  type: QuestionType;
  question: string;
  answer: string;
  story_id: string;
}

export interface QuestionToAsk {
  category: QuestionCategory;
  question: string;
  rationale: string;
}

export interface InterviewPrep {
  prep_id: string;
  job_id: string;
  company_name: string;
  role_title: string;
  star_story_ids: string[];
  mock_qa: MockQA[];
  self_introduction: string;
  questions_to_ask: QuestionToAsk[];
  created_at: string;
  updated_at: string;
}

export interface InterviewPrepListResponse {
  request_id: string;
  data: InterviewPrep[];
}

export interface GenerateInterviewPrepRequest {
  job_id: string;
  star_story_ids?: string[];
  job_history_ids?: string[];
  language?: string;
}

export async function fetchStarStories(tag?: string, jobHistoryId?: string): Promise<StarStory[]> {
  const params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  if (jobHistoryId) params.set('job_history_id', jobHistoryId);
  const url = `/star-stories${params.toString() ? `?${params.toString()}` : ''}`;
  const resp = await apiFetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch star stories: ${resp.status}`);
  const data: StarStoryListResponse = await resp.json();
  return data.data;
}

export async function fetchStarStory(storyId: string): Promise<StarStory> {
  const resp = await apiFetch(`/star-stories/${storyId}`);
  if (!resp.ok) throw new Error(`Failed to fetch star story: ${resp.status}`);
  return resp.json();
}

export async function createStarStory(data: StarStoryCreateRequest): Promise<StarStory> {
  const resp = await apiPost('/star-stories', data);
  if (!resp.ok) throw new Error(`Failed to create star story: ${resp.status}`);
  return resp.json();
}

export async function updateStarStory(
  storyId: string,
  data: StarStoryUpdateRequest
): Promise<StarStory> {
  const resp = await apiPut(`/star-stories/${storyId}`, data);
  if (!resp.ok) throw new Error(`Failed to update star story: ${resp.status}`);
  return resp.json();
}

export async function deleteStarStory(storyId: string): Promise<void> {
  const resp = await apiDelete(`/star-stories/${storyId}`);
  if (!resp.ok) throw new Error(`Failed to delete star story: ${resp.status}`);
}

export async function fetchJobHistories(): Promise<JobHistory[]> {
  const resp = await apiFetch('/job-histories');
  if (!resp.ok) throw new Error(`Failed to fetch job histories: ${resp.status}`);
  const data: JobHistoryListResponse = await resp.json();
  return data.data;
}

export async function fetchJobHistory(jobHistoryId: string): Promise<JobHistory> {
  const resp = await apiFetch(`/job-histories/${jobHistoryId}`);
  if (!resp.ok) throw new Error(`Failed to fetch job history: ${resp.status}`);
  return resp.json();
}

export async function createJobHistory(data: JobHistoryCreateRequest): Promise<JobHistory> {
  const resp = await apiPost('/job-histories', data);
  if (!resp.ok) throw new Error(`Failed to create job history: ${resp.status}`);
  return resp.json();
}

export async function updateJobHistory(
  jobHistoryId: string,
  data: JobHistoryUpdateRequest
): Promise<JobHistory> {
  const resp = await apiPut(`/job-histories/${jobHistoryId}`, data);
  if (!resp.ok) throw new Error(`Failed to update job history: ${resp.status}`);
  return resp.json();
}

export async function deleteJobHistory(jobHistoryId: string): Promise<void> {
  const resp = await apiDelete(`/job-histories/${jobHistoryId}`);
  if (!resp.ok) throw new Error(`Failed to delete job history: ${resp.status}`);
}

export async function fetchInterviewPreps(): Promise<InterviewPrep[]> {
  const resp = await apiFetch('/interview-preps');
  if (!resp.ok) throw new Error(`Failed to fetch interview preps: ${resp.status}`);
  const data: InterviewPrepListResponse = await resp.json();
  return data.data;
}

export async function fetchInterviewPrep(prepId: string): Promise<InterviewPrep> {
  const resp = await apiFetch(`/interview-preps/${prepId}`);
  if (!resp.ok) throw new Error(`Failed to fetch interview prep: ${resp.status}`);
  return resp.json();
}

export async function generateInterviewPrep(
  data: GenerateInterviewPrepRequest
): Promise<InterviewPrep> {
  const resp = await apiPost('/interview-preps/generate', data);
  if (!resp.ok) throw new Error(`Failed to generate interview prep: ${resp.status}`);
  return resp.json();
}

export async function deleteInterviewPrep(prepId: string): Promise<void> {
  const resp = await apiDelete(`/interview-preps/${prepId}`);
  if (!resp.ok) throw new Error(`Failed to delete interview prep: ${resp.status}`);
}

export async function fetchJobs(): Promise<{ job_id: string; content: string }[]> {
  const resp = await apiFetch('/jobs');
  if (!resp.ok) throw new Error(`Failed to fetch jobs: ${resp.status}`);
  const data: { request_id: string; data: { job_id: string; content: string }[] } = await resp.json();
  return data.data;
}
