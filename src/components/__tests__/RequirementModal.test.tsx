import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequirementModal } from '../RequirementModal';
import { useRequirementForm } from '../../hooks/useRequirementForm';
import type { Requirement } from '../../types';

// Mock everything to solve the OOM/hang issues
vi.mock('../../app/providers', () => ({
  UIProvider: ({ children }: any) => <>{children}</>,
  useUI: vi.fn(() => ({
    setIsLinkModalOpen: vi.fn(),
    setLinkSourceId: vi.fn(),
    setLinkSourceType: vi.fn(),
  })),
}));

vi.mock('../../hooks/useLinkService', () => ({
  useLinkService: vi.fn(() => ({
    outgoingLinks: [],
    incomingLinks: [],
    loading: false,
  })),
}));

vi.mock('../../hooks/useCustomAttributes', () => ({
  useCustomAttributes: vi.fn(() => ({
    definitions: [],
    loading: false,
  })),
}));

vi.mock('../../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('../../hooks/useRequirementForm', () => ({
  useRequirementForm: vi.fn(),
}));

vi.mock('../BaseArtifactModal', () => ({
  BaseArtifactModal: ({
    children,
    title,
    onSubmit,
    submitLabel,
    onTabChange,
    tabs,
    onClose,
    footerActions,
  }: any) => (
    <div>
      <h2>{title}</h2>
      <div data-testid="tabs">
        {tabs?.map((t: any) => (
          <button key={t.id} onClick={() => onTabChange?.(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <form
        role="form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.(e);
        }}
      >
        {children}
        <button type="submit">{submitLabel}</button>
      </form>
      <button type="button" onClick={onClose}>
        Cancel
      </button>
      {footerActions}
    </div>
  ),
}));

vi.mock('../RevisionHistoryTab', () => ({
  RevisionHistoryTab: () => <div data-testid="revision-history">Revision History</div>,
}));

vi.mock('../MarkdownEditor', () => ({
  MarkdownEditor: ({ label, value, onChange }: any) => (
    <div data-testid="markdown-editor">
      <label>
        {label}
        <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  ),
}));

describe('RequirementModal', () => {
  const mockRequirement: Requirement = {
    id: 'REQ-001',
    title: 'Test Requirement',
    description: 'Test description',
    text: 'Requirement text',
    rationale: 'Rationale',
    priority: 'high',
    status: 'draft',
    dateCreated: Date.now(),
    lastModified: Date.now(),
    revision: '01',
    author: 'Test Author',
  };

  const defaultProps = {
    isOpen: true,
    requirement: null as Requirement | null,
    onClose: vi.fn(),
    onCreate: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  };

  const mockFormState = {
    isEditMode: false,
    activeTab: 'overview',
    setActiveTab: vi.fn(),
    title: '',
    setTitle: vi.fn(),
    description: '',
    setDescription: vi.fn(),
    text: '',
    setText: vi.fn(),
    rationale: '',
    setRationale: vi.fn(),
    priority: 'medium',
    setPriority: vi.fn(),
    status: 'draft',
    setStatus: vi.fn(),
    verificationMethod: '',
    setVerificationMethod: vi.fn(),
    comments: '',
    setComments: vi.fn(),
    customAttributes: [],
    setCustomAttributes: vi.fn(),
    showDeleteConfirm: false,
    handleDelete: vi.fn(),
    confirmDelete: vi.fn(),
    cancelDelete: vi.fn(),
    handleSubmit: vi.fn(),
    handleNavigateToArtifact: vi.fn(),
    handleRemoveLink: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRequirementForm as any).mockReturnValue(mockFormState);
  });

  it('should render when isOpen is true', () => {
    render(<RequirementModal {...defaultProps} />);
    expect(screen.getByText('New Requirement')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<RequirementModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('New Requirement')).not.toBeInTheDocument();
  });

  it('should display primary tabs', () => {
    render(<RequirementModal {...defaultProps} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Relationships')).toBeInTheDocument();
  });

  it('should call setActiveTab when tab is clicked', () => {
    render(<RequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Details'));
    expect(mockFormState.setActiveTab).toHaveBeenCalledWith('details');
  });

  it('should populate form fields when in overview tab', () => {
    (useRequirementForm as any).mockReturnValue({
      ...mockFormState,
      title: 'Test Requirement',
      description: 'Test description',
    });
    render(<RequirementModal {...defaultProps} />);
    expect(screen.getByDisplayValue('Test Requirement')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  it('should render detail fields when in details tab', () => {
    (useRequirementForm as any).mockReturnValue({
      ...mockFormState,
      activeTab: 'details',
      rationale: 'Test rationale',
      verificationMethod: 'Test verification',
    });
    render(<RequirementModal {...defaultProps} />);
    expect(screen.getByDisplayValue('Test rationale')).toBeInTheDocument();
  });

  it('should call onSubmit (handleSubmit) when create button is clicked', () => {
    render(<RequirementModal {...defaultProps} />);
    fireEvent.submit(screen.getByRole('form'));
    expect(mockFormState.handleSubmit).toHaveBeenCalled();
  });

  it('should show delete button and revision history tab when in edit mode', () => {
    (useRequirementForm as any).mockReturnValue({
      ...mockFormState,
      isEditMode: true,
    });
    render(<RequirementModal {...defaultProps} requirement={mockRequirement} />);
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Revision History')).toBeInTheDocument();
  });

  it('should call onClose when cancel is clicked', () => {
    render(<RequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
