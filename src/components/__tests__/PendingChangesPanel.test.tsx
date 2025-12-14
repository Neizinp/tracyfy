import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PendingChangesPanel } from '../PendingChangesPanel';

// Mock the useFileSystem hook
vi.mock('../../app/providers/FileSystemProvider', () => ({
  useFileSystem: vi.fn(),
}));

// Mock the useUser hook
vi.mock('../../app/providers/UserProvider', () => ({
  useUser: () => ({
    currentUser: { id: 'USER-001', name: 'Test User' },
    users: [],
  }),
}));

// Mock the useBackgroundTasks hook
vi.mock('../../app/providers/BackgroundTasksProvider', () => ({
  useBackgroundTasks: () => ({
    tasks: [],
    isWorking: false,
    startTask: vi.fn(() => 'task-1'),
    endTask: vi.fn(),
  }),
}));

import { useFileSystem } from '../../app/providers/FileSystemProvider';

describe('PendingChangesPanel', () => {
  const mockCommitFile = vi.fn();
  const mockGetArtifactHistory = vi.fn();
  const mockRefreshStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: return empty history (no prior commits)
    mockGetArtifactHistory.mockResolvedValue([]);
    mockRefreshStatus.mockResolvedValue(undefined);
  });

  it('should render with no pending changes', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [],
      commitFile: mockCommitFile,
      getArtifactHistory: mockGetArtifactHistory,
      refreshStatus: mockRefreshStatus,
    } as any);

    render(<PendingChangesPanel />);

    expect(screen.getByText(/No pending changes/i)).toBeInTheDocument();
  });

  it('should display pending changes', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [{ path: 'requirements/REQ-001.md', status: 'new' }],
      commitFile: mockCommitFile,
      getArtifactHistory: mockGetArtifactHistory,
      refreshStatus: mockRefreshStatus,
    } as any);

    render(<PendingChangesPanel />);

    expect(screen.getByText(/REQ-001/i)).toBeInTheDocument();
  });

  it('should show commit input for each change', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [{ path: 'requirements/REQ-001.md', status: 'new' }],
      commitFile: mockCommitFile,
      getArtifactHistory: mockGetArtifactHistory,
      refreshStatus: mockRefreshStatus,
    } as any);

    render(<PendingChangesPanel />);

    const commitInputs = screen.getAllByPlaceholderText(/commit message/i);
    expect(commitInputs.length).toBeGreaterThan(0);
  });

  it('should auto-fill "First commit" for new files with no history', async () => {
    // Mock no prior commits for this artifact
    mockGetArtifactHistory.mockResolvedValue([]);

    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [{ path: 'requirements/REQ-001.md', status: 'new' }],
      commitFile: mockCommitFile,
      getArtifactHistory: mockGetArtifactHistory,
      refreshStatus: mockRefreshStatus,
    } as any);

    render(<PendingChangesPanel />);

    // Wait for the async history check to complete
    await waitFor(() => {
      const input = screen.getByDisplayValue(/First commit/i);
      expect(input).toBeInTheDocument();
    });
  });

  it('should show different icons for new vs modified', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [
        { path: 'requirements/REQ-001.md', status: 'new' },
        { path: 'requirements/REQ-002.md', status: 'modified' },
      ],
      commitFile: mockCommitFile,
      getArtifactHistory: mockGetArtifactHistory,
      refreshStatus: mockRefreshStatus,
    } as any);

    const { container } = render(<PendingChangesPanel />);

    // Should have icons for both items
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should parse requirement paths correctly', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [{ path: 'requirements/REQ-001.md', status: 'new' }],
      commitFile: mockCommitFile,
      getArtifactHistory: mockGetArtifactHistory,
      refreshStatus: mockRefreshStatus,
    } as any);

    render(<PendingChangesPanel />);

    expect(screen.getByText(/REQ-001/i)).toBeInTheDocument();
  });

  it('should parse usecase paths correctly', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [{ path: 'usecases/UC-001.md', status: 'new' }],
      commitFile: mockCommitFile,
      getArtifactHistory: mockGetArtifactHistory,
      refreshStatus: mockRefreshStatus,
    } as any);

    render(<PendingChangesPanel />);

    expect(screen.getByText(/UC-001/i)).toBeInTheDocument();
  });

  it('should auto-fill "Update" message for files with history', async () => {
    // Mock existing history for this artifact
    mockGetArtifactHistory.mockResolvedValue([
      { hash: 'abc123', message: 'First commit', date: new Date().toISOString(), author: 'Test' },
    ]);

    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [{ path: 'requirements/REQ-001.md', status: 'modified' }],
      commitFile: mockCommitFile,
      getArtifactHistory: mockGetArtifactHistory,
      refreshStatus: mockRefreshStatus,
    } as any);

    render(<PendingChangesPanel />);

    // Wait for the async history check to complete
    await waitFor(() => {
      const input = screen.getByDisplayValue(/Update REQ-001/i);
      expect(input).toBeInTheDocument();
    });
  });
});
