import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditRequirementModal } from '../EditRequirementModal';
import { UIProvider } from '../../app/providers';
import type { Requirement, Project } from '../../types';

// Mock child components to simplify testing
vi.mock('../MarkdownEditor', () => ({
  MarkdownEditor: ({ label, value, onChange }: any) => (
    <div data-testid={`markdown-editor-${label}`}>
      <label>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  ),
}));

vi.mock('../RevisionHistoryTab', () => ({
  RevisionHistoryTab: () => <div data-testid="revision-history">Revision History</div>,
}));

// Mock useGlobalState to avoid provider chain
vi.mock('../../app/providers/GlobalStateProvider', () => ({
  useGlobalState: () => ({
    requirements: [],
    useCases: [],
    testCases: [],
    information: [],
  }),
}));

// Mock useIncomingLinks to return empty array
vi.mock('../../hooks/useIncomingLinks', () => ({
  useIncomingLinks: () => [],
}));

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<UIProvider>{ui}</UIProvider>);
};

describe('EditRequirementModal', () => {
  const mockRequirement: Requirement = {
    id: 'REQ-001',
    title: 'Test Requirement',
    description: 'Test description',
    text: 'Requirement text',
    rationale: 'Test rationale',
    status: 'draft',
    priority: 'high',

    lastModified: Date.now(),
    revision: '01',
    dateCreated: Date.now(),
    author: 'Test Author',
  };

  const mockProject: Project = {
    id: 'p1',
    name: 'Test Project',
    description: '',
    requirementIds: ['REQ-001'],
    useCaseIds: [],
    testCaseIds: [],
    informationIds: [],
    lastModified: Date.now(),
  };

  const defaultProps = {
    isOpen: true,
    requirement: mockRequirement,
    links: [],
    projects: [mockProject],
    currentProjectId: 'p1',
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    onDelete: vi.fn(),
  };

  it('should render when isOpen is true', () => {
    renderWithProvider(<EditRequirementModal {...defaultProps} />);
    expect(screen.getByText(/Edit Requirement - REQ-001/i)).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    renderWithProvider(<EditRequirementModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/Edit Requirement/i)).not.toBeInTheDocument();
  });

  it('should display all tabs', () => {
    renderWithProvider(<EditRequirementModal {...defaultProps} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Revision History')).toBeInTheDocument();
  });

  it('should switch tabs when clicked', () => {
    renderWithProvider(<EditRequirementModal {...defaultProps} />);

    const detailsTab = screen.getByText('Details');
    fireEvent.click(detailsTab);

    // Details tab should show requirement text editor
    expect(screen.getByTestId('markdown-editor-Requirement Text')).toBeInTheDocument();
  });

  it('should populate form fields with requirement data', () => {
    renderWithProvider(<EditRequirementModal {...defaultProps} />);

    const titleInput = screen.getByDisplayValue('Test Requirement');
    expect(titleInput).toBeInTheDocument();

    // Author is displayed as read-only text, not an input
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('should call onSubmit with updated values when saved', () => {
    renderWithProvider(<EditRequirementModal {...defaultProps} />);

    const titleInput = screen.getByDisplayValue('Test Requirement');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      'REQ-001',
      expect.objectContaining({
        title: 'Updated Title',
      })
    );
  });

  it('should call onClose when cancel is clicked', () => {
    renderWithProvider(<EditRequirementModal {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show delete confirmation when delete is clicked', () => {
    renderWithProvider(<EditRequirementModal {...defaultProps} />);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // "Move to Trash" appears multiple times (title and button)
    expect(screen.getAllByText(/Move to Trash/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
  });

  it('should call onDelete when delete is confirmed', () => {
    renderWithProvider(<EditRequirementModal {...defaultProps} />);

    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Confirm deletion - get the button (not the title text)
    const buttons = screen.getAllByText('Move to Trash');
    const confirmButton = buttons.find((el) => el.tagName === 'BUTTON');
    fireEvent.click(confirmButton!);

    expect(defaultProps.onDelete).toHaveBeenCalledWith('REQ-001');
  });

  it('should show revision history tab', () => {
    renderWithProvider(<EditRequirementModal {...defaultProps} />);

    const historyTab = screen.getByText('Revision History');
    fireEvent.click(historyTab);

    expect(screen.getByTestId('revision-history')).toBeInTheDocument();
  });
});
