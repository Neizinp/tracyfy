import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { DirectorySelector } from '../DirectorySelector';
import { fileSystemService } from '../../services/fileSystemService';
import { renderWithStore } from '../../test/renderWithStore';
import type { AppState } from '../../state';

const selectFolder = vi.fn(async () => {});

/** Render with the folder state the selector reads from the store */
const renderSelector = (state: Partial<AppState>, onReady?: () => void) =>
  renderWithStore(<DirectorySelector onReady={onReady} />, {
    state: {
      isReady: false,
      isLoading: false,
      folderError: null,
      directoryName: null,
      selectFolder,
      ...state,
    },
  });

describe('DirectorySelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(fileSystemService, 'isSupported').mockReturnValue(true);
  });

  it('should render when not ready', () => {
    renderSelector({});
    expect(screen.getByText('Select Project Directory')).toBeInTheDocument();
  });

  it('should not render when ready', () => {
    renderSelector({ isReady: true, directoryName: 'test-dir' });
    expect(screen.queryByText('Select Project Directory')).not.toBeInTheDocument();
  });

  it('should call onReady when ready', () => {
    const onReady = vi.fn();
    renderSelector({ isReady: true, directoryName: 'test-dir' }, onReady);
    expect(onReady).toHaveBeenCalled();
  });

  it('should display error message when error exists', () => {
    renderSelector({ folderError: 'Failed to access directory' });
    expect(screen.getByText(/Failed to access directory/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const { container } = renderSelector({ isLoading: true });

    // Loading spinner should be present - just a spinner icon, no other content
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByText('Select Project Directory')).not.toBeInTheDocument();
  });

  it('should open the folder picker when the button is clicked', () => {
    renderSelector({});
    fireEvent.click(screen.getByText(/Choose Folder/i));
    expect(selectFolder).toHaveBeenCalled();
  });

  it('should display instructions', () => {
    renderSelector({});
    expect(screen.getByText(/Choose a folder to store/i)).toBeInTheDocument();
  });

  it('should render folder icon', () => {
    const { container } = renderSelector({});
    expect(container.querySelector('svg.lucide-folder')).toBeInTheDocument();
  });

  it('should hide button when File System Access API is not supported', () => {
    vi.spyOn(fileSystemService, 'isSupported').mockReturnValue(false);
    renderSelector({
      folderError: 'File System Access API is not supported. Please use Chrome, Edge, or Opera.',
    });

    expect(screen.getByText(/File System Access API is not supported/i)).toBeInTheDocument();
    expect(screen.queryByText(/Choose Folder/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Tip: You can use an existing Git repository/i)
    ).not.toBeInTheDocument();
  });
});
