import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalLibraryModal } from '../GlobalLibraryModal';
import type { Project, Requirement, UseCase, TestCase, Information } from '../../types';

describe('GlobalLibraryModal', () => {
  const mockOnClose = vi.fn();
  const mockOnAddToProject = vi.fn();

  const mockProject: Project = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'Test Description',
    requirementIds: ['REQ-001'],
    useCaseIds: [],
    testCaseIds: [],
    informationIds: [],
    lastModified: Date.now(),
  };

  const mockRequirements: Requirement[] = [
    {
      id: 'REQ-001',
      title: 'Existing Requirement',
      description: 'Already in project',
      text: '',
      rationale: '',
      status: 'draft',
      priority: 'medium',
      revision: '01',
      dateCreated: Date.now(),
      lastModified: Date.now(),
    },
    {
      id: 'REQ-002',
      title: 'Available Requirement',
      description: 'Not in any project',
      text: '',
      rationale: '',
      status: 'draft',
      priority: 'high',
      revision: '01',
      dateCreated: Date.now(),
      lastModified: Date.now(),
    },
  ];

  const mockUseCases: UseCase[] = [
    {
      id: 'UC-001',
      title: 'Test Use Case',
      description: 'Use case description',
      actor: 'User',
      preconditions: '',
      postconditions: '',
      mainFlow: '',
      priority: 'medium',
      status: 'draft',
      revision: '01',
      lastModified: Date.now(),
    },
  ];

  const mockTestCases: TestCase[] = [
    {
      id: 'TC-001',
      title: 'Test Case',
      description: 'Test case description',
      requirementIds: [],
      status: 'draft',
      priority: 'medium',
      revision: '01',
      dateCreated: Date.now(),
      lastModified: Date.now(),
    },
  ];

  const mockInformation: Information[] = [
    {
      id: 'INF-001',
      title: 'Test Info',
      content: 'Info content',
      type: 'note',
      revision: '01',
      dateCreated: Date.now(),
      lastModified: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <GlobalLibraryModal
        isOpen={false}
        onClose={mockOnClose}
        projects={[mockProject]}
        currentProjectId="proj-1"
        globalRequirements={mockRequirements}
        globalUseCases={mockUseCases}
        globalTestCases={mockTestCases}
        globalInformation={mockInformation}
        onAddToProject={mockOnAddToProject}
      />
    );
    expect(container.textContent).toBe('');
  });

  it('should render when open with artifacts displayed', () => {
    render(
      <GlobalLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        projects={[mockProject]}
        currentProjectId="proj-1"
        globalRequirements={mockRequirements}
        globalUseCases={mockUseCases}
        globalTestCases={mockTestCases}
        globalInformation={mockInformation}
        onAddToProject={mockOnAddToProject}
      />
    );

    expect(screen.getByText('Global Artifact Library')).toBeInTheDocument();
    expect(screen.getByText('REQ-001')).toBeInTheDocument();
    expect(screen.getByText('REQ-002')).toBeInTheDocument();
    expect(screen.getByText('UC-001')).toBeInTheDocument();
    expect(screen.getByText('TC-001')).toBeInTheDocument();
    expect(screen.getByText('INF-001')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <GlobalLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        projects={[mockProject]}
        currentProjectId="proj-1"
        globalRequirements={mockRequirements}
        globalUseCases={mockUseCases}
        globalTestCases={mockTestCases}
        globalInformation={mockInformation}
        onAddToProject={mockOnAddToProject}
      />
    );

    fireEvent.click(screen.getByText('×'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(
      <GlobalLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        projects={[mockProject]}
        currentProjectId="proj-1"
        globalRequirements={mockRequirements}
        globalUseCases={mockUseCases}
        globalTestCases={mockTestCases}
        globalInformation={mockInformation}
        onAddToProject={mockOnAddToProject}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should filter artifacts by search query', () => {
    render(
      <GlobalLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        projects={[mockProject]}
        currentProjectId="proj-1"
        globalRequirements={mockRequirements}
        globalUseCases={mockUseCases}
        globalTestCases={mockTestCases}
        globalInformation={mockInformation}
        onAddToProject={mockOnAddToProject}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by ID, title, or description...');
    fireEvent.change(searchInput, { target: { value: 'REQ-002' } });

    expect(screen.getByText('REQ-002')).toBeInTheDocument();
    expect(screen.queryByText('REQ-001')).not.toBeInTheDocument();
  });

  it('should call onAddToProject with selected artifacts', () => {
    render(
      <GlobalLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        projects={[mockProject]}
        currentProjectId="proj-1"
        globalRequirements={mockRequirements}
        globalUseCases={mockUseCases}
        globalTestCases={mockTestCases}
        globalInformation={mockInformation}
        onAddToProject={mockOnAddToProject}
      />
    );

    // Find and click the checkbox for REQ-002 (not already in project)
    const checkboxes = screen.getAllByRole('checkbox');
    // REQ-001 should be disabled (already in project), REQ-002 should be enabled
    const enabledCheckboxes = checkboxes.filter((cb) => !cb.hasAttribute('disabled'));
    expect(enabledCheckboxes.length).toBeGreaterThan(0);

    // Click on REQ-002 checkbox (second requirement checkbox)
    fireEvent.click(enabledCheckboxes[0]);

    // Click Add to Project button
    fireEvent.click(screen.getByText('Add to Project'));

    expect(mockOnAddToProject).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable Add button when no artifacts are selected', () => {
    render(
      <GlobalLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        projects={[mockProject]}
        currentProjectId="proj-1"
        globalRequirements={mockRequirements}
        globalUseCases={mockUseCases}
        globalTestCases={mockTestCases}
        globalInformation={mockInformation}
        onAddToProject={mockOnAddToProject}
      />
    );

    const addButton = screen.getByText('Add to Project').closest('button');
    expect(addButton).toBeDisabled();
  });

  it('should show filter mode buttons', () => {
    render(
      <GlobalLibraryModal
        isOpen={true}
        onClose={mockOnClose}
        projects={[mockProject]}
        currentProjectId="proj-1"
        globalRequirements={mockRequirements}
        globalUseCases={mockUseCases}
        globalTestCases={mockTestCases}
        globalInformation={mockInformation}
        onAddToProject={mockOnAddToProject}
      />
    );

    expect(screen.getByText('All Artifacts')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('By Project')).toBeInTheDocument();
  });
});
