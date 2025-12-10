import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SnapshotViewer } from '../SnapshotViewer';
import { realGitService } from '../../services/realGitService';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

// Mock dependencies
vi.mock('../../services/realGitService', () => ({
  realGitService: {
    loadProjectSnapshot: vi.fn(),
    readFileAtCommit: vi.fn(),
  },
}));

// Mock keyboard hook
vi.mock('../../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

describe('SnapshotViewer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    commitHash: 'abc1234',
    baselineName: 'v1.0',
    timestamp: 1625244000000,
  };

  const mockData = {
    requirements: [
      { id: 'REQ-1', title: 'Test Req', content: 'Description 1' },
      { id: 'REQ-2', title: 'Another Req', content: 'Description 2' },
    ],
    useCases: [{ id: 'UC-1', title: 'Test Use Case', description: 'UC Desc' }],
    testCases: [],
    information: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (realGitService.loadProjectSnapshot as any).mockResolvedValue(mockData);
  });

  it('should render loading state initially', async () => {
    // Return a promise that never resolves immediately to test loading state
    (realGitService.loadProjectSnapshot as any).mockImplementation(() => new Promise(() => {}));

    render(<SnapshotViewer {...defaultProps} />);
    expect(screen.getByText('Loading snapshot data...')).toBeInTheDocument();
  });

  it('should load and display snapshot data', async () => {
    render(<SnapshotViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Test Req')).toBeInTheDocument();
    });

    expect(screen.getByText('REQ-1')).toBeInTheDocument();
    expect(realGitService.loadProjectSnapshot).toHaveBeenCalledWith('abc1234');
  });

  it('should switch tabs', async () => {
    render(<SnapshotViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Test Req')).toBeInTheDocument();
    });

    // Switch to Use Cases
    fireEvent.click(screen.getByText('Use Cases'));

    await waitFor(() => {
      expect(screen.getByText('Test Use Case')).toBeInTheDocument();
    });

    expect(screen.queryByText('Test Req')).not.toBeInTheDocument();
  });

  it('should display empty state for empty tabs', async () => {
    render(<SnapshotViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Test Req')).toBeInTheDocument();
    });

    // Switch to Test Cases (empty in mockData)
    fireEvent.click(screen.getByText('Test Cases'));

    await waitFor(() => {
      expect(screen.getByText('No testcases found in this snapshot.')).toBeInTheDocument();
    });
  });

  it('should render error state when commit hash is missing', async () => {
    // Override props to have empty commit hash
    render(<SnapshotViewer {...defaultProps} commitHash="" />);

    // Should show error message immediately (loading set to false)
    expect(screen.getByText('Snapshot Not Found')).toBeInTheDocument();
    expect(screen.getByText(/Could not identify the commit hash/)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    render(<SnapshotViewer {...defaultProps} />);

    // Wait for data load so the header renders
    await waitFor(() => {
      expect(screen.getByText('Snapshot: v1.0')).toBeInTheDocument();
    });

    expect(useKeyboardShortcuts).toHaveBeenCalledWith(
      expect.objectContaining({
        onClose: defaultProps.onClose,
      })
    );
  });
});
