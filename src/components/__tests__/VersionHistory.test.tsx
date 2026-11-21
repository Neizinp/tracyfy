import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VersionHistory } from '../VersionHistory';
import type { ProjectBaseline } from '../../types';

// Mock realGitService
vi.mock('../../services/realGitService', () => ({
  realGitService: {
    getHistory: vi.fn().mockResolvedValue([]),
    getTagsWithDetails: vi.fn().mockResolvedValue([]),
    getTags: vi.fn().mockResolvedValue([]),
    readFileAtCommit: vi.fn().mockResolvedValue(''),
    loadProjectSnapshot: vi.fn().mockResolvedValue({
      requirements: [],
      useCases: [],
      testCases: [],
      information: [],
    }),
    getCommitFiles: vi.fn().mockResolvedValue([]),
  },
}));

describe('VersionHistory', () => {
  const mockOnClose = vi.fn();
  const mockOnCreateBaseline = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    baselines: [] as ProjectBaseline[],
    onCreateBaseline: mockOnCreateBaseline,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<VersionHistory {...defaultProps} />);

    expect(screen.getByText(/History/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<VersionHistory {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/History/i)).not.toBeInTheDocument();
  });

  describe('Tabs', () => {
    it('has a Baselines and a Commits tab', () => {
      render(<VersionHistory {...defaultProps} />);

      expect(screen.getByText('Baselines')).toBeInTheDocument();
      expect(screen.getByText('Commits')).toBeInTheDocument();
    });

    it('should switch to the Commits tab when clicked', () => {
      render(<VersionHistory {...defaultProps} />);

      const commitsTab = screen.getByText('Commits');
      fireEvent.click(commitsTab);

      expect(commitsTab).toHaveStyle({ color: 'var(--color-info)' });
    });
  });

  describe('Baselines Tab', () => {
    it('should show Create Baseline button on baselines tab', () => {
      render(<VersionHistory {...defaultProps} />);

      // Use getAllByText since text may appear in multiple places
      const createBaselineElements = screen.getAllByText(/Create Baseline/i);
      expect(createBaselineElements.length).toBeGreaterThan(0);
    });

    it('should show no baselines message when empty', () => {
      render(<VersionHistory {...defaultProps} />);

      expect(screen.getByText(/No baselines yet/i)).toBeInTheDocument();
    });

    it('should not show no baselines message on other tabs', () => {
      render(<VersionHistory {...defaultProps} />);

      // Switch to commits tab
      fireEvent.click(screen.getByText('Commits'));

      // Baselines message should not be visible
      expect(screen.queryByText(/No baselines yet/i)).not.toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('should call onClose when close button is clicked', () => {
      render(<VersionHistory {...defaultProps} />);

      // Find the X button (lucide-x class)
      const closeButton = document.querySelector('.lucide-x')?.closest('button');
      if (closeButton) fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Tip', () => {
    it('should show helpful tip at the bottom', () => {
      render(<VersionHistory {...defaultProps} />);

      expect(screen.getByText(/Create baselines to save named snapshots/i)).toBeInTheDocument();
    });
  });

  describe('Baseline View Button', () => {
    it('opens the snapshot of the commit the baseline tag points to', async () => {
      const mockBaselines: ProjectBaseline[] = [
        {
          name: '1.0',
          description: 'First baseline',
          timestamp: Date.now(),
          commit: 'abc1234def',
        },
      ];

      // Mock getTagsWithDetails to return the tag with commit hash
      const { realGitService } = await import('../../services/realGitService');
      vi.mocked(realGitService.getTagsWithDetails).mockResolvedValue([
        {
          name: '1.0',
          message: 'First baseline',
          timestamp: Date.now(),
          commit: 'abc123def',
        },
      ]);

      render(<VersionHistory {...defaultProps} baselines={mockBaselines} />);

      // Wait for tags to load
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Click the View button
      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);

      // The SnapshotViewer should open (it would fail if commitHash was empty)
      // Since SnapshotViewer shows the name, we verify it displays correctly
      expect(screen.getByText(/Snapshot:/i)).toBeInTheDocument();
    });
  });

  describe('Artifact Type Filters', () => {
    it('should show filter buttons on the Commits tab', async () => {
      const { realGitService } = await import('../../services/realGitService');
      vi.mocked(realGitService.getHistory).mockResolvedValue([
        {
          hash: 'abc123',
          message: 'Test commit',
          author: 'Test User',
          timestamp: Date.now(),
        },
      ]);
      vi.mocked(realGitService.getCommitFiles).mockResolvedValue(['requirements/REQ-001.md']);

      render(<VersionHistory {...defaultProps} />);

      fireEvent.click(screen.getByText('Commits'));

      // Wait for commits to load
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Filter buttons should be visible
      expect(screen.getByText('REQ')).toBeInTheDocument();
      expect(screen.getByText('UC')).toBeInTheDocument();
      expect(screen.getByText('TC')).toBeInTheDocument();
      expect(screen.getByText('INFO')).toBeInTheDocument();
      expect(screen.getByText('RISK')).toBeInTheDocument();
      expect(screen.getByText('PROJ')).toBeInTheDocument();
      expect(screen.getByText('LINK')).toBeInTheDocument();
      expect(screen.queryByText('WF')).toBeNull();
      expect(screen.getByText('OTHER')).toBeInTheDocument();
    });

    it('should toggle filter when filter button is clicked', async () => {
      const { realGitService } = await import('../../services/realGitService');
      vi.mocked(realGitService.getHistory).mockResolvedValue([
        {
          hash: 'abc123',
          message: 'Update requirement',
          author: 'Test User',
          timestamp: Date.now(),
        },
      ]);
      vi.mocked(realGitService.getCommitFiles).mockResolvedValue(['requirements/REQ-001.md']);

      render(<VersionHistory {...defaultProps} />);

      fireEvent.click(screen.getByText('Commits'));

      // Wait for commits to load
      await new Promise((resolve) => setTimeout(resolve, 150));

      // REQ button should be active (colored background)
      const reqButton = screen.getByText('REQ');
      expect(reqButton).toHaveStyle({ backgroundColor: 'var(--color-info)' });

      // Click to deselect
      fireEvent.click(reqButton);

      // After toggle, button should NOT have the active color anymore
      expect(reqButton).not.toHaveStyle({ backgroundColor: 'var(--color-info)' });
    });

    it('should filter commits based on selected artifact types', async () => {
      const { realGitService } = await import('../../services/realGitService');
      vi.mocked(realGitService.getHistory).mockResolvedValue([
        {
          hash: 'commit1',
          message: 'Update requirement',
          author: 'Test User',
          timestamp: Date.now(),
        },
        {
          hash: 'commit2',
          message: 'Update use case',
          author: 'Test User',
          timestamp: Date.now() - 1000,
        },
      ]);
      vi.mocked(realGitService.getCommitFiles).mockImplementation(async (hash: string) => {
        if (hash === 'commit1') return ['requirements/REQ-001.md'];
        if (hash === 'commit2') return ['use-cases/UC-001.md'];
        return [];
      });

      render(<VersionHistory {...defaultProps} />);

      fireEvent.click(screen.getByText('Commits'));

      // Wait for commits to load
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Both commits should be visible initially
      expect(screen.getByText('Update requirement')).toBeInTheDocument();
      expect(screen.getByText('Update use case')).toBeInTheDocument();

      // Deselect UC filter
      fireEvent.click(screen.getByText('UC'));

      // Wait for re-render
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Only requirement commit should be visible
      expect(screen.getByText('Update requirement')).toBeInTheDocument();
      expect(screen.queryByText('Update use case')).not.toBeInTheDocument();
    });

    it('should show empty message when no commits match filters', async () => {
      const { realGitService } = await import('../../services/realGitService');
      vi.mocked(realGitService.getHistory).mockResolvedValue([
        {
          hash: 'commit1',
          message: 'Update requirement',
          author: 'Test User',
          timestamp: Date.now(),
        },
      ]);
      vi.mocked(realGitService.getCommitFiles).mockResolvedValue(['requirements/REQ-001.md']);

      render(<VersionHistory {...defaultProps} />);

      fireEvent.click(screen.getByText('Commits'));

      // Wait for commits to load
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Deselect REQ filter
      fireEvent.click(screen.getByText('REQ'));

      // Wait for re-render
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should show no matches message
      expect(screen.getByText(/No commits match the selected filters/i)).toBeInTheDocument();
    });

    it('should show the tip about filters on the Commits tab', async () => {
      const { realGitService } = await import('../../services/realGitService');
      vi.mocked(realGitService.getHistory).mockResolvedValue([]);

      render(<VersionHistory {...defaultProps} />);

      fireEvent.click(screen.getByText('Commits'));

      // Wait for load
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should show filter tip
      expect(
        screen.getByText(/Use the filter buttons to show commits for specific artifact types/i)
      ).toBeInTheDocument();
    });
  });
});
