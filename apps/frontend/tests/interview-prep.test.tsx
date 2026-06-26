import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InterviewPrepPage from '@/app/(default)/interview-prep/page';

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/api', () => ({
  fetchInterviewPreps: vi.fn(),
  fetchJobs: vi.fn(),
  fetchStarStories: vi.fn(),
  fetchJobHistories: vi.fn(),
  generateInterviewPrep: vi.fn(),
  deleteInterviewPrep: vi.fn(),
}));

import { fetchInterviewPreps, fetchJobs, fetchStarStories, fetchJobHistories, generateInterviewPrep, deleteInterviewPrep } from '@/lib/api';

describe('InterviewPrepPage', () => {
  const mockJobs = [
    { job_id: 'job-1', content: 'Senior Engineer at TechCorp' },
    { job_id: 'job-2', content: 'Frontend Developer at Startup' },
  ];

  const mockStories = [
    { story_id: 's-1', title: 'Optimized Latency', situation: '', task: '', action: '', result: '', tags: [], job_history_id: null, created_at: '', updated_at: '' },
    { story_id: 's-2', title: 'Led Team', situation: '', task: '', action: '', result: '', tags: [], job_history_id: null, created_at: '', updated_at: '' },
  ];

  const mockHistories = [
    { job_history_id: 'jh-1', company: 'TechCorp', role: 'Engineer', years: '2020-2023', description: '', department: null, location: null, responsibilities: [], skills_used: [], star_stories: [], created_at: '', updated_at: '' },
  ];

  const mockPreps = [
    {
      prep_id: 'prep-1',
      job_id: 'job-1',
      company_name: 'TechCorp',
      role_title: 'Senior Engineer',
      star_story_ids: ['s-1'],
      mock_qa: [{ type: 'behavioral', question: 'Q1', answer: 'A1', story_id: 's-1' }],
      self_introduction: 'Hi, I am...',
      questions_to_ask: [{ category: 'role', question: 'Q', rationale: 'R' }],
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (fetchInterviewPreps as vi.Mock).mockResolvedValue(mockPreps);
    (fetchJobs as vi.Mock).mockResolvedValue(mockJobs);
    (fetchStarStories as vi.Mock).mockResolvedValue(mockStories);
    (fetchJobHistories as vi.Mock).mockResolvedValue(mockHistories);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    render(<InterviewPrepPage />);
    await waitFor(() => {
      expect(fetchInterviewPreps).toHaveBeenCalledTimes(1);
      expect(fetchJobs).toHaveBeenCalledTimes(1);
    });
  });

  it('renders job selection buttons', async () => {
    render(<InterviewPrepPage />);
    await waitFor(() => {
      expect(screen.getByText('Senior Engineer at TechCorp...')).toBeInTheDocument();
      expect(screen.getByText('Frontend Developer at Startup...')).toBeInTheDocument();
    });
  });

  it('selects first job by default', async () => {
    render(<InterviewPrepPage />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('border-blue-700');
    });
  });

  it('allows selecting a different job', async () => {
    render(<InterviewPrepPage />);
    await waitFor(() => {
      const jobButtons = screen.getAllByRole('button').slice(0, 2);
      fireEvent.click(jobButtons[1]);
      expect(jobButtons[1]).toHaveClass('border-blue-700');
    });
  });

  it('renders star stories selection', async () => {
    render(<InterviewPrepPage />);
    await waitFor(() => {
      expect(screen.getByText('Optimized Latency')).toBeInTheDocument();
      expect(screen.getByText('Led Team')).toBeInTheDocument();
    });
  });

  it('toggles star story selection', async () => {
    render(<InterviewPrepPage />);
    await waitFor(() => {
      const storyButtons = screen.getAllByRole('button').slice(2, 4);
      fireEvent.click(storyButtons[0]);
      expect(storyButtons[0]).toHaveClass('border-purple-500');
      fireEvent.click(storyButtons[0]);
      expect(storyButtons[0]).not.toHaveClass('border-purple-500');
    });
  });

  it('renders job histories selection', async () => {
    render(<InterviewPrepPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Engineer').length).toBeGreaterThan(0);
      expect(screen.getAllByText('TechCorp').length).toBeGreaterThan(0);
    });
  });

  it('shows error when generate is clicked without selecting job', async () => {
    (fetchJobs as vi.Mock).mockResolvedValue([]);
    render(<InterviewPrepPage />);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.interviewPrep.noJobs')).toBeInTheDocument();
    });
  });

  it('calls generateInterviewPrep when generate button is clicked', async () => {
    (generateInterviewPrep as vi.Mock).mockResolvedValue(mockPreps[0]);
    render(<InterviewPrepPage />);
    await waitFor(() => {
      const generateButtons = screen.getAllByRole('button', { name: 'interviewPrep.interviewPrep.generate' });
      fireEvent.click(generateButtons[0]);
      expect(generateInterviewPrep).toHaveBeenCalledWith(expect.objectContaining({
        job_id: 'job-1',
        language: 'en',
      }));
    });
  });

  it('renders previous preps list', async () => {
    render(<InterviewPrepPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Senior Engineer').length).toBeGreaterThan(0);
      expect(screen.getAllByText('TechCorp').length).toBeGreaterThan(0);
    });
  });

  it('opens delete confirm dialog when delete button is clicked', async () => {
    render(<InterviewPrepPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'interviewPrep.interviewPrep.view' })).toBeInTheDocument();
    });
    const viewButton = screen.getByRole('button', { name: 'interviewPrep.interviewPrep.view' });
    const deleteButton = viewButton.parentElement?.querySelector('button:last-child');
    expect(deleteButton).not.toBeNull();
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.interviewPrep.deleteTitle')).toBeInTheDocument();
    });
  });

  it('calls deleteInterviewPrep when delete is confirmed', async () => {
    (deleteInterviewPrep as vi.Mock).mockResolvedValue(undefined);
    render(<InterviewPrepPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'interviewPrep.interviewPrep.view' })).toBeInTheDocument();
    });
    const viewButton = screen.getByRole('button', { name: 'interviewPrep.interviewPrep.view' });
    const deleteButton = viewButton.parentElement?.querySelector('button:last-child');
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    });
    await waitFor(() => {
      expect(deleteInterviewPrep).toHaveBeenCalledWith('prep-1');
    });
  });

  it('renders error message when fetch fails', async () => {
    (fetchInterviewPreps as vi.Mock).mockRejectedValue(new Error('Failed'));
    render(<InterviewPrepPage />);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.interviewPrep.loadError')).toBeInTheDocument();
    });
  });
});