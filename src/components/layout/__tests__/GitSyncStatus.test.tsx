import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GitSyncStatus } from '../GitSyncStatus';
import { realGitService } from '../../../services/realGitService';

// Mock realGitService
vi.mock('../../../services/realGitService', () => ({
  realGitService: {
    isInitialized: vi.fn(),
    getRemotes: vi.fn(),
    getSyncStatus: vi.fn(),
    fetch: vi.fn(),
    pull: vi.fn(),
    push: vi.fn(),
    getCurrentBranch: vi.fn(),
  },
}));

// Mock debug utility
vi.mock('../../../utils/debug', () => ({
  debug: { log: vi.fn(), error: vi.fn() },
}));

describe('GitSyncStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(realGitService.isInitialized).mockReturnValue(true);
    vi.mocked(realGitService.getRemotes).mockResolvedValue([
      { name: 'origin', url: 'https://github.com/user/repo' },
    ]);
  });

  it('should render Cloud icon when in sync', async () => {
    vi.mocked(realGitService.getSyncStatus).mockResolvedValue({
      ahead: false,
      behind: false,
      diverged: false,
    });

    render(<GitSyncStatus />);

    await waitFor(() => {
      expect(screen.getByTestId('sync-icon-synced')).toBeInTheDocument();
    });
  });

  it('should show ahead icon when there are local commits', async () => {
    vi.mocked(realGitService.getSyncStatus).mockResolvedValue({
      ahead: true,
      behind: false,
      diverged: false,
      aheadCommits: [
        { hash: '123', message: 'Local commit', author: 'User', timestamp: Date.now() },
      ],
    });

    render(<GitSyncStatus />);

    await waitFor(() => {
      expect(screen.getByTestId('sync-icon-ahead')).toBeInTheDocument();
    });
  });

  it('should show behind icon when there are remote commits', async () => {
    vi.mocked(realGitService.getSyncStatus).mockResolvedValue({
      ahead: false,
      behind: true,
      diverged: false,
      behindCommits: [
        { hash: '456', message: 'Remote commit', author: 'User', timestamp: Date.now() },
      ],
    });

    render(<GitSyncStatus />);

    await waitFor(() => {
      expect(screen.getByTestId('sync-icon-behind')).toBeInTheDocument();
    });
  });

  it('should open popover on click and show commit details', async () => {
    vi.mocked(realGitService.getSyncStatus).mockResolvedValue({
      ahead: true,
      behind: true,
      diverged: false,
      aheadCommits: [
        { hash: '123', message: 'Outgoing commit', author: 'User', timestamp: Date.now() },
      ],
      behindCommits: [
        { hash: '456', message: 'Incoming commit', author: 'User', timestamp: Date.now() },
      ],
    });

    render(<GitSyncStatus />);

    const button = await screen.findByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Git Sync Details')).toBeInTheDocument();
    expect(screen.getByText('Outgoing commit')).toBeInTheDocument();
    expect(screen.getByText('Incoming commit')).toBeInTheDocument();
  });

  it('should trigger sync when "Sync Now" is clicked', async () => {
    vi.mocked(realGitService.getSyncStatus).mockResolvedValue({
      ahead: true,
      behind: false,
      diverged: false,
      aheadCommits: [
        { hash: '123', message: 'Local commit', author: 'User', timestamp: Date.now() },
      ],
    });

    render(<GitSyncStatus />);

    // Open popover
    fireEvent.click(await screen.findByRole('button'));

    const syncButton = screen.getByTestId('sync-now-button');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(realGitService.fetch).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(realGitService.push).toHaveBeenCalled();
    });
  });

  it('should trigger manual refresh when refresh icon is clicked', async () => {
    vi.mocked(realGitService.getSyncStatus).mockResolvedValue({
      ahead: false,
      behind: false,
      diverged: false,
    });

    render(<GitSyncStatus />);

    // Open popover
    fireEvent.click(await screen.findByRole('button'));

    const refreshButton = screen.getByTestId('manual-refresh-button');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(realGitService.fetch).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(realGitService.getSyncStatus).toHaveBeenCalledTimes(2); // Initial + Refresh
    });
  });
});
