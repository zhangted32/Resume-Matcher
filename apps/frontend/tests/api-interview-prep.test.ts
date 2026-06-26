import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchStarStories,
  fetchStarStory,
  createStarStory,
  updateStarStory,
  deleteStarStory,
  fetchJobHistories,
  fetchJobHistory,
  createJobHistory,
  updateJobHistory,
  deleteJobHistory,
  fetchInterviewPreps,
  fetchInterviewPrep,
  generateInterviewPrep,
  deleteInterviewPrep,
  fetchJobs,
} from '@/lib/api/interview-prep';

describe('Interview Prep API client', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const lastCall = () => {
    const [url, options] = fetchMock.mock.calls.at(-1)!;
    return { url: String(url), options: options as RequestInit };
  };

  describe('STAR Stories API', () => {
    it('fetchStarStories GETs /star-stories without params', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ request_id: 'req-1', data: [] }), { status: 200 })
      );
      await fetchStarStories();
      const { url } = lastCall();
      expect(url).toContain('/star-stories');
    });

    it('fetchStarStories includes tag param when provided', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ request_id: 'req-1', data: [] }), { status: 200 })
      );
      await fetchStarStories('performance');
      const { url } = lastCall();
      expect(url).toContain('tag=performance');
    });

    it('fetchStarStories includes job_history_id param when provided', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ request_id: 'req-1', data: [] }), { status: 200 })
      );
      await fetchStarStories(undefined, 'jh-1');
      const { url } = lastCall();
      expect(url).toContain('job_history_id=jh-1');
    });

    it('fetchStarStory GETs /star-stories/{id}', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ story_id: 's-1', title: 'Test' }), { status: 200 })
      );
      await fetchStarStory('s-1');
      const { url } = lastCall();
      expect(url).toContain('/star-stories/s-1');
    });

    it('createStarStory POSTs to /star-stories with payload', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ story_id: 's-1', title: 'Test' }), { status: 201 })
      );
      await createStarStory({
        title: 'Test',
        situation: 'Situation',
        task: 'Task',
        action: 'Action',
        result: 'Result',
        tags: ['tag1'],
      });
      const { url, options } = lastCall();
      expect(url).toContain('/star-stories');
      expect(options.method).toBe('POST');
      expect(JSON.parse(String(options.body))).toMatchObject({
        title: 'Test',
        tags: ['tag1'],
      });
    });

    it('updateStarStory PUTs to /star-stories/{id} with partial data', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ story_id: 's-1', title: 'Updated' }), { status: 200 })
      );
      await updateStarStory('s-1', { title: 'Updated', tags: ['tag2'] });
      const { url, options } = lastCall();
      expect(url).toContain('/star-stories/s-1');
      expect(options.method).toBe('PUT');
      expect(JSON.parse(String(options.body))).toEqual({ title: 'Updated', tags: ['tag2'] });
    });

    it('deleteStarStory DELETEs /star-stories/{id}', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      await deleteStarStory('s-1');
      const { url, options } = lastCall();
      expect(url).toContain('/star-stories/s-1');
      expect(options.method).toBe('DELETE');
    });

    it('fetchStarStories throws error on non-ok response', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
      await expect(fetchStarStories()).rejects.toThrow('Failed to fetch star stories');
    });
  });

  describe('Job Histories API', () => {
    it('fetchJobHistories GETs /job-histories', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ request_id: 'req-1', data: [] }), { status: 200 })
      );
      await fetchJobHistories();
      const { url } = lastCall();
      expect(url).toContain('/job-histories');
    });

    it('fetchJobHistory GETs /job-histories/{id}', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ job_history_id: 'jh-1', company: 'Test' }), { status: 200 })
      );
      await fetchJobHistory('jh-1');
      const { url } = lastCall();
      expect(url).toContain('/job-histories/jh-1');
    });

    it('createJobHistory POSTs to /job-histories with payload', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ job_history_id: 'jh-1', company: 'Test' }), { status: 201 })
      );
      await createJobHistory({
        company: 'Test Corp',
        role: 'Engineer',
        years: '2020-2023',
        description: 'Desc',
        responsibilities: ['R1'],
        skills_used: ['S1'],
      });
      const { url, options } = lastCall();
      expect(url).toContain('/job-histories');
      expect(options.method).toBe('POST');
      expect(JSON.parse(String(options.body))).toMatchObject({ company: 'Test Corp' });
    });

    it('updateJobHistory PUTs to /job-histories/{id} with partial data', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ job_history_id: 'jh-1', company: 'Updated' }), { status: 200 })
      );
      await updateJobHistory('jh-1', { company: 'Updated' });
      const { url, options } = lastCall();
      expect(url).toContain('/job-histories/jh-1');
      expect(options.method).toBe('PUT');
    });

    it('deleteJobHistory DELETEs /job-histories/{id}', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      await deleteJobHistory('jh-1');
      const { url, options } = lastCall();
      expect(url).toContain('/job-histories/jh-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('Interview Prep API', () => {
    it('fetchInterviewPreps GETs /interview-preps', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ request_id: 'req-1', data: [] }), { status: 200 })
      );
      await fetchInterviewPreps();
      const { url } = lastCall();
      expect(url).toContain('/interview-preps');
    });

    it('fetchInterviewPrep GETs /interview-preps/{id}', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ prep_id: 'prep-1', company_name: 'Test' }), { status: 200 })
      );
      await fetchInterviewPrep('prep-1');
      const { url } = lastCall();
      expect(url).toContain('/interview-preps/prep-1');
    });

    it('generateInterviewPrep POSTs to /interview-preps/generate', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ prep_id: 'prep-1' }), { status: 201 })
      );
      await generateInterviewPrep({ job_id: 'job-1', star_story_ids: ['s-1'], language: 'en' });
      const { url, options } = lastCall();
      expect(url).toContain('/interview-preps/generate');
      expect(options.method).toBe('POST');
      expect(JSON.parse(String(options.body))).toEqual({
        job_id: 'job-1',
        star_story_ids: ['s-1'],
        language: 'en',
      });
    });

    it('deleteInterviewPrep DELETEs /interview-preps/{id}', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      await deleteInterviewPrep('prep-1');
      const { url, options } = lastCall();
      expect(url).toContain('/interview-preps/prep-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('Jobs API', () => {
    it('fetchJobs GETs /jobs', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ request_id: 'req-1', data: [] }), { status: 200 })
      );
      await fetchJobs();
      const { url } = lastCall();
      expect(url).toContain('/jobs');
    });
  });
});