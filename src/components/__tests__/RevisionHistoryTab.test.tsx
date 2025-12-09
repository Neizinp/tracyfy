import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RevisionHistoryTab } from '../RevisionHistoryTab';

// Mock the useFileSystem hook before importing component
const mockGetArtifactHistory = vi.fn();
vi.mock('../../app/providers/FileSystemProvider', () => ({
  useFileSystem: vi.fn(() => ({
    getArtifactHistory: mockGetArtifactHistory,
    isReady: true,
  })),
  FileSystemProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('RevisionHistoryTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockGetArtifactHistory.mockReturnValue(new Promise(() => {}));
    render(<RevisionHistoryTab artifactId="123" artifactType="requirements" />);
    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('should render empty state when no history', async () => {
    mockGetArtifactHistory.mockResolvedValue([]);
    render(<RevisionHistoryTab artifactId="123" artifactType="requirements" />);

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

    render(<RevisionHistoryTab artifactId="123" artifactType="requirements" />);

    await waitFor(() => {
      expect(screen.queryByText('Loading history...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Initial commit')).toBeInTheDocument();
    expect(screen.getByText('abcdef1')).toBeInTheDocument(); // Short hash
  });
});
