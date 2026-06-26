import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import JobHistoriesPage from '@/app/(default)/job-histories/page';

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/api', () => ({
  fetchJobHistories: vi.fn(),
  createJobHistory: vi.fn(),
  updateJobHistory: vi.fn(),
  deleteJobHistory: vi.fn(),
}));

import { fetchJobHistories, createJobHistory, updateJobHistory, deleteJobHistory } from '@/lib/api';

describe('JobHistoriesPage', () => {
  const mockHistories = [
    {
      job_history_id: 'jh-1',
      company: 'TechCorp',
      role: 'Senior Engineer',
      years: '2020-2023',
      description: 'Built scalable backend systems',
      department: 'Engineering',
      location: 'San Francisco',
      responsibilities: ['API Design', 'Performance Tuning'],
      skills_used: ['Python', 'FastAPI', 'AWS'],
      star_stories: [],
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    (fetchJobHistories as vi.Mock).mockResolvedValue([]);
    render(<JobHistoriesPage />);
    await waitFor(() => {
      expect(fetchJobHistories).toHaveBeenCalledTimes(1);
    });
  });

  it('renders empty state when no histories exist', async () => {
    (fetchJobHistories as vi.Mock).mockResolvedValue([]);
    render(<JobHistoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.jobHistories.empty')).toBeInTheDocument();
    });
  });

  it('renders job history cards when histories exist', async () => {
    (fetchJobHistories as vi.Mock).mockResolvedValue(mockHistories);
    render(<JobHistoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    });
    expect(screen.getByText('TechCorp')).toBeInTheDocument();
    expect(screen.getByText('2020-2023')).toBeInTheDocument();
    expect(screen.getByText('Built scalable backend systems')).toBeInTheDocument();
  });

  it('opens create dialog when create button is clicked', async () => {
    (fetchJobHistories as vi.Mock).mockResolvedValue([]);
    render(<JobHistoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.jobHistories.empty')).toBeInTheDocument();
    });
    const createButtons = screen.getAllByRole('button', { name: 'interviewPrep.jobHistories.create' });
    fireEvent.click(createButtons[0]);
    expect(screen.getByRole('heading', { name: 'interviewPrep.jobHistories.create' })).toBeInTheDocument();
  });

  it('submits create form and calls createJobHistory', async () => {
    (fetchJobHistories as vi.Mock).mockResolvedValue([]);
    (createJobHistory as vi.Mock).mockResolvedValue(mockHistories[0]);
    render(<JobHistoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.jobHistories.empty')).toBeInTheDocument();
    });
    const createButtons = screen.getAllByRole('button', { name: 'interviewPrep.jobHistories.create' });
    fireEvent.click(createButtons[0]);
    
    const companyInput = screen.getByPlaceholderText('interviewPrep.jobHistories.companyPlaceholder');
    fireEvent.change(companyInput, { target: { value: 'New Company' } });
    
    const roleInput = screen.getByPlaceholderText('interviewPrep.jobHistories.rolePlaceholder');
    fireEvent.change(roleInput, { target: { value: 'New Role' } });
    
    const yearsInput = screen.getByPlaceholderText('interviewPrep.jobHistories.yearsPlaceholder');
    fireEvent.change(yearsInput, { target: { value: '2021-2024' } });
    
    const descriptionInput = screen.getByPlaceholderText('interviewPrep.jobHistories.descriptionPlaceholder');
    fireEvent.change(descriptionInput, { target: { value: 'Description' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
    
    await waitFor(() => {
      expect(createJobHistory).toHaveBeenCalledWith({
        company: 'New Company',
        role: 'New Role',
        years: '2021-2024',
        description: 'Description',
        department: null,
        location: null,
        responsibilities: [],
        skills_used: [],
      });
    });
  });

  it('opens edit dialog when edit button is clicked', async () => {
    (fetchJobHistories as vi.Mock).mockResolvedValue(mockHistories);
    render(<JobHistoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    });
    const editButton = screen.getAllByRole('button')[1];
    fireEvent.click(editButton);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.jobHistories.edit')).toBeInTheDocument();
    });
  });

  it('submits edit form and calls updateJobHistory', async () => {
    (fetchJobHistories as vi.Mock).mockResolvedValue(mockHistories);
    (updateJobHistory as vi.Mock).mockResolvedValue(mockHistories[0]);
    render(<JobHistoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    });
    const editButton = screen.getAllByRole('button')[1];
    fireEvent.click(editButton);
    
    await waitFor(() => {
      const companyInput = screen.getByDisplayValue('TechCorp');
      fireEvent.change(companyInput, { target: { value: 'Updated Corp' } });
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
    
    await waitFor(() => {
      expect(updateJobHistory).toHaveBeenCalledWith('jh-1', expect.objectContaining({
        company: 'Updated Corp',
      }));
    });
  });

  it('opens delete confirm dialog when delete button is clicked', async () => {
    (fetchJobHistories as vi.Mock).mockResolvedValue(mockHistories);
    render(<JobHistoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    });
    const deleteButton = screen.getAllByRole('button')[2];
    fireEvent.click(deleteButton);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.jobHistories.deleteTitle')).toBeInTheDocument();
    });
  });

  it('calls deleteJobHistory when delete is confirmed', async () => {
    (fetchJobHistories as vi.Mock).mockResolvedValue(mockHistories);
    (deleteJobHistory as vi.Mock).mockResolvedValue(undefined);
    render(<JobHistoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    });
    const deleteButton = screen.getAllByRole('button')[2];
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    });
    
    await waitFor(() => {
      expect(deleteJobHistory).toHaveBeenCalledWith('jh-1');
    });
  });

  it('renders error message when fetch fails', async () => {
    (fetchJobHistories as vi.Mock).mockRejectedValue(new Error('Failed'));
    render(<JobHistoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.jobHistories.loadError')).toBeInTheDocument();
    });
  });

  it('renders location when provided', async () => {
    (fetchJobHistories as vi.Mock).mockResolvedValue(mockHistories);
    render(<JobHistoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
    });
  });

  it('renders responsibilities tags correctly', async () => {
    (fetchJobHistories as vi.Mock).mockResolvedValue(mockHistories);
    render(<JobHistoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('API Design')).toBeInTheDocument();
      expect(screen.getByText('Performance Tuning')).toBeInTheDocument();
    });
  });

  it('renders skills tags correctly', async () => {
    (fetchJobHistories as vi.Mock).mockResolvedValue(mockHistories);
    render(<JobHistoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('FastAPI')).toBeInTheDocument();
      expect(screen.getByText('AWS')).toBeInTheDocument();
    });
  });
});