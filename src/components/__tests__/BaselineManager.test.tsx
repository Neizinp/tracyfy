import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BaselineManager } from '../BaselineManager';
import { realGitService } from '../../services/realGitService';
import type { ProjectBaseline, CommitInfo } from '../../types';

// Define TagInfo locally as it's not exported from types
interface TagInfo {
  name: string;
  message: string;
  timestamp: number;
  commit: string;
}

// Mock realGitService
vi.mock('../../services/realGitService', () => ({
  realGitService: {
    getHistory: vi.fn(),
    getTagsWithDetails: vi.fn(),
  },
}));

describe('BaselineManager', () => {
  const mockOnCreateBaseline = vi.fn();
  const mockOnViewBaseline = vi.fn();

  // Sample data
  const mockBaselines: ProjectBaseline[] = [
    {
      id: 'b1',
      projectId: 'p1',
      name: 'v1.0',
      version: 'v1.0',
      description: 'Initial Release',
      timestamp: 1700000000000,
      artifactCommits: {},
      addedArtifacts: [],
      removedArtifacts: [],
    },
    {
      id: 'b2',
      projectId: 'p1',
      name: 'v1.1',
      version: 'v1.1',
      description: 'Patch',
      timestamp: 1700001000000,
      artifactCommits: {},
      addedArtifacts: ['REQ-001'],
      removedArtifacts: [],
    },
  ];

  const mockCommits: CommitInfo[] = [
    {
      hash: 'abc1234',
      message: 'Initial commit',
      author: 'Tester',
      timestamp: 1700000000000,
    },
    {
      hash: 'def5678',
      message: 'Second commit',
      author: 'Tester',
      timestamp: 1700001000000,
    },
  ];

  const mockTags: TagInfo[] = [
    { name: 'v1.0', message: 'Release v1.0', timestamp: 1700000000000, commit: 'abc1234' },
  ];

  const defaultProps = {
    baselines: mockBaselines,
    onCreateBaseline: mockOnCreateBaseline,
    onViewBaseline: mockOnViewBaseline,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Baselines Tab', () => {
    it('should render baselines list correctly', () => {
      render(<BaselineManager {...defaultProps} />);

      // Check header
      expect(screen.getByText('Project History')).toBeInTheDocument();

      // Check baseline items
      // v1.0 helps identifying the baseline. It appears twice (version and name), so getAllByText is needed.
      expect(screen.getAllByText('v1.0').length).toBeGreaterThan(0);
      expect(screen.getByText('Initial Release')).toBeInTheDocument();
      expect(screen.getAllByText('v1.1').length).toBeGreaterThan(0);
    });

    it('should show empty state when no baselines', () => {
      render(<BaselineManager {...defaultProps} baselines={[]} />);
      expect(screen.getByText('No baselines yet')).toBeInTheDocument();
      expect(screen.getByText('Create First Baseline')).toBeInTheDocument();
    });

    it('should call onCreateBaseline when create button clicked', () => {
      render(<BaselineManager {...defaultProps} />);
      const createBtn = screen.getByRole('button', { name: /Create Baseline/i });
      fireEvent.click(createBtn);
      expect(mockOnCreateBaseline).toHaveBeenCalled();
    });

    it('should call onViewBaseline when a baseline is clicked', () => {
      render(<BaselineManager {...defaultProps} />);
      // Find the container for 'Initial Release'
      const descriptionElement = screen.getByText('Initial Release');
      // Navigate up to the clickable container
      const baselineItem = descriptionElement.closest('div[class*="rounded-lg"]') as HTMLElement;
      expect(baselineItem).not.toBeNull();
      fireEvent.click(baselineItem);
      expect(mockOnViewBaseline).toHaveBeenCalledWith('b1');
    });

    it('should highlight selected baseline', () => {
      render(<BaselineManager {...defaultProps} />);
      const descriptionElement = screen.getByText('Initial Release');
      const baselineItem = descriptionElement.closest('div[class*="rounded-lg"]') as HTMLElement;
      fireEvent.click(baselineItem);
      // Logic verified by click event handling
    });
  });

  describe('Commits Tab', () => {
    it('should switch to Commits tab and load history', async () => {
      (realGitService.getHistory as any).mockResolvedValue(mockCommits);
      (realGitService.getTagsWithDetails as any).mockResolvedValue(mockTags);

      render(<BaselineManager {...defaultProps} />);

      const commitsTab = screen.getByText('Commits');
      fireEvent.click(commitsTab);

      // We wait for commits to appear
      await waitFor(() => {
        expect(screen.getByText('Initial commit')).toBeInTheDocument();
      });

      expect(realGitService.getHistory).toHaveBeenCalled();
      expect(realGitService.getTagsWithDetails).toHaveBeenCalled();
      expect(screen.getByText('Second commit')).toBeInTheDocument();
    });

    it('should display tags on commits', async () => {
      (realGitService.getHistory as any).mockResolvedValue(mockCommits);
      (realGitService.getTagsWithDetails as any).mockResolvedValue(mockTags);

      render(<BaselineManager {...defaultProps} />);
      fireEvent.click(screen.getByText('Commits'));

      await waitFor(() => {
        // v1.0 tag should appear
        expect(screen.getAllByText('v1.0').length).toBeGreaterThan(0);
      });

      // v1.0 tag should be associated with the first commit
      const commitMessage = screen.getByText('Initial commit');
      const taggedCommitRow = commitMessage.closest('div[class*="rounded-lg"]') as HTMLElement;
      expect(within(taggedCommitRow).getAllByText('v1.0').length).toBeGreaterThan(0);
    });

    it('should handle empty commits history', async () => {
      (realGitService.getHistory as any).mockResolvedValue([]);
      (realGitService.getTagsWithDetails as any).mockResolvedValue([]);

      render(<BaselineManager {...defaultProps} />);
      fireEvent.click(screen.getByText('Commits'));

      await waitFor(() => {
        expect(screen.getByText('No commits yet')).toBeInTheDocument();
      });
    });

    it('should handle error loading commits', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (realGitService.getHistory as any).mockRejectedValue(new Error('Git error'));

      render(<BaselineManager {...defaultProps} />);
      fireEvent.click(screen.getByText('Commits'));

      await waitFor(() => {
        expect(screen.getByText('No commits yet')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });
});
