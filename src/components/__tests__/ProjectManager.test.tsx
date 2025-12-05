import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectManager } from '../ProjectManager';
import type { Project } from '../../types';

describe('ProjectManager', () => {
  const mockProjects: Project[] = [
    {
      id: 'p1',
      name: 'Project 1',
      description: 'Description 1',
      lastModified: Date.now(),
      requirementIds: [],
      useCaseIds: [],
      testCaseIds: [],
      informationIds: [],
    },
    {
      id: 'p2',
      name: 'Project 2',
      description: 'Description 2',
      lastModified: Date.now(),
      requirementIds: [],
      useCaseIds: [],
      testCaseIds: [],
      informationIds: [],
    },
  ];

  const mockProps = {
    projects: mockProjects,
    currentProjectId: 'p1',
    onSwitchProject: vi.fn(),
    onCreateProject: vi.fn(),
    onDeleteProject: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders project list correctly', () => {
    render(<ProjectManager {...mockProps} />);

    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('calls onSwitchProject when switching projects', () => {
    render(<ProjectManager {...mockProps} />);

    const switchButtons = screen.getAllByText('Switch');
    fireEvent.click(switchButtons[0]);

    expect(mockProps.onSwitchProject).toHaveBeenCalledWith('p2');
  });

  it('shows create form when clicking New Project', () => {
    render(<ProjectManager {...mockProps} />);

    fireEvent.click(screen.getByText('New Project'));

    expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('calls onCreateProject when submitting form', () => {
    render(<ProjectManager {...mockProps} />);

    fireEvent.click(screen.getByText('New Project'));

    fireEvent.change(screen.getByLabelText('Project Name'), { target: { value: 'New Project' } });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'New Description' },
    });

    fireEvent.click(screen.getByText('Create Project'));

    expect(mockProps.onCreateProject).toHaveBeenCalledWith('New Project', 'New Description');
  });

  it('calls onDeleteProject when delete button is clicked and confirmed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    render(<ProjectManager {...mockProps} />);

    const deleteButtons = screen.getAllByTitle('Delete Project');
    fireEvent.click(deleteButtons[0]); // Delete first project (which is current, but UI allows it)

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockProps.onDeleteProject).toHaveBeenCalledWith('p1');

    confirmSpy.mockRestore();
  });
});
