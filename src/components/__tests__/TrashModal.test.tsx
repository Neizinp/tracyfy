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

    expect(screen.getByText('Trash Bin')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<TrashModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Trash Bin')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<TrashModal {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find((btn) => btn.querySelector('svg.lucide-x'));
    fireEvent.click(closeButton!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show requirements tab by default', () => {
    render(<TrashModal {...defaultProps} />);

    expect(screen.getByText('Deleted Requirement')).toBeInTheDocument();
  });

  it('should switch to use cases tab', () => {
    render(<TrashModal {...defaultProps} />);

    const useCasesTab = screen.getByText(/Use Cases/i);
    fireEvent.click(useCasesTab);

    expect(screen.getByText('Deleted Use Case')).toBeInTheDocument();
  });

  it('should switch to information tab', () => {
    render(<TrashModal {...defaultProps} />);

    const informationTab = screen.getByText(/Information/i);
    fireEvent.click(informationTab);

    expect(screen.getByText('Deleted Information')).toBeInTheDocument();
  });

  it('should call onRestoreRequirement when restore button is clicked', () => {
    render(<TrashModal {...defaultProps} />);

    const restoreButtons = screen.getAllByText(/Restore/i);
    fireEvent.click(restoreButtons[0]);

    expect(mockOnRestoreRequirement).toHaveBeenCalledWith('REQ-001');
  });

  it('should call onPermanentDeleteRequirement when permanent delete is confirmed', () => {
    // Mock window.confirm to return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<TrashModal {...defaultProps} />);

    const deleteButtons = screen.getAllByText(/Delete Forever/i);
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockOnPermanentDeleteRequirement).toHaveBeenCalledWith('REQ-001');

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

    expect(screen.getByText(/No deleted requirements/i)).toBeInTheDocument();
  });

  it('should display item count in tab', () => {
    render(<TrashModal {...defaultProps} />);

    expect(screen.getByText(/Requirements \(1\)/i)).toBeInTheDocument();
  });

  it('should display formatted date', () => {
    render(<TrashModal {...defaultProps} />);

    // The formatDateTime function should format the timestamp
    expect(screen.getByText(/Deleted:/i)).toBeInTheDocument();
  });
});
