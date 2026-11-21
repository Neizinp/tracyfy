import { screen, waitFor } from '@testing-library/react';
import { renderWithStore } from '../../test/renderWithStore';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RevisionHistoryTab } from '../RevisionHistoryTab';

// The history actions RevisionHistoryTab reads from the store
const mockGetArtifactHistory = vi.fn();
const mockReadFileAtCommit = vi.fn().mockResolvedValue(null);

const render = (ui: React.ReactElement) =>
  renderWithStore(ui, {
    state: {
      isReady: true,
      artifactHistory: mockGetArtifactHistory,
      readFileAtCommit: mockReadFileAtCommit,
    },
  });

describe('RevisionHistoryTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockGetArtifactHistory.mockReturnValue(new Promise(() => {}));
    render(<RevisionHistoryTab artifactId="123" artifactType="requirement" />);
    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('should render empty state when no history', async () => {
    mockGetArtifactHistory.mockResolvedValue([]);
    render(<RevisionHistoryTab artifactId="123" artifactType="requirement" />);

    await waitFor(() => {
      expect(screen.queryByText('Loading history...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No revision history available.')).toBeInTheDocument();
  });

  it('should render history table', async () => {
    const mockCommits = [
      {
        hash: 'abcdef123456',
        message: 'Initial commit',
        author: 'John Doe',
        timestamp: 1678886400000, // 2023-03-15
      },
    ];
    mockGetArtifactHistory.mockResolvedValue(mockCommits);

    render(<RevisionHistoryTab artifactId="123" artifactType="requirement" />);

    await waitFor(() => {
      expect(screen.queryByText('Loading history...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Initial commit')).toBeInTheDocument();
  });
});
