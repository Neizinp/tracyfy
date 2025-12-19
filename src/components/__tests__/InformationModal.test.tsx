import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InformationModal } from '../InformationModal';
import { useInformationForm } from '../../hooks/useInformationForm';
import type { Information } from '../../types';

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

vi.mock('../../hooks/useInformationForm', () => ({
  useInformationForm: vi.fn(),
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

describe('InformationModal', () => {
  const mockInformation: Information = {
    id: 'INFO-001',
    title: 'Project Meeting Notes',
    text: 'Discussion about requirements',
    type: 'meeting',
    lastModified: Date.now(),
    dateCreated: Date.now(),
    revision: '01',
  };

  const defaultProps = {
    isOpen: true,
    information: null as Information | null,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  const mockFormState = {
    isEditMode: false,
    activeTab: 'overview',
    setActiveTab: vi.fn(),
    title: '',
    setTitle: vi.fn(),
    text: '',
    setText: vi.fn(),
    type: 'note',
    setType: vi.fn(),
    customAttributes: [],
    setCustomAttributes: vi.fn(),
    handleSubmit: vi.fn(),
    handleNavigateToArtifact: vi.fn(),
    handleRemoveLink: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useInformationForm as any).mockReturnValue(mockFormState);
  });

  it('should render when isOpen is true', () => {
    render(<InformationModal {...defaultProps} />);
    expect(screen.getByText('New Information')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<InformationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('New Information')).not.toBeInTheDocument();
  });

  it('should display tabs correctly', () => {
    render(<InformationModal {...defaultProps} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.getByText('Custom Attributes')).toBeInTheDocument();
  });

  it('should call setActiveTab when tab is clicked', () => {
    render(<InformationModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Relationships'));
    expect(mockFormState.setActiveTab).toHaveBeenCalledWith('relationships');
  });

  it('should show revision history tab when in edit mode', () => {
    (useInformationForm as any).mockReturnValue({
      ...mockFormState,
      isEditMode: true,
    });
    render(<InformationModal {...defaultProps} information={mockInformation} />);
    expect(screen.getByText('Revision History')).toBeInTheDocument();
  });

  it('should call onSubmit (handleSubmit) when create button is clicked', () => {
    render(<InformationModal {...defaultProps} />);
    fireEvent.submit(screen.getByRole('form'));
    expect(mockFormState.handleSubmit).toHaveBeenCalled();
  });

  it('should render correct fields in overview tab', () => {
    (useInformationForm as any).mockReturnValue({
      ...mockFormState,
      title: 'Test Title',
      text: 'Test Text',
      type: 'meeting',
    });
    render(<InformationModal {...defaultProps} />);

    expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument();
    const typeSelect = screen.getByRole('combobox') as HTMLSelectElement;
    expect(typeSelect.value).toBe('meeting');
    expect(screen.getByDisplayValue('Test Text')).toBeInTheDocument();
  });

  it('should show revision history content when history tab is active', () => {
    (useInformationForm as any).mockReturnValue({
      ...mockFormState,
      isEditMode: true,
      activeTab: 'history',
    });
    render(<InformationModal {...defaultProps} information={mockInformation} />);
    expect(screen.getByTestId('revision-history')).toBeInTheDocument();
  });

  it('should call onClose when cancel is clicked', () => {
    render(<InformationModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
