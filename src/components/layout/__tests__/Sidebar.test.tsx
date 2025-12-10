import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import type { Project } from '../../../types';

// Mock PendingChangesPanel since it has complex dependencies
vi.mock('../../PendingChangesPanel', () => ({
  PendingChangesPanel: () => <div data-testid="pending-changes">Pending Changes Mock</div>,
}));

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
    it('should render ReqTrace logo', () => {
      renderWithRouter(<Sidebar {...defaultProps} />);

      expect(screen.getByText('ReqTrace')).toBeInTheDocument();
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
      expect(screen.getByText('Requirements Tree')).toBeInTheDocument();
      expect(screen.getByText('Detailed View')).toBeInTheDocument();
      expect(screen.getByText('Traceability Matrix')).toBeInTheDocument();
      // These appear in both Views and Repository sections, so use getAllByText
      expect(screen.getAllByText('Use Cases').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Test Cases').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Information').length).toBeGreaterThanOrEqual(1);
    });

    it('should render Repository section', () => {
      renderWithRouter(<Sidebar {...defaultProps} />);

      expect(screen.getByText('Repository')).toBeInTheDocument();
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

  describe('repository tabs', () => {
    it('should call onOpenLibraryTab with requirements when Requirements is clicked', () => {
      const onOpenLibraryTab = vi.fn();
      renderWithRouter(<Sidebar {...defaultProps} onOpenLibraryTab={onOpenLibraryTab} />);

      // Find the Repository section and click Requirements
      const repoButtons = screen.getAllByText('Requirements');
      // Repository section has its own Requirements button
      fireEvent.click(repoButtons[repoButtons.length - 1]);

      expect(onOpenLibraryTab).toHaveBeenCalledWith('requirements');
    });

    it('should call onOpenLibraryTab with usecases when Use Cases is clicked', () => {
      const onOpenLibraryTab = vi.fn();
      renderWithRouter(<Sidebar {...defaultProps} onOpenLibraryTab={onOpenLibraryTab} />);

      // Find all "Use Cases" buttons - views section has one and repository has one
      const useCaseButtons = screen.getAllByText('Use Cases');
      // Click the one in Repository section (last one)
      fireEvent.click(useCaseButtons[useCaseButtons.length - 1]);

      expect(onOpenLibraryTab).toHaveBeenCalledWith('usecases');
    });

    it('should call onOpenLibraryTab with testcases when Test Cases is clicked', () => {
      const onOpenLibraryTab = vi.fn();
      renderWithRouter(<Sidebar {...defaultProps} onOpenLibraryTab={onOpenLibraryTab} />);

      const testCaseButtons = screen.getAllByText('Test Cases');
      fireEvent.click(testCaseButtons[testCaseButtons.length - 1]);

      expect(onOpenLibraryTab).toHaveBeenCalledWith('testcases');
    });

    it('should call onOpenLibraryTab with information when Information is clicked', () => {
      const onOpenLibraryTab = vi.fn();
      renderWithRouter(<Sidebar {...defaultProps} onOpenLibraryTab={onOpenLibraryTab} />);

      const infoButtons = screen.getAllByText('Information');
      fireEvent.click(infoButtons[infoButtons.length - 1]);

      expect(onOpenLibraryTab).toHaveBeenCalledWith('information');
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
