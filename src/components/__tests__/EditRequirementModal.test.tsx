import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditRequirementModal } from '../EditRequirementModal';
import type { Requirement, Project } from '../../types';

// Mock child components to simplify testing
vi.mock('../MarkdownEditor', () => ({
    MarkdownEditor: ({ label, value, onChange }: any) => (
        <div data-testid={`markdown-editor-${label}`}>
            <label>{label}</label>
            <textarea value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    )
}));

vi.mock('../RevisionHistoryTab', () => ({
    RevisionHistoryTab: () => <div data-testid="revision-history">Revision History</div>
}));

describe('EditRequirementModal', () => {
    const mockRequirement: Requirement = {
        id: 'REQ-001',
        title: 'Test Requirement',
        description: 'Test description',
        text: 'Requirement text',
        rationale: 'Test rationale',
        status: 'draft',
        priority: 'high',
        parentIds: [],
        lastModified: Date.now(),
        revision: '01',
        dateCreated: Date.now(),
        author: 'Test Author'
    };

    const mockProject: Project = {
        id: 'p1',
        name: 'Test Project',
        description: '',
        requirementIds: ['REQ-001'],
        useCaseIds: [],
        testCaseIds: [],
        informationIds: [],
        lastModified: Date.now()
    };

    const defaultProps = {
        isOpen: true,
        requirement: mockRequirement,
        allRequirements: [mockRequirement],
        links: [],
        projects: [mockProject],
        currentProjectId: 'p1',
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        onDelete: vi.fn()
    };

    it('should render when isOpen is true', () => {
        render(<EditRequirementModal {...defaultProps} />);
        expect(screen.getByText(/Edit Requirement - REQ-001/i)).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
        render(<EditRequirementModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText(/Edit Requirement/i)).not.toBeInTheDocument();
    });

    it('should display all tabs', () => {
        render(<EditRequirementModal {...defaultProps} />);
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Details')).toBeInTheDocument();
        expect(screen.getByText('Relationships')).toBeInTheDocument();
        expect(screen.getByText('Comments')).toBeInTheDocument();
        expect(screen.getByText('Revision History')).toBeInTheDocument();
    });

    it('should switch tabs when clicked', () => {
        render(<EditRequirementModal {...defaultProps} />);

        const detailsTab = screen.getByText('Details');
        fireEvent.click(detailsTab);

        // Details tab should show requirement text editor
        expect(screen.getByTestId('markdown-editor-Requirement Text')).toBeInTheDocument();
    });

    it('should populate form fields with requirement data', () => {
        render(<EditRequirementModal {...defaultProps} />);

        const titleInput = screen.getByDisplayValue('Test Requirement');
        expect(titleInput).toBeInTheDocument();

        const authorInput = screen.getByDisplayValue('Test Author');
        expect(authorInput).toBeInTheDocument();
    });

    it('should call onSubmit with updated values when saved', () => {
        render(<EditRequirementModal {...defaultProps} />);

        const titleInput = screen.getByDisplayValue('Test Requirement');
        fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);

        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
            'REQ-001',
            expect.objectContaining({
                title: 'Updated Title'
            })
        );
    });

    it('should call onClose when cancel is clicked', () => {
        render(<EditRequirementModal {...defaultProps} />);

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should show delete confirmation when delete is clicked', () => {
        render(<EditRequirementModal {...defaultProps} />);

        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);

        // "Move to Trash" appears multiple times (title and button)
        expect(screen.getAllByText(/Move to Trash/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    it('should call onDelete when delete is confirmed', () => {
        render(<EditRequirementModal {...defaultProps} />);

        // Click delete button
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);

        // Confirm deletion - get the button (not the title text)
        const buttons = screen.getAllByText('Move to Trash');
        const confirmButton = buttons.find(el => el.tagName === 'BUTTON');
        fireEvent.click(confirmButton!);

        expect(defaultProps.onDelete).toHaveBeenCalledWith('REQ-001');
    });

    it('should show revision history tab', () => {
        render(<EditRequirementModal {...defaultProps} />);

        const historyTab = screen.getByText('Revision History');
        fireEvent.click(historyTab);

        expect(screen.getByTestId('revision-history')).toBeInTheDocument();
    });

    it('should prevent circular dependencies in parent selection', () => {
        const childReq: Requirement = {
            ...mockRequirement,
            id: 'REQ-002',
            parentIds: ['REQ-001']
        };

        const grandchildReq: Requirement = {
            ...mockRequirement,
            id: 'REQ-003',
            parentIds: ['REQ-002']
        };

        render(
            <EditRequirementModal
                {...defaultProps}
                allRequirements={[mockRequirement, childReq, grandchildReq]}
            />
        );

        // Switch to relationships tab
        const relationshipsTab = screen.getByText('Relationships');
        fireEvent.click(relationshipsTab);

        // Should show descendant labels in the relationships tab
        const descendants = screen.queryAllByText('(descendant)');
        expect(descendants.length).toBeGreaterThan(0);
    });
});
