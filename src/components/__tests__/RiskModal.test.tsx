import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RiskModal } from '../RiskModal';
import { useRiskForm } from '../../hooks/useRiskForm';
import type { Risk } from '../../types';

// Mock everything to solve the OOM/hang issues
vi.mock('../../app/providers', () => ({
  UIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useUI: vi.fn(() => ({
    setIsLinkModalOpen: vi.fn(),
    setLinkSourceId: vi.fn(),
    setLinkSourceType: vi.fn(),
    activeModal: { type: null, isEdit: false },
    selectedArtifact: null,
    editingRequirement: null,
    editingUseCase: null,
    selectedInformation: null,
    closeModal: vi.fn(),
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

vi.mock('../../hooks/useRiskForm', () => ({
  useRiskForm: vi.fn(),
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
  }: {
    children: React.ReactNode;
    title: React.ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    onTabChange: (id: string) => void;
    tabs: { id: string; label: string }[];
    onClose: () => void;
  }) => (
    <div>
      <h2>{title}</h2>
      <div data-testid="tabs">
        {tabs?.map((t) => (
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

describe('RiskModal', () => {
  const mockRisk: Risk = {
    id: 'RISK-001',
    title: 'Data Loss Risk',
    description: 'Risk of losing user data during migration',
    category: 'technical',
    probability: 'low',
    impact: 'high',
    status: 'identified',
    owner: 'Jane Smith',
    mitigation: 'Regular backups',
    contingency: 'Restore from backup',
    lastModified: Date.now(),
    dateCreated: Date.now(),
    revision: '01',
    linkedArtifacts: [],
  };

  const defaultProps = {
    isOpen: true,
    risk: null as Risk | null,
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
    category: 'technical',
    setCategory: vi.fn(),
    probability: 'low',
    setProbability: vi.fn(),
    impact: 'low',
    setImpact: vi.fn(),
    status: 'identified',
    setStatus: vi.fn(),
    owner: '',
    setOwner: vi.fn(),
    mitigation: '',
    setMitigation: vi.fn(),
    contingency: '',
    setContingency: vi.fn(),
    customAttributes: [],
    setCustomAttributes: vi.fn(),
    riskLevel: 'LOW',
    riskColor: '#22c55e',
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
    (useRiskForm as any).mockReturnValue(mockFormState);
  });

  it('should render when isOpen is true', () => {
    render(<RiskModal {...defaultProps} />);
    expect(screen.getByText('New Risk')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<RiskModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('heading', { name: /New Risk/i })).not.toBeInTheDocument();
  });

  it('should display tabs correctly', () => {
    render(<RiskModal {...defaultProps} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Mitigation')).toBeInTheDocument();
    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.getByText('Custom Attributes')).toBeInTheDocument();
  });

  it('should call setActiveTab when tab is clicked', () => {
    render(<RiskModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Mitigation'));
    expect(mockFormState.setActiveTab).toHaveBeenCalledWith('mitigation');
  });

  it('should show revision history tab when in edit mode', () => {
    (useRiskForm as any).mockReturnValue({
      ...mockFormState,
      isEditMode: true,
      riskLevel: 'HIGH',
    });
    render(<RiskModal {...defaultProps} risk={mockRisk} />);
    expect(screen.getByText('Revision History')).toBeInTheDocument();
    expect(screen.getByText(/HIGH risk/i)).toBeInTheDocument();
  });

  it('should call onSubmit (handleSubmit) when create button is clicked', () => {
    render(<RiskModal {...defaultProps} />);
    fireEvent.submit(screen.getByRole('form'));
    expect(mockFormState.handleSubmit).toHaveBeenCalled();
  });

  it('should render correct fields in overview tab', () => {
    (useRiskForm as any).mockReturnValue({
      ...mockFormState,
      title: 'Test Risk',
      owner: 'Test Owner',
      category: 'schedule',
      probability: 'high',
      impact: 'medium',
    });
    render(<RiskModal {...defaultProps} />);

    expect(screen.getByDisplayValue('Test Risk')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Owner')).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    // Order in ArtifactOverviewFields: Status, then Priority (Probability)
    // Then in RiskModal: Category, then Impact
    expect(selects[0].value).toBe('identified'); // Status
    expect(selects[1].value).toBe('high'); // Probability
    expect(selects[2].value).toBe('schedule'); // Category
    expect(selects[3].value).toBe('medium'); // Impact
  });

  it('should render mitigation fields when mitigation tab is active', () => {
    (useRiskForm as any).mockReturnValue({
      ...mockFormState,
      activeTab: 'mitigation',
      mitigation: 'Test Mitigation',
      contingency: 'Test Contingency',
    });
    render(<RiskModal {...defaultProps} />);

    expect(screen.getByDisplayValue('Test Mitigation')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Contingency')).toBeInTheDocument();
  });

  it('should call onClose when cancel is clicked', () => {
    render(<RiskModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
