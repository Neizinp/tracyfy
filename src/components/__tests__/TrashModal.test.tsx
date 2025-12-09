import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrashModal } from '../TrashModal';
import type { Requirement, UseCase, Information } from '../../types';

describe('TrashModal', () => {
  const mockOnClose = vi.fn();
  const mockOnRestoreRequirement = vi.fn();
  const mockOnRestoreUseCase = vi.fn();
  const mockOnRestoreInformation = vi.fn();
  const mockOnPermanentDeleteRequirement = vi.fn();
  const mockOnPermanentDeleteUseCase = vi.fn();
  const mockOnPermanentDeleteInformation = vi.fn();

  const mockDeletedReq: Requirement = {
    id: 'REQ-001',
    title: 'Deleted Requirement',
    description: 'This is deleted',
    text: '',
    rationale: '',
    parentIds: [],
    status: 'draft',
    priority: 'medium',
    dateCreated: 1000000,
    lastModified: 1000000,
    isDeleted: true,
    revision: '01',
  };

  const mockDeletedUseCase: UseCase = {
    id: 'UC-001',
    title: 'Deleted Use Case',
    description: 'This is deleted',
    actor: '',
    preconditions: '',
    mainFlow: '',
    postconditions: '',
    priority: 'medium',
    status: 'draft',
    lastModified: 1000000,
    isDeleted: true,
    revision: '01',
  };

  const mockDeletedInfo: Information = {
    id: 'INFO-001',
    title: 'Deleted Information',
    content: 'This is deleted',
    type: 'note',
    dateCreated: 1000000,
    lastModified: 1000000,
    isDeleted: true,
    revision: '01',
  };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    deletedRequirements: [mockDeletedReq],
    deletedUseCases: [mockDeletedUseCase],
    deletedInformation: [mockDeletedInfo],
    onRestoreRequirement: mockOnRestoreRequirement,
    onRestoreUseCase: mockOnRestoreUseCase,
    onRestoreInformation: mockOnRestoreInformation,
    onPermanentDeleteRequirement: mockOnPermanentDeleteRequirement,
    onPermanentDeleteUseCase: mockOnPermanentDeleteUseCase,
    onPermanentDeleteInformation: mockOnPermanentDeleteInformation,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<TrashModal {...defaultProps} />);

    expect(screen.getByText(/Trash Bin/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<TrashModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/Trash Bin/i)).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<TrashModal {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find((btn) => btn.querySelector('svg.lucide-x'));
    fireEvent.click(closeButton!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show all deleted items in a single list', () => {
    render(<TrashModal {...defaultProps} />);

    // All items should be visible without needing to switch tabs
    expect(screen.getByText('Deleted Requirement')).toBeInTheDocument();
    expect(screen.getByText('Deleted Use Case')).toBeInTheDocument();
    expect(screen.getByText('Deleted Information')).toBeInTheDocument();
  });

  it('should call restore handler when restore button is clicked', () => {
    render(<TrashModal {...defaultProps} />);

    const restoreButtons = screen.getAllByText(/Restore/i);
    fireEvent.click(restoreButtons[0]);

    // One of the restore handlers should have been called
    expect(
      mockOnRestoreRequirement.mock.calls.length +
        mockOnRestoreUseCase.mock.calls.length +
        mockOnRestoreInformation.mock.calls.length
    ).toBe(1);
  });

  it('should call onPermanentDeleteRequirement when permanent delete is confirmed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<TrashModal {...defaultProps} />);

    const deleteButtons = screen.getAllByText(/Delete Forever/i);
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    // The first delete button should correspond to one of the items
    expect(
      mockOnPermanentDeleteRequirement.mock.calls.length +
        mockOnPermanentDeleteUseCase.mock.calls.length +
        mockOnPermanentDeleteInformation.mock.calls.length
    ).toBe(1);

    confirmSpy.mockRestore();
  });

  it('should show empty state when no deleted items', () => {
    render(
      <TrashModal
        {...defaultProps}
        deletedRequirements={[]}
        deletedUseCases={[]}
        deletedInformation={[]}
      />
    );

    expect(screen.getByText(/Trash is empty/i)).toBeInTheDocument();
  });

  it('should display item count in header', () => {
    render(<TrashModal {...defaultProps} />);

    expect(screen.getByText(/Trash Bin \(3\)/i)).toBeInTheDocument();
  });

  it('should display formatted date for deleted items', () => {
    render(<TrashModal {...defaultProps} />);

    // Multiple items have "Deleted:" text
    const deletedTexts = screen.getAllByText(/Deleted:/i);
    expect(deletedTexts.length).toBeGreaterThan(0);
  });
});
