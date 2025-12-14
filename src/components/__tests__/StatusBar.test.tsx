import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../StatusBar';

// Mock the useBackgroundTasks hook
vi.mock('../../app/providers/BackgroundTasksProvider', () => ({
  useBackgroundTasks: vi.fn(),
}));

import { useBackgroundTasks } from '../../app/providers/BackgroundTasksProvider';

describe('StatusBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when no tasks are active', () => {
    vi.mocked(useBackgroundTasks).mockReturnValue({
      tasks: [],
      isWorking: false,
      startTask: vi.fn(),
      endTask: vi.fn(),
    });

    const { container } = render(<StatusBar />);

    expect(container.firstChild).toBeNull();
  });

  it('should render single task message', () => {
    vi.mocked(useBackgroundTasks).mockReturnValue({
      tasks: [{ id: '1', message: 'Committing REQ-001...', startTime: Date.now() }],
      isWorking: true,
      startTask: vi.fn(),
      endTask: vi.fn(),
    });

    render(<StatusBar />);

    expect(screen.getByText('Committing REQ-001...')).toBeInTheDocument();
  });

  it('should show "operations remaining" for multiple tasks', () => {
    vi.mocked(useBackgroundTasks).mockReturnValue({
      tasks: [
        { id: '1', message: 'Committing REQ-001...', startTime: Date.now() },
        { id: '2', message: 'Committing REQ-002...', startTime: Date.now() },
        { id: '3', message: 'Committing REQ-003...', startTime: Date.now() },
      ],
      isWorking: true,
      startTask: vi.fn(),
      endTask: vi.fn(),
    });

    render(<StatusBar />);

    // Should show first task message with remaining count
    expect(screen.getByText(/Committing REQ-001/)).toBeInTheDocument();
    expect(screen.getByText(/2 operations remaining/)).toBeInTheDocument();
  });

  it('should show correct count for many tasks', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      message: `Committing REQ-${String(i + 1).padStart(3, '0')}...`,
      startTime: Date.now(),
    }));

    vi.mocked(useBackgroundTasks).mockReturnValue({
      tasks,
      isWorking: true,
      startTask: vi.fn(),
      endTask: vi.fn(),
    });

    render(<StatusBar />);

    expect(screen.getByText(/9 operations remaining/)).toBeInTheDocument();
  });

  it('should show "Initializing Git cache" message', () => {
    vi.mocked(useBackgroundTasks).mockReturnValue({
      tasks: [
        { id: '1', message: 'Initializing Git cache (one-time)...', startTime: Date.now() },
        { id: '2', message: 'Committing REQ-001...', startTime: Date.now() },
      ],
      isWorking: true,
      startTask: vi.fn(),
      endTask: vi.fn(),
    });

    render(<StatusBar />);

    expect(screen.getByText(/Initializing Git cache/)).toBeInTheDocument();
    expect(screen.getByText(/1 operations remaining/)).toBeInTheDocument();
  });
});
