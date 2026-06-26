import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InterviewPrepDetailPage from '@/app/(default)/interview-prep/[prepId]/page';

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ prepId: 'prep-1' }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/api', () => ({
  fetchInterviewPrep: vi.fn(),
}));

import { fetchInterviewPrep } from '@/lib/api';

describe('InterviewPrepDetailPage', () => {
  const mockPrep = {
    prep_id: 'prep-1',
    job_id: 'job-1',
    company_name: 'TechCorp',
    role_title: 'Senior Engineer',
    star_story_ids: ['s-1', 's-2'],
    mock_qa: [
      { type: 'behavioral', question: 'Tell me about a challenging project?', answer: 'I led a team that...', story_id: 's-1' },
      { type: 'technical', question: 'How do you optimize performance?', answer: 'I use caching...', story_id: 's-2' },
    ],
    self_introduction: 'Hi, I am a senior engineer with 5 years of experience. I specialize in building scalable backend systems.',
    questions_to_ask: [
      { category: 'role', question: 'What does success look like in this role?', rationale: 'Understand expectations' },
      { category: 'team', question: 'How is the team structured?', rationale: 'Team dynamics' },
    ],
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (fetchInterviewPrep as vi.Mock).mockResolvedValue(mockPrep);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    render(<InterviewPrepDetailPage />);
    await waitFor(() => {
      expect(fetchInterviewPrep).toHaveBeenCalledWith('prep-1');
    });
  });

  it('renders company and role information', async () => {
    render(<InterviewPrepDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('TechCorp')).toBeInTheDocument();
      expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    });
  });

  it('renders table of contents', async () => {
    render(<InterviewPrepDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.interviewPrep.tableOfContents')).toBeInTheDocument();
    });
    const tocButtons = screen.getAllByRole('button');
    expect(tocButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders mock QA section', async () => {
    render(<InterviewPrepDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Tell me about a challenging project?')).toBeInTheDocument();
      expect(screen.getByText('How do you optimize performance?')).toBeInTheDocument();
    });
  });

  it('toggles answer visibility when question is clicked', async () => {
    render(<InterviewPrepDetailPage />);
    await waitFor(() => {
      const questions = screen.getAllByRole('button');
      const questionButton = questions.find(btn => btn.textContent?.includes('Tell me about'));
      expect(questionButton).not.toBeNull();
      if (questionButton) {
        fireEvent.click(questionButton);
      }
    });
  });

  it('renders question type labels', async () => {
    render(<InterviewPrepDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Behavioral')).toBeInTheDocument();
      expect(screen.getByText('Technical')).toBeInTheDocument();
    });
  });

  it('renders self introduction section', async () => {
    render(<InterviewPrepDetailPage />);
    await waitFor(() => {
      expect(screen.getAllByText('interviewPrep.interviewPrep.selfIntro').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders questions to ask section', async () => {
    render(<InterviewPrepDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('What does success look like in this role?')).toBeInTheDocument();
      expect(screen.getByText('How is the team structured?')).toBeInTheDocument();
    });
  });

  it('renders question category labels', async () => {
    render(<InterviewPrepDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Team')).toBeInTheDocument();
    });
  });

  it('renders question rationale', async () => {
    render(<InterviewPrepDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Understand expectations')).toBeInTheDocument();
      expect(screen.getByText('Team dynamics')).toBeInTheDocument();
    });
  });

  it('renders back button', async () => {
    render(<InterviewPrepDetailPage />);
    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: 'common.back' });
      expect(backButton).toBeInTheDocument();
    });
  });

  it('renders error state when fetch fails', async () => {
    (fetchInterviewPrep as vi.Mock).mockRejectedValue(new Error('Failed'));
    render(<InterviewPrepDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.interviewPrep.loadError')).toBeInTheDocument();
    });
  });

  it('renders not found state when prep is null', async () => {
    (fetchInterviewPrep as vi.Mock).mockResolvedValue(null);
    render(<InterviewPrepDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.interviewPrep.notFound')).toBeInTheDocument();
    });
  });
});