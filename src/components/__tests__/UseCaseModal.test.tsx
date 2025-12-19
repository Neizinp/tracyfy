import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UseCaseModal } from '../UseCaseModal';
import { useUseCaseForm } from '../../hooks/useUseCaseForm';
import type { UseCase } from '../../types';

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

vi.mock('../../hooks/useUseCaseForm', () => ({
  useUseCaseForm: vi.fn(),
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

describe('UseCaseModal', () => {
  const mockUseCase: UseCase = {
    id: 'UC-001',
    title: 'User Login',
    description: 'User authentication flow',
    actor: 'End User',
    preconditions: 'User has an account',
    postconditions: 'User is logged in',
    mainFlow: '1. User enters credentials\n2. System validates\n3. System grants access',
    alternativeFlows: 'Invalid credentials → show error',
    status: 'approved',
    priority: 'high',
    lastModified: Date.now(),
    revision: '01',
  };

  const defaultProps = {
    isOpen: true,
    useCase: null as UseCase | null,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  const mockFormState = {
    isEditMode: false,
    activeTab: 'overview',
    setActiveTab: vi.fn(),
    title: '',
    setTitle: vi.fn(),
    description: '',
    setDescription: vi.fn(),
    actor: '',
    setActor: vi.fn(),
    preconditions: '',
    setPreconditions: vi.fn(),
    postconditions: '',
    setPostconditions: vi.fn(),
    mainFlow: '',
    setMainFlow: vi.fn(),
    alternativeFlows: '',
    setAlternativeFlows: vi.fn(),
    priority: 'medium',
    setPriority: vi.fn(),
    status: 'draft',
    setStatus: vi.fn(),
    customAttributes: [],
    setCustomAttributes: vi.fn(),
    handleSubmit: vi.fn(),
    handleNavigateToArtifact: vi.fn(),
    handleRemoveLink: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUseCaseForm as any).mockReturnValue(mockFormState);
  });

  it('should render when isOpen is true', () => {
    render(<UseCaseModal {...defaultProps} />);
    expect(screen.getByText('New Use Case')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<UseCaseModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('New Use Case')).not.toBeInTheDocument();
  });

  it('should display primary tabs', () => {
    render(<UseCaseModal {...defaultProps} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Flows')).toBeInTheDocument();
    expect(screen.getByText('Conditions')).toBeInTheDocument();
  });

  it('should call setActiveTab when tab is clicked', () => {
    render(<UseCaseModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Flows'));
    expect(mockFormState.setActiveTab).toHaveBeenCalledWith('flows');
  });

  it('should populate form fields when in overview tab', () => {
    (useUseCaseForm as any).mockReturnValue({
      ...mockFormState,
      title: 'User Login',
      actor: 'End User',
    });
    render(<UseCaseModal {...defaultProps} />);
    expect(screen.getByDisplayValue('User Login')).toBeInTheDocument();
    expect(screen.getByDisplayValue('End User')).toBeInTheDocument();
  });

  it('should render flow fields when in flows tab', () => {
    (useUseCaseForm as any).mockReturnValue({
      ...mockFormState,
      activeTab: 'flows',
      mainFlow: 'Step 1',
      alternativeFlows: 'Alt 1',
    });
    render(<UseCaseModal {...defaultProps} />);
    expect(screen.getByDisplayValue('Step 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alt 1')).toBeInTheDocument();
  });

  it('should call onSubmit (handleSubmit) when create button is clicked', () => {
    render(<UseCaseModal {...defaultProps} />);
    fireEvent.submit(screen.getByRole('form'));
    expect(mockFormState.handleSubmit).toHaveBeenCalled();
  });

  it('should show revision history tab when in edit mode', () => {
    (useUseCaseForm as any).mockReturnValue({
      ...mockFormState,
      isEditMode: true,
    });
    render(<UseCaseModal {...defaultProps} useCase={mockUseCase} />);
    expect(screen.getByText('Revision History')).toBeInTheDocument();
  });

  it('should call onClose when cancel is clicked', () => {
    render(<UseCaseModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
