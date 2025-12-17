import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalLibraryPanel } from '../GlobalLibraryPanel';
import type { Requirement, UseCase, TestCase, Information, Project } from '../../types';

describe('GlobalLibraryPanel', () => {
  const mockOnClose = vi.fn();
  const mockOnToggleSelect = vi.fn();

  const mockProject: Project = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'Test Description',
    requirementIds: ['REQ-001'],
    useCaseIds: ['UC-001'],
    testCaseIds: [],
    informationIds: [],
    riskIds: [],
    lastModified: Date.now(),
  };

  const mockRequirements: Requirement[] = [
    {
      id: 'REQ-001',
      title: 'Test Requirement',
      description: 'Test description',
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
      title: 'Another Requirement',
      description: 'Another description',
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
      <GlobalLibraryPanel
        isOpen={false}
        onClose={mockOnClose}
        requirements={mockRequirements}
        useCases={mockUseCases}
        testCases={mockTestCases}
        information={mockInformation}
        risks={[]}
        projects={[mockProject]}
        selectedItems={new Set()}
        onToggleSelect={mockOnToggleSelect}
      />
    );
    expect(container.textContent).toBe('');
  });

  it('should render open state with artifacts listed', () => {
    render(
      <GlobalLibraryPanel
        isOpen={true}
        onClose={mockOnClose}
        requirements={mockRequirements}
        useCases={mockUseCases}
        testCases={mockTestCases}
        information={mockInformation}
        risks={[]}
        projects={[mockProject]}
        selectedItems={new Set()}
        onToggleSelect={mockOnToggleSelect}
      />
    );

    expect(screen.getByText('Global Library')).toBeInTheDocument();
    expect(screen.getByText('REQ-001')).toBeInTheDocument();
    expect(screen.getByText('Test Requirement')).toBeInTheDocument();
  });

  it('should display tab buttons for different artifact types', () => {
    render(
      <GlobalLibraryPanel
        isOpen={true}
        onClose={mockOnClose}
        requirements={mockRequirements}
        useCases={mockUseCases}
        testCases={mockTestCases}
        information={mockInformation}
        risks={[]}
        projects={[mockProject]}
        selectedItems={new Set()}
        onToggleSelect={mockOnToggleSelect}
      />
    );

    // Check tab labels are present
    expect(screen.getByText('Reqs')).toBeInTheDocument();
    expect(screen.getByText('UC')).toBeInTheDocument();
    expect(screen.getByText('TC')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('should call onToggleSelect when clicking an item', () => {
    render(
      <GlobalLibraryPanel
        isOpen={true}
        onClose={mockOnClose}
        requirements={mockRequirements}
        useCases={mockUseCases}
        testCases={mockTestCases}
        information={mockInformation}
        risks={[]}
        projects={[mockProject]}
        selectedItems={new Set()}
        onToggleSelect={mockOnToggleSelect}
      />
    );

    // Click on an item by its title
    fireEvent.click(screen.getByText('Test Requirement'));
    expect(mockOnToggleSelect).toHaveBeenCalledWith('REQ-001');
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <GlobalLibraryPanel
        isOpen={true}
        onClose={mockOnClose}
        requirements={mockRequirements}
        useCases={mockUseCases}
        testCases={mockTestCases}
        information={mockInformation}
        risks={[]}
        projects={[mockProject]}
        selectedItems={new Set()}
        onToggleSelect={mockOnToggleSelect}
      />
    );

    fireEvent.click(screen.getByText('×'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should filter items when searching', () => {
    render(
      <GlobalLibraryPanel
        isOpen={true}
        onClose={mockOnClose}
        requirements={mockRequirements}
        useCases={mockUseCases}
        testCases={mockTestCases}
        information={mockInformation}
        risks={[]}
        projects={[mockProject]}
        selectedItems={new Set()}
        onToggleSelect={mockOnToggleSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search library...');
    fireEvent.change(searchInput, { target: { value: 'REQ-002' } });

    expect(screen.getByText('REQ-002')).toBeInTheDocument();
    expect(screen.queryByText('REQ-001')).not.toBeInTheDocument();
  });

  it('should show Select All and Deselect All buttons', () => {
    render(
      <GlobalLibraryPanel
        isOpen={true}
        onClose={mockOnClose}
        requirements={mockRequirements}
        useCases={mockUseCases}
        testCases={mockTestCases}
        information={mockInformation}
        risks={[]}
        projects={[mockProject]}
        selectedItems={new Set()}
        onToggleSelect={mockOnToggleSelect}
      />
    );

    expect(screen.getByText('Select All')).toBeInTheDocument();
    expect(screen.getByText('Deselect All')).toBeInTheDocument();
  });

  it('should show Add to Project button when items are selected', () => {
    render(
      <GlobalLibraryPanel
        isOpen={true}
        onClose={mockOnClose}
        requirements={mockRequirements}
        useCases={mockUseCases}
        testCases={mockTestCases}
        information={mockInformation}
        risks={[]}
        projects={[mockProject]}
        selectedItems={new Set(['REQ-001', 'REQ-002'])}
        onToggleSelect={mockOnToggleSelect}
      />
    );

    expect(screen.getByText(/Add 2 Items to Project/)).toBeInTheDocument();
  });
});
