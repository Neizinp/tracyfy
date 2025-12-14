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
    projectName: 'TestProject',
    onCreateBaseline: mockOnCreateBaseline,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<VersionHistory {...defaultProps} />);

    expect(screen.getByText(/Project History/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<VersionHistory {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/Project History/i)).not.toBeInTheDocument();
  });

  describe('Tabs', () => {
    it('should render all three tabs', () => {
      render(<VersionHistory {...defaultProps} />);

      expect(screen.getByText('Baselines')).toBeInTheDocument();
      expect(screen.getByText('TestProject Commits')).toBeInTheDocument();
      expect(screen.getByText('All Commits')).toBeInTheDocument();
    });

    it('should switch to Project Commits tab when clicked', () => {
      render(<VersionHistory {...defaultProps} />);

      const commitsTab = screen.getByText('TestProject Commits');
      fireEvent.click(commitsTab);

      // The tab should be active (has different styling)
      expect(commitsTab).toHaveStyle({ color: 'var(--color-info)' });
    });

    it('should switch to All Commits tab when clicked', () => {
      render(<VersionHistory {...defaultProps} />);

      const globalTab = screen.getByText('All Commits');
      fireEvent.click(globalTab);

      expect(globalTab).toHaveStyle({ color: 'var(--color-info)' });
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

      expect(screen.getByText(/No baselines found/i)).toBeInTheDocument();
    });

    it('should not show no baselines message on other tabs', () => {
      render(<VersionHistory {...defaultProps} />);

      // Switch to commits tab
      fireEvent.click(screen.getByText('TestProject Commits'));

      // Baselines message should not be visible
      expect(screen.queryByText(/No baselines found/i)).not.toBeInTheDocument();
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
    it('should look up commit hash using baseline.name (full tag name)', async () => {
      // This test prevents regression: baseline.name contains full tag like "[ProjectName] 1.0"
      // but baseline.version might only contain "1.0"
      const mockBaselines: ProjectBaseline[] = [
        {
          id: 'baseline-1',
          projectId: 'proj-001',
          name: '[TestProject] 1.0', // Full tag name with project prefix
          version: '1.0', // Stripped version (should NOT be used for lookup)
          description: 'First baseline',
          timestamp: Date.now(),
          artifactCommits: {},
        },
      ];

      // Mock getTagsWithDetails to return the tag with commit hash
      const { realGitService } = await import('../../services/realGitService');
      vi.mocked(realGitService.getTagsWithDetails).mockResolvedValue([
        {
          name: '[TestProject] 1.0',
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
});
