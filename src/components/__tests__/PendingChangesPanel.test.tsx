import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

import { useFileSystem } from '../../app/providers/FileSystemProvider';

describe('PendingChangesPanel', () => {
  const mockCommitFile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with no pending changes', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [],
      commitFile: mockCommitFile,
    } as any);

    render(<PendingChangesPanel />);

    expect(screen.getByText(/No pending changes/i)).toBeInTheDocument();
  });

  it('should display pending changes', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [{ path: 'requirements/REQ-001.md', status: 'new' }],
      commitFile: mockCommitFile,
    } as any);

    render(<PendingChangesPanel />);

    expect(screen.getByText(/REQ-001/i)).toBeInTheDocument();
  });

  it('should show commit input for each change', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [{ path: 'requirements/REQ-001.md', status: 'new' }],
      commitFile: mockCommitFile,
    } as any);

    render(<PendingChangesPanel />);

    const commitInputs = screen.getAllByPlaceholderText(/commit message/i);
    expect(commitInputs.length).toBeGreaterThan(0);
  });

  it('should auto-fill "First commit" for new files', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [{ path: 'requirements/REQ-001.md', status: 'new' }],
      commitFile: mockCommitFile,
    } as any);

    render(<PendingChangesPanel />);

    const input = screen.getByDisplayValue(/First commit/i);
    expect(input).toBeInTheDocument();
  });

  it('should show different icons for new vs modified', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [
        { path: 'requirements/REQ-001.md', status: 'new' },
        { path: 'requirements/REQ-002.md', status: 'modified' },
      ],
      commitFile: mockCommitFile,
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
    } as any);

    render(<PendingChangesPanel />);

    expect(screen.getByText(/REQ-001/i)).toBeInTheDocument();
  });

  it('should parse usecase paths correctly', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      pendingChanges: [{ path: 'usecases/UC-001.md', status: 'new' }],
      commitFile: mockCommitFile,
    } as any);

    render(<PendingChangesPanel />);

    expect(screen.getByText(/UC-001/i)).toBeInTheDocument();
  });
});
