import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';

// Mock PendingChangesPanel since it has complex dependencies
vi.mock('../../PendingChangesPanel', () => ({
  PendingChangesPanel: () => <div data-testid="pending-changes">Pending Changes Mock</div>,
}));

// Mock useFileSystem hook
const mockPush = vi.fn();
const mockPull = vi.fn();
const mockHasRemote = vi.fn(() => Promise.resolve(false));

vi.mock('../../../app/providers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../app/providers')>();
  return {
    ...actual,
    useFileSystem: vi.fn(() => ({
      isReady: true,
      push: mockPush,
      pull: mockPull,
      hasRemote: mockHasRemote,
    })),
  };
});

// Wrap component with router for NavLink
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Sidebar', () => {
  const defaultProps = {
    projectName: 'Door Controller',
    onOpenProjectSettings: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render Tracyfy logo', () => {
      renderWithRouter(<Sidebar {...defaultProps} />);

      expect(screen.getByText('Tracyfy')).toBeInTheDocument();
    });

    it('shows the project name and opens its settings', () => {
      const onOpenProjectSettings = vi.fn();
      renderWithRouter(<Sidebar {...defaultProps} onOpenProjectSettings={onOpenProjectSettings} />);

      fireEvent.click(screen.getByRole('button', { name: 'Project settings: Door Controller' }));
      expect(onOpenProjectSettings).toHaveBeenCalled();
    });

    it('should render Pending Changes section', () => {
      renderWithRouter(<Sidebar {...defaultProps} />);

      expect(screen.getByText('Pending Changes')).toBeInTheDocument();
      expect(screen.getByTestId('pending-changes')).toBeInTheDocument();
    });

    it('should render Views section with all views', () => {
      renderWithRouter(<Sidebar {...defaultProps} />);

      expect(screen.getByText('Views')).toBeInTheDocument();
      expect(screen.getByText('Traceability Dashboard')).toBeInTheDocument();
      expect(screen.getAllByText('Requirements').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Use Cases').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Test Cases').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Information').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Risks').length).toBeGreaterThanOrEqual(1);
    });

    it('links each artifact type to its page exactly once', () => {
      renderWithRouter(<Sidebar {...defaultProps} />);

      const pages: [string, string][] = [
        ['Requirements', '/requirements'],
        ['Use Cases', '/use-cases'],
        ['Test Cases', '/test-cases'],
        ['Information', '/information'],
        ['Risks', '/risks'],
      ];
      pages.forEach(([name, href]) => {
        const links = screen.getAllByRole('link', { name });
        expect(links).toHaveLength(1);
        expect(links[0]).toHaveAttribute('href', href);
      });
    });
  });

  describe('demo data', () => {
    it('offers demo data only when the parent passes a handler (empty project)', () => {
      const onLoadDemoData = vi.fn();
      const { unmount } = renderWithRouter(
        <Sidebar {...defaultProps} onLoadDemoData={onLoadDemoData} />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Load demo data' }));
      expect(onLoadDemoData).toHaveBeenCalled();
      unmount();

      renderWithRouter(<Sidebar {...defaultProps} />);
      expect(screen.queryByRole('button', { name: 'Load demo data' })).not.toBeInTheDocument();
    });
  });
});
