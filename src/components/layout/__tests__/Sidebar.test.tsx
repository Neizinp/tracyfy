import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import type { Project } from '../../../types';

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
  const mockProjects: Project[] = [
    {
      id: 'proj-001',
      name: 'Project One',
      description: 'First project',
      requirementIds: [],
      useCaseIds: [],
      testCaseIds: [],
      informationIds: [],
      riskIds: [],
      lastModified: 1000000,
    },
    {
      id: 'proj-002',
      name: 'Project Two',
      description: 'Second project',
      requirementIds: [],
      useCaseIds: [],
      testCaseIds: [],
      informationIds: [],
      riskIds: [],
      lastModified: 2000000,
    },
  ];

  const defaultProps = {
    projects: mockProjects,
    currentProjectId: 'proj-001',
    onSwitchProject: vi.fn(),
    onCreateProject: vi.fn(),
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

    it('should render Projects section header', () => {
      renderWithRouter(<Sidebar {...defaultProps} />);

      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('should render all projects', () => {
      renderWithRouter(<Sidebar {...defaultProps} />);

      expect(screen.getByText('Project One')).toBeInTheDocument();
      expect(screen.getByText('Project Two')).toBeInTheDocument();
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

  describe('project interactions', () => {
    it('should call onCreateProject when + button is clicked', () => {
      const onCreateProject = vi.fn();
      renderWithRouter(<Sidebar {...defaultProps} onCreateProject={onCreateProject} />);

      const addButton = screen.getByTitle('New Project');
      fireEvent.click(addButton);

      expect(onCreateProject).toHaveBeenCalled();
    });
  });

  describe('empty state', () => {
    it('should render without projects', () => {
      renderWithRouter(<Sidebar {...defaultProps} projects={[]} />);

      expect(screen.getByText('Projects')).toBeInTheDocument();
      // No project names should be present
      expect(screen.queryByText('Project One')).not.toBeInTheDocument();
    });
  });
});
