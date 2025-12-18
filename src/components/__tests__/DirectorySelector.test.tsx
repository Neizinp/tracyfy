import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DirectorySelector } from '../DirectorySelector';

// Mock the useFileSystem hook
vi.mock('../../app/providers/FileSystemProvider', async () => {
  const actual = await vi.importActual('../../app/providers/FileSystemProvider');
  return {
    ...actual,
    useFileSystem: vi.fn(),
  };
});

import { useFileSystem } from '../../app/providers/FileSystemProvider';

// Type for the mock return value
type MockFileSystemContext = ReturnType<typeof useFileSystem>;

describe('DirectorySelector', () => {
  const mockSelectDirectory = vi.fn();
  const mockOnReady = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when not ready', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      isReady: false,
      isLoading: false,
      error: null,
      selectDirectory: mockSelectDirectory,
      directoryName: null,
      isApiSupported: true,
    } as unknown as MockFileSystemContext);

    render(<DirectorySelector />);

    expect(screen.getByText('Select Project Directory')).toBeInTheDocument();
  });

  it('should not render when ready', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      isReady: true,
      isLoading: false,
      error: null,
      selectDirectory: mockSelectDirectory,
      directoryName: 'test-dir',
    } as unknown as MockFileSystemContext);

    render(<DirectorySelector />);

    expect(screen.queryByText('Select Project Directory')).not.toBeInTheDocument();
  });

  it('should call onReady when ready', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      isReady: true,
      isLoading: false,
      error: null,
      selectDirectory: mockSelectDirectory,
      directoryName: 'test-dir',
    } as unknown as MockFileSystemContext);

    render(<DirectorySelector onReady={mockOnReady} />);

    expect(mockOnReady).toHaveBeenCalled();
  });

  it('should display error message when error exists', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      isReady: false,
      isLoading: false,
      error: 'Failed to access directory',
      selectDirectory: mockSelectDirectory,
      directoryName: null,
    } as unknown as MockFileSystemContext);

    render(<DirectorySelector />);

    expect(screen.getByText(/Failed to access directory/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      isReady: false,
      isLoading: true,
      error: null,
      selectDirectory: mockSelectDirectory,
      directoryName: null,
      isApiSupported: true,
    } as unknown as MockFileSystemContext);

    const { container } = render(<DirectorySelector />);

    // Loading spinner should be present - just a spinner icon, no other content
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // The "Select Project Directory" text should NOT be present since it's showing spinner-only UI
    expect(screen.queryByText('Select Project Directory')).not.toBeInTheDocument();
  });

  it('should call selectDirectory when button clicked', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      isReady: false,
      isLoading: false,
      error: null,
      selectDirectory: mockSelectDirectory,
      directoryName: null,
      isApiSupported: true,
    } as unknown as MockFileSystemContext);

    render(<DirectorySelector />);

    const selectButton = screen.getByText(/Choose Folder/i);
    fireEvent.click(selectButton);

    expect(mockSelectDirectory).toHaveBeenCalled();
  });

  it('should display instructions', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      isReady: false,
      isLoading: false,
      error: null,
      selectDirectory: mockSelectDirectory,
      directoryName: null,
      isApiSupported: true,
    } as unknown as MockFileSystemContext);

    render(<DirectorySelector />);

    expect(screen.getByText(/Choose a folder to store/i)).toBeInTheDocument();
  });

  it('should render folder icon', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      isReady: false,
      isLoading: false,
      error: null,
      selectDirectory: mockSelectDirectory,
      directoryName: null,
      isApiSupported: true,
    } as unknown as MockFileSystemContext);

    const { container } = render(<DirectorySelector />);

    const folderIcon = container.querySelector('svg.lucide-folder');
    expect(folderIcon).toBeInTheDocument();
  });

  it('should hide button when File System Access API is not supported', () => {
    vi.mocked(useFileSystem).mockReturnValue({
      isReady: false,
      isLoading: false,
      error: 'File System Access API is not supported. Please use Chrome, Edge, or Opera.',
      selectDirectory: mockSelectDirectory,
      directoryName: null,
      isApiSupported: false,
    } as unknown as MockFileSystemContext);

    render(<DirectorySelector />);

    // The error message should be displayed
    expect(screen.getByText(/File System Access API is not supported/i)).toBeInTheDocument();
    // But the button should NOT be displayed
    expect(screen.queryByText(/Choose Folder/i)).not.toBeInTheDocument();
    // And the tip should NOT be displayed
    expect(
      screen.queryByText(/Tip: You can use an existing Git repository/i)
    ).not.toBeInTheDocument();
  });
});
