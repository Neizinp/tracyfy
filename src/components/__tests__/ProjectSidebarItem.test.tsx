import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectSidebarItem } from '../ProjectSidebarItem';
import type { Project } from '../../types';

describe('ProjectSidebarItem', () => {
  const mockOnSwitchProject = vi.fn();
  const mockOnOpenProjectSettings = vi.fn();

  const mockProject: Project = {
    id: 'PROJ-001',
    name: 'Test Project',
    description: 'Test Description',
    requirementIds: [],
    useCaseIds: [],
    testCaseIds: [],
    informationIds: [],
    riskIds: [],
    lastModified: 1000000,
  };

  const defaultProps = {
    project: mockProject,
    isActive: false,
    onSwitchProject: mockOnSwitchProject,
    onOpenProjectSettings: mockOnOpenProjectSettings,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render project name', () => {
    render(<ProjectSidebarItem {...defaultProps} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should call onSwitchProject when clicked on inactive project', () => {
    render(<ProjectSidebarItem {...defaultProps} isActive={false} />);

    const projectItem = screen.getByText('Test Project').closest('div');
    if (projectItem) fireEvent.click(projectItem);

    expect(mockOnSwitchProject).toHaveBeenCalledWith('PROJ-001');
    expect(mockOnOpenProjectSettings).not.toHaveBeenCalled();
  });

  it('should call onOpenProjectSettings when clicked on active project', () => {
    render(<ProjectSidebarItem {...defaultProps} isActive={true} />);

    const projectItem = screen.getByText('Test Project').closest('div');
    if (projectItem) fireEvent.click(projectItem);

    expect(mockOnOpenProjectSettings).toHaveBeenCalledWith(mockProject);
    expect(mockOnSwitchProject).not.toHaveBeenCalled();
  });

  it('should show active state styling when isActive is true', () => {
    const { container } = render(<ProjectSidebarItem {...defaultProps} isActive={true} />);

    // Active project should have hover background
    const projectItem = container.firstChild as HTMLElement;
    expect(projectItem).toHaveStyle({ fontWeight: 600 });
  });

  it('should show inactive state styling when isActive is false', () => {
    const { container } = render(<ProjectSidebarItem {...defaultProps} isActive={false} />);

    const projectItem = container.firstChild as HTMLElement;
    expect(projectItem).toHaveStyle({ fontWeight: 400 });
  });

  it('should render folder icon', () => {
    const { container } = render(<ProjectSidebarItem {...defaultProps} />);

    const folderIcon = container.querySelector('svg.lucide-folder-open');
    expect(folderIcon).toBeInTheDocument();
  });
});
