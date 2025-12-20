import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockGetArtifactHistory = vi.fn().mockResolvedValue([]);
const mockReadFileAtCommit = vi.fn().mockResolvedValue(null);
const mockGetRiskHistory = vi.fn().mockResolvedValue([]);

vi.mock('../../app/providers', () => ({
  useFileSystem: () => ({
    getArtifactHistory: mockGetArtifactHistory,
    readFileAtCommit: mockReadFileAtCommit,
    isReady: true,
  }),
  useRisks: () => ({
    getRiskHistory: mockGetRiskHistory,
    risks: [],
  }),
}));

import { BaselineRevisionHistory } from '../BaselineRevisionHistory';
import type { ProjectBaseline } from '../../types';

vi.mock('../../services/realGitService', () => ({
  realGitService: {
    getHistory: vi.fn().mockResolvedValue([
      {
        hash: 'abc123',
        message: 'Updated requirement',
        author: 'Test User',
        timestamp: Date.now(),
      },
    ]),
    readFileAtCommit: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../../services/fileSystemService', () => ({
  fileSystemService: {
    readFile: vi.fn().mockResolvedValue(null),
  },
}));

describe('BaselineRevisionHistory', () => {
  const mockOnViewArtifact = vi.fn();

  const mockCurrentBaseline: ProjectBaseline = {
    id: 'baseline-1',
    name: 'Version 1.0',
    description: 'Initial release',
    projectId: 'PROJ-001',
    timestamp: Date.now(),
    version: '01',
    artifactCommits: {
      'REQ-001': { commitHash: 'abc123', type: 'requirement' },
      'UC-001': { commitHash: 'def456', type: 'usecase' },
    },
    addedArtifacts: ['REQ-002'],
    removedArtifacts: ['REQ-003'],
  };

  const mockPreviousBaseline: ProjectBaseline = {
    id: 'baseline-0',
    name: 'Initial Baseline',
    description: 'First baseline',
    projectId: 'PROJ-001',
    timestamp: Date.now() - 86400000,
    version: '00',
    artifactCommits: {
      'REQ-001': { commitHash: 'old123', type: 'requirement' },
      'REQ-003': { commitHash: 'xyz789', type: 'requirement' },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BaselineRevisionHistory
        currentBaseline={mockCurrentBaseline}
        previousBaseline={null}
        onViewArtifact={mockOnViewArtifact}
        projectName="Test Project"
      />
    );
    expect(container).toBeTruthy();
  });

  it('should display baseline name and version', async () => {
    render(
      <BaselineRevisionHistory
        currentBaseline={mockCurrentBaseline}
        previousBaseline={null}
        onViewArtifact={mockOnViewArtifact}
        projectName="Test Project"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Baseline 01/i)).toBeInTheDocument();
      expect(screen.getByText(/Version 1.0/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Project/i)).toBeInTheDocument();
    });
  });

  it('should display baseline description when provided', async () => {
    render(
      <BaselineRevisionHistory
        currentBaseline={mockCurrentBaseline}
        previousBaseline={null}
        onViewArtifact={mockOnViewArtifact}
        projectName="Test Project"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Initial release')).toBeInTheDocument();
    });
  });

  it('should display added artifacts section when there are additions', async () => {
    render(
      <BaselineRevisionHistory
        currentBaseline={mockCurrentBaseline}
        previousBaseline={mockPreviousBaseline}
        onViewArtifact={mockOnViewArtifact}
        projectName="Test Project"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Added to Project/i)).toBeInTheDocument();
      expect(screen.getByText('REQ-002')).toBeInTheDocument();
    });
  });

  it('should display removed artifacts section when there are removals', async () => {
    render(
      <BaselineRevisionHistory
        currentBaseline={mockCurrentBaseline}
        previousBaseline={mockPreviousBaseline}
        onViewArtifact={mockOnViewArtifact}
        projectName="Test Project"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Removed from Project/i)).toBeInTheDocument();
      expect(screen.getByText('REQ-003')).toBeInTheDocument();
    });
  });

  it('should display "first baseline" message when no previous baseline', async () => {
    const baselineWithNoChanges: ProjectBaseline = {
      ...mockCurrentBaseline,
      addedArtifacts: [],
      removedArtifacts: [],
    };

    render(
      <BaselineRevisionHistory
        currentBaseline={baselineWithNoChanges}
        previousBaseline={null}
        onViewArtifact={mockOnViewArtifact}
        projectName="Test Project"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('This is the first baseline')).toBeInTheDocument();
    });
  });
});
