import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditTestCaseModal } from '../EditTestCaseModal';
import type { TestCase, Requirement } from '../../types';

// Mock dependencies
vi.mock('../RevisionHistoryTab', () => ({
    RevisionHistoryTab: () => <div data-testid="revision-history">Revision History</div>
}));

vi.mock('../../utils/dateUtils', () => ({
    formatDateTime: (timestamp: number) => new Date(timestamp).toISOString()
}));

describe('EditTestCaseModal', () => {
    const mockRequirements: Requirement[] = [
        {
            id: 'REQ-001',
            title: 'User Authentication',
            description: 'Test auth',
            text: 'Auth requirement',
            rationale: 'Security',
            status: 'approved',
            priority: 'high',
            parentIds: [],
            lastModified: Date.now(),
            revision: '01',
            dateCreated: Date.now(),
            author: 'Test Author',
            isDeleted: false
        },
        {
            id: 'REQ-002',
            title: 'Data Validation',
            description: 'Validate input',
            text: 'Validation requirement',
            rationale: 'Data integrity',
            status: 'draft',
            priority: 'medium',
            parentIds: [],
            lastModified: Date.now(),
            revision: '01',
            dateCreated: Date.now(),
            author: 'Test Author',
            isDeleted: false
        }
    ];

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
        author: 'Test Author'
    };

    const defaultProps = {
        isOpen: true,
        testCase: mockTestCase,
        requirements: mockRequirements,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        onDelete: vi.fn()
    };

    it('should render when isOpen is true and testCase is provided', () => {
        render(<EditTestCaseModal {...defaultProps} />);
        expect(screen.getByText(/Edit Test Case - TC-001/i)).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
        render(<EditTestCaseModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText(/Edit Test Case/i)).not.toBeInTheDocument();
    });

    it('should not render when testCase is null', () => {
        render(<EditTestCaseModal {...defaultProps} testCase={null} />);
        expect(screen.queryByText(/Edit Test Case/i)).not.toBeInTheDocument();
    });

    it('should display both tabs', () => {
        render(<EditTestCaseModal {...defaultProps} />);
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Revision History')).toBeInTheDocument();
    });

    it('should switch between tabs', () => {
        render(<EditTestCaseModal {...defaultProps} />);

        const historyTab = screen.getByText('Revision History');
        fireEvent.click(historyTab);

        expect(screen.getByTestId('revision-history')).toBeInTheDocument();
    });

    it('should populate form fields with test case data', () => {
        render(<EditTestCaseModal {...defaultProps} />);

        expect(screen.getByDisplayValue('Login Test')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test user login functionality')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Author')).toBeInTheDocument();
    });

    it('should update title field', () => {
        render(<EditTestCaseModal {...defaultProps} />);

        const titleInput = screen.getByLabelText(/Title/i);
        fireEvent.change(titleInput, { target: { value: 'Updated Test' } });

        expect(screen.getByDisplayValue('Updated Test')).toBeInTheDocument();
    });

    it('should handle requirement linking', () => {
        render(<EditTestCaseModal {...defaultProps} />);

        // REQ-001 should be checked (it's in requirementIds)
        const req001Checkbox = screen.getByRole('checkbox', { name: /REQ-001/i });
        expect(req001Checkbox).toBeChecked();

        // REQ-002 should not be checked
        const req002Checkbox = screen.getByRole('checkbox', { name: /REQ-002/i });
        expect(req002Checkbox).not.toBeChecked();

        // Toggle REQ-002
        fireEvent.click(req002Checkbox);
        expect(req002Checkbox).toBeChecked();
    });

    it('should call onSubmit with correct data when saved', () => {
        render(<EditTestCaseModal {...defaultProps} />);

        const titleInput = screen.getByLabelText(/Title/i);
        fireEvent.change(titleInput, { target: { value: 'Updated Test' } });

        const submitButton = screen.getByText('Save Changes');
        fireEvent.click(submitButton);

        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
            'TC-001',
            expect.objectContaining({
                title: 'Updated Test',
                lastModified: expect.any(Number)
            })
        );
    });

    it('should call onClose when cancel is clicked', () => {
        render(<EditTestCaseModal {...defaultProps} />);

        const cancelButton = screen.getAllByText('Cancel')[0]; // First cancel button (not in delete confirm)
        fireEvent.click(cancelButton);

        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should show delete confirmation when delete is clicked', () => {
        render(<EditTestCaseModal {...defaultProps} />);

        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);

        expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
        expect(screen.getByText('Move to Trash')).toBeInTheDocument();
    });

    it('should call onDelete when delete is confirmed', () => {
        render(<EditTestCaseModal {...defaultProps} />);

        // Click delete button
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);

        // Confirm deletion
        const confirmButtons = screen.getAllByText('Move to Trash');
        const confirmButton = confirmButtons.find(el => el.tagName === 'BUTTON' && !el.textContent?.includes('⚠️'));
        fireEvent.click(confirmButton!);

        expect(defaultProps.onDelete).toHaveBeenCalledWith('TC-001');
    });

    it('should update status and set lastRun when changing to passed', () => {
        render(<EditTestCaseModal {...defaultProps} />);

        const statusSelect = screen.getByLabelText(/Status/i);
        fireEvent.change(statusSelect, { target: { value: 'passed' } });

        const submitButton = screen.getByText('Save Changes');
        fireEvent.click(submitButton);

        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
            'TC-001',
            expect.objectContaining({
                status: 'passed',
                lastRun: expect.any(Number)
            })
        );
    });

    it('should filter out deleted requirements', () => {
        const requirementsWithDeleted = [
            ...mockRequirements,
            {
                ...mockRequirements[0],
                id: 'REQ-003',
                title: 'Deleted Requirement',
                isDeleted: true
            }
        ];

        render(<EditTestCaseModal {...defaultProps} requirements={requirementsWithDeleted} />);

        // Should not show deleted requirement
        expect(screen.queryByText('REQ-003')).not.toBeInTheDocument();
        expect(screen.queryByText('Deleted Requirement')).not.toBeInTheDocument();

        // Should show active requirements
        expect(screen.getByText('REQ-001')).toBeInTheDocument();
        expect(screen.getByText('REQ-002')).toBeInTheDocument();
    });

    it('should validate required title field', () => {
        render(<EditTestCaseModal {...defaultProps} />);

        const titleInput = screen.getByLabelText(/Title/i);
        expect(titleInput).toHaveAttribute('required');
    });

    it('should handle priority changes', () => {
        render(<EditTestCaseModal {...defaultProps} />);

        const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;
        expect(prioritySelect.value).toBe('high');

        fireEvent.change(prioritySelect, { target: { value: 'low' } });
        expect(prioritySelect.value).toBe('low');
    });
});
