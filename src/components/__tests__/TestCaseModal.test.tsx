import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestCaseModal } from '../TestCaseModal';
import { useTestCaseForm } from '../../hooks/useTestCaseForm';
import type { TestCase } from '../../types';

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

vi.mock('../../hooks/useTestCaseForm', () => ({
  useTestCaseForm: vi.fn(),
}));

vi.mock('../../utils/dateUtils', () => ({
  formatDateTime: (timestamp: number) => new Date(timestamp).toISOString(),
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
      <label>{label}</label>
      <textarea aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  ),
}));

describe('TestCaseModal', () => {
  const mockTestCase: TestCase = {
    id: 'TC-001',
    title: 'Login Test',
    description: 'Test user login functionality',
    status: 'draft',
    priority: 'high',
    requirementIds: ['REQ-001'],
    dateCreated: Date.now(),
    lastModified: Date.now(),
    revision: '01',
    author: 'Test Author',
  };

  const defaultProps = {
    isOpen: true,
    testCase: null as TestCase | null,
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
    priority: 'medium',
    setPriority: vi.fn(),
    status: 'draft',
    setStatus: vi.fn(),
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
    (useTestCaseForm as any).mockReturnValue(mockFormState);
  });

  it('should render when isOpen is true', () => {
    render(<TestCaseModal {...defaultProps} />);
    expect(screen.getByText('New Test Case')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<TestCaseModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('New Test Case')).not.toBeInTheDocument();
  });

  it('should display primary tabs', () => {
    render(<TestCaseModal {...defaultProps} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Relationships')).toBeInTheDocument();
  });

  it('should call setActiveTab when tab is clicked', () => {
    render(<TestCaseModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Relationships'));
    expect(mockFormState.setActiveTab).toHaveBeenCalledWith('relationships');
  });

  it('should populate form fields when in overview tab', () => {
    (useTestCaseForm as any).mockReturnValue({
      ...mockFormState,
      title: 'Login Test',
      description: 'Test description',
    });
    render(<TestCaseModal {...defaultProps} />);
    expect(screen.getByDisplayValue('Login Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  it('should call onSubmit (handleSubmit) when create button is clicked', () => {
    render(<TestCaseModal {...defaultProps} />);
    fireEvent.submit(screen.getByRole('form'));
    expect(mockFormState.handleSubmit).toHaveBeenCalled();
  });

  it('should show delete button and revision history tab when in edit mode', () => {
    (useTestCaseForm as any).mockReturnValue({
      ...mockFormState,
      isEditMode: true,
    });
    render(<TestCaseModal {...defaultProps} testCase={mockTestCase} />);
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Revision History')).toBeInTheDocument();
  });

  it('should show delete confirmation when handleDelete is triggered', () => {
    (useTestCaseForm as any).mockReturnValue({
      ...mockFormState,
      isEditMode: true,
      showDeleteConfirm: true,
    });
    render(<TestCaseModal {...defaultProps} testCase={mockTestCase} />);
    expect(
      screen.getByText(/Are you sure you want to move this test case to the trash/)
    ).toBeInTheDocument();
  });

  it('should call onClose when cancel is clicked', () => {
    render(<TestCaseModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
