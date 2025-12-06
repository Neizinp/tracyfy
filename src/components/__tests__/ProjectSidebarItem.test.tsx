import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectSidebarItem } from '../ProjectSidebarItem';
import type { Project } from '../../types';
import { DndContext } from '@dnd-kit/core';

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

  const renderWithDnd = (ui: React.ReactElement) => {
    return render(<DndContext>{ui}</DndContext>);
  };

  it('should render project name', () => {
    renderWithDnd(<ProjectSidebarItem {...defaultProps} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should call onSwitchProject when clicked', () => {
    renderWithDnd(<ProjectSidebarItem {...defaultProps} />);

    const projectButton = screen.getByText('Test Project');
    fireEvent.click(projectButton);

    expect(mockOnSwitchProject).toHaveBeenCalledWith('PROJ-001');
  });

  it('should call onOpenProjectSettings when settings button clicked', () => {
    renderWithDnd(<ProjectSidebarItem {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const settingsButton = buttons.find((btn) => btn.querySelector('svg.lucide-settings'));
    if (settingsButton) fireEvent.click(settingsButton);

    expect(mockOnOpenProjectSettings).toHaveBeenCalledWith(mockProject);
  });

  it('should show active state when isActive is true', () => {
    renderWithDnd(<ProjectSidebarItem {...defaultProps} isActive={true} />);

    // Active project should have specific styling
    const projectButton = screen.getByText('Test Project').closest('button');
    expect(projectButton).toHaveStyle({ fontWeight: 600 });
  });

  it('should show inactive state when isActive is false', () => {
    renderWithDnd(<ProjectSidebarItem {...defaultProps} isActive={false} />);

    const projectButton = screen.getByText('Test Project').closest('button');
    expect(projectButton).toHaveStyle({ fontWeight: 400 });
  });

  it('should prevent propagation when settings button clicked', () => {
    renderWithDnd(<ProjectSidebarItem {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const settingsButton = buttons.find((btn) => btn.querySelector('svg.lucide-settings'));
    if (settingsButton) fireEvent.click(settingsButton);

    // Should open settings, not switch project
    expect(mockOnOpenProjectSettings).toHaveBeenCalledWith(mockProject);
    expect(mockOnSwitchProject).not.toHaveBeenCalled();
  });

  it('should render folder icon', () => {
    const { container } = renderWithDnd(<ProjectSidebarItem {...defaultProps} />);

    const folderIcon = container.querySelector('svg.lucide-folder-open');
    expect(folderIcon).toBeInTheDocument();
  });

  it('should render settings icon', () => {
    const { container } = renderWithDnd(<ProjectSidebarItem {...defaultProps} />);

    const settingsIcon = container.querySelector('svg.lucide-settings');
    expect(settingsIcon).toBeInTheDocument();
  });
});
