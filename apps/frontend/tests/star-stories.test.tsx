import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StarStoriesPage from '@/app/(default)/star-stories/page';

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/api', () => ({
  fetchStarStories: vi.fn(),
  createStarStory: vi.fn(),
  updateStarStory: vi.fn(),
  deleteStarStory: vi.fn(),
}));

import { fetchStarStories, createStarStory, updateStarStory, deleteStarStory } from '@/lib/api';

describe('StarStoriesPage', () => {
  const mockStories = [
    {
      story_id: 's-1',
      title: 'Optimized Latency',
      situation: 'High latency issue',
      task: 'Reduce to 1s',
      action: 'Implemented caching',
      result: '300ms achieved',
      tags: ['performance', 'backend'],
      job_history_id: null,
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
    (fetchStarStories as vi.Mock).mockResolvedValue([]);
    render(<StarStoriesPage />);
    await waitFor(() => {
      expect(fetchStarStories).toHaveBeenCalledTimes(1);
    });
  });

  it('renders empty state when no stories exist', async () => {
    (fetchStarStories as vi.Mock).mockResolvedValue([]);
    render(<StarStoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.starStories.empty')).toBeInTheDocument();
    });
  });

  it('renders story cards when stories exist', async () => {
    (fetchStarStories as vi.Mock).mockResolvedValue(mockStories);
    render(<StarStoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('Optimized Latency')).toBeInTheDocument();
    });
    expect(screen.getByText('High latency issue')).toBeInTheDocument();
    expect(screen.getByText('Implemented caching')).toBeInTheDocument();
    expect(screen.getByText('300ms achieved')).toBeInTheDocument();
  });

  it('opens create dialog when create button is clicked', async () => {
    (fetchStarStories as vi.Mock).mockResolvedValue([]);
    render(<StarStoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.starStories.empty')).toBeInTheDocument();
    });
    const createButtons = screen.getAllByRole('button', { name: 'interviewPrep.starStories.create' });
    fireEvent.click(createButtons[0]);
    expect(screen.getByRole('heading', { name: 'interviewPrep.starStories.create' })).toBeInTheDocument();
  });

  it('submits create form and calls createStarStory', async () => {
    (fetchStarStories as vi.Mock).mockResolvedValue([]);
    (createStarStory as vi.Mock).mockResolvedValue(mockStories[0]);
    render(<StarStoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.starStories.empty')).toBeInTheDocument();
    });
    const createButtons = screen.getAllByRole('button', { name: 'interviewPrep.starStories.create' });
    fireEvent.click(createButtons[0]);
    
    const titleInput = screen.getByPlaceholderText('interviewPrep.starStories.titlePlaceholder');
    fireEvent.change(titleInput, { target: { value: 'New Story' } });
    
    const situationInput = screen.getByPlaceholderText('interviewPrep.starStories.situationPlaceholder');
    fireEvent.change(situationInput, { target: { value: 'Situation' } });
    
    const taskInput = screen.getByPlaceholderText('interviewPrep.starStories.taskPlaceholder');
    fireEvent.change(taskInput, { target: { value: 'Task' } });
    
    const actionInput = screen.getByPlaceholderText('interviewPrep.starStories.actionPlaceholder');
    fireEvent.change(actionInput, { target: { value: 'Action' } });
    
    const resultInput = screen.getByPlaceholderText('interviewPrep.starStories.resultPlaceholder');
    fireEvent.change(resultInput, { target: { value: 'Result' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
    
    await waitFor(() => {
      expect(createStarStory).toHaveBeenCalledWith({
        title: 'New Story',
        situation: 'Situation',
        task: 'Task',
        action: 'Action',
        result: 'Result',
        tags: [],
      });
    });
  });

  it('opens edit dialog when edit button is clicked', async () => {
    (fetchStarStories as vi.Mock).mockResolvedValue(mockStories);
    render(<StarStoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('Optimized Latency')).toBeInTheDocument();
    });
    const editButton = screen.getAllByRole('button')[1];
    fireEvent.click(editButton);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.starStories.edit')).toBeInTheDocument();
    });
  });

  it('submits edit form and calls updateStarStory', async () => {
    (fetchStarStories as vi.Mock).mockResolvedValue(mockStories);
    (updateStarStory as vi.Mock).mockResolvedValue(mockStories[0]);
    render(<StarStoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('Optimized Latency')).toBeInTheDocument();
    });
    const editButton = screen.getAllByRole('button')[1];
    fireEvent.click(editButton);
    
    await waitFor(() => {
      const titleInput = screen.getByDisplayValue('Optimized Latency');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
    
    await waitFor(() => {
      expect(updateStarStory).toHaveBeenCalledWith('s-1', expect.objectContaining({
        title: 'Updated Title',
      }));
    });
  });

  it('opens delete confirm dialog when delete button is clicked', async () => {
    (fetchStarStories as vi.Mock).mockResolvedValue(mockStories);
    render(<StarStoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('Optimized Latency')).toBeInTheDocument();
    });
    const deleteButton = screen.getAllByRole('button')[2];
    fireEvent.click(deleteButton);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.starStories.deleteTitle')).toBeInTheDocument();
    });
  });

  it('calls deleteStarStory when delete is confirmed', async () => {
    (fetchStarStories as vi.Mock).mockResolvedValue(mockStories);
    (deleteStarStory as vi.Mock).mockResolvedValue(undefined);
    render(<StarStoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('Optimized Latency')).toBeInTheDocument();
    });
    const deleteButton = screen.getAllByRole('button')[2];
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    });
    
    await waitFor(() => {
      expect(deleteStarStory).toHaveBeenCalledWith('s-1');
    });
  });

  it('renders error message when fetch fails', async () => {
    (fetchStarStories as vi.Mock).mockRejectedValue(new Error('Failed'));
    render(<StarStoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('interviewPrep.starStories.loadError')).toBeInTheDocument();
    });
  });

  it('renders tags correctly', async () => {
    (fetchStarStories as vi.Mock).mockResolvedValue(mockStories);
    render(<StarStoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('performance')).toBeInTheDocument();
      expect(screen.getByText('backend')).toBeInTheDocument();
    });
  });
});