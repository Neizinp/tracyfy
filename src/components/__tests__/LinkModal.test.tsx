import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LinkModal } from '../LinkModal';
import type { Requirement, Project, UseCase, TestCase, Information } from '../../types';

describe('LinkModal', () => {
  const mockOnClose = vi.fn();
  const mockOnAddLink = vi.fn();

  const mockProject: Project = {
    id: 'PROJ-001',
    name: 'Test Project',
    description: '',
    requirementIds: ['REQ-001', 'REQ-002'],
    useCaseIds: ['UC-001'],
    testCaseIds: ['TC-001'],
    informationIds: [],
    lastModified: 1000000,
  };

  const mockReq1: Requirement = {
    id: 'REQ-001',
    title: 'Source Requirement',
    description: 'Source',
    text: '',
    rationale: '',
    parentIds: [],
    status: 'draft',
    priority: 'medium',
    dateCreated: 1000000,
    lastModified: 1000000,
    isDeleted: false,
    revision: '01',
  };

  const mockReq2: Requirement = {
    id: 'REQ-002',
    title: 'Target Requirement',
    description: 'Target',
    text: '',
    rationale: '',
    parentIds: [],
    status: 'draft',
    priority: 'medium',
    dateCreated: 1000000,
    lastModified: 1000000,
    isDeleted: false,
    revision: '01',
  };

  const mockUseCase: UseCase = {
    id: 'UC-001',
    title: 'Test Use Case',
    description: 'Use case',
    actor: '',
    preconditions: '',
    mainFlow: '',
    postconditions: '',
    priority: 'medium',
    status: 'draft',
    lastModified: 1000000,
    isDeleted: false,
    revision: '01',
  };

  const mockTestCase: TestCase = {
    id: 'TC-001',
    title: 'Test Test Case',
    description: 'Test case',
    status: 'draft',
    priority: 'medium',
    requirementIds: [],
    author: '',
    dateCreated: 1000000,
    lastModified: 1000000,
    isDeleted: false,
    revision: '01',
  };

  const mockInformation: Information = {
    id: 'INFO-001',
    title: 'Test Info',
    content: 'Info content',
    type: 'note',
    dateCreated: 1000000,
    lastModified: 1000000,
    revision: '01',
  };

  const defaultProps = {
    isOpen: true,
    sourceArtifactId: 'REQ-001',
    sourceArtifactType: 'requirement' as const,
    projects: [mockProject],
    currentProjectId: 'PROJ-001',
    globalRequirements: [mockReq1, mockReq2],
    globalUseCases: [mockUseCase],
    globalTestCases: [mockTestCase],
    globalInformation: [mockInformation],
    onClose: mockOnClose,
    onAddLink: mockOnAddLink,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<LinkModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /Create Link/i })).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<LinkModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/Create Link/i)).not.toBeInTheDocument();
  });

  it('should not render without sourceArtifactId', () => {
    render(<LinkModal {...defaultProps} sourceArtifactId={null} />);

    expect(screen.queryByText(/Create Link/i)).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<LinkModal {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find((btn) => btn.querySelector('svg'));
    if (closeButton) fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should filter out source requirement from target list', () => {
    render(<LinkModal {...defaultProps} />);

    // Should see REQ-002 but not REQ-001 in the target list
    expect(screen.getByText('Target Requirement')).toBeInTheDocument();
    expect(screen.getByText('REQ-002')).toBeInTheDocument();
  });

  it('should filter artifacts by search query', () => {
    render(<LinkModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'Target' } });

    expect(screen.getByText('Target Requirement')).toBeInTheDocument();
  });

  it('should show use cases when use case type is selected', () => {
    render(<LinkModal {...defaultProps} />);

    // Button now says "UC" instead of "Use Case"
    const ucButton = screen.getByText('UC');
    fireEvent.click(ucButton);

    expect(screen.getByText('Test Use Case')).toBeInTheDocument();
  });

  it('should show test cases when test case type is selected', () => {
    render(<LinkModal {...defaultProps} />);

    // Button now says "TC" instead of "Test Case"
    const tcButton = screen.getByText('TC');
    fireEvent.click(tcButton);

    expect(screen.getByText('Test Test Case')).toBeInTheDocument();
  });

  it('should submit link with correct data', () => {
    render(<LinkModal {...defaultProps} />);

    // Select a target
    const targetCard = screen.getByText('Target Requirement').closest('div');
    if (targetCard) fireEvent.click(targetCard);

    // Submit form - use getAllByRole and find the submit button
    const buttons = screen.getAllByRole('button');
    const submitButton = buttons.find(
      (btn) => btn.textContent?.includes('Create Link') && btn.getAttribute('type') === 'submit'
    );
    if (submitButton) fireEvent.click(submitButton);

    expect(mockOnAddLink).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 'REQ-002',
        type: 'relates_to',
      })
    );
  });

  it('should reset form when reopened', () => {
    const { rerender } = render(<LinkModal {...defaultProps} />);

    // Change some state
    const searchInput = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Close and reopen
    rerender(<LinkModal {...defaultProps} isOpen={false} />);
    rerender(<LinkModal {...defaultProps} isOpen={true} />);

    const searchInputAfter = screen.getByPlaceholderText(/Search/i) as HTMLInputElement;
    expect(searchInputAfter.value).toBe('');
  });
});
