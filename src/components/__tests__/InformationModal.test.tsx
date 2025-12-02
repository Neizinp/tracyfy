import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InformationModal } from '../InformationModal';
import type { Information } from '../../types';

// Mock RevisionHistoryTab
vi.mock('../RevisionHistoryTab', () => ({
    RevisionHistoryTab: () => <div data-testid="revision-history">Revision History</div>
}));

describe('InformationModal', () => {
    const mockInformation: Information = {
        id: 'INFO-001',
        title: 'Project Meeting Notes',
        content: 'Discussion about requirements',
        type: 'meeting',
        lastModified: Date.now(),
        dateCreated: Date.now(),
        revision: '01'
    };

    const defaultProps = {
        isOpen: true,
        information: null,
        onClose: vi.fn(),
        onSubmit: vi.fn()
    };

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
        // Revision History tab only shows when editing
        expect(screen.queryByText('Revision History')).not.toBeInTheDocument();
    });

    it('should show revision history tab when editing', () => {
        render(<InformationModal {...defaultProps} information={mockInformation} />);
        expect(screen.getByText('Revision History')).toBeInTheDocument();
    });

    it('should populate form fields when editing existing information', () => {
        render(<InformationModal {...defaultProps} information={mockInformation} />);

        expect(screen.getByText('Edit Information')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Project Meeting Notes')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Discussion about requirements')).toBeInTheDocument();
    });

    it('should validate required fields', () => {
        render(<InformationModal {...defaultProps} />);

        const titleInput = screen.getByLabelText(/Title/i);
        const contentInput = screen.getByLabelText(/Content/i);

        expect(titleInput).toHaveAttribute('required');
        expect(contentInput).toHaveAttribute('required');
    });

    it('should call onSubmit with correct data when creating new information', () => {
        render(<InformationModal {...defaultProps} />);

        const titleInput = screen.getByLabelText(/Title/i);
        const contentInput = screen.getByLabelText(/Content/i);

        // Find Type select by role
        const selects = screen.getAllByRole('combobox');
        const typeSelect = selects.find(s => s.querySelector('option[value="note"]')) as HTMLSelectElement;

        fireEvent.change(titleInput, { target: { value: 'New Note' } });
        fireEvent.change(contentInput, { target: { value: 'Test content' } });
        if (typeSelect) {
            fireEvent.change(typeSelect, { target: { value: 'decision' } });
        }

        const submitButton = screen.getByText('Create Information');
        fireEvent.click(submitButton);

        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'New Note',
                content: 'Test content',
                type: 'decision',
                revision: '01'
            })
        );
    });

    it('should call onSubmit with updates when editing existing information', () => {
        render(<InformationModal {...defaultProps} information={mockInformation} />);

        const titleInput = screen.getByDisplayValue('Project Meeting Notes');
        fireEvent.change(titleInput, { target: { value: 'Updated Notes' } });

        const submitButton = screen.getByText('Save Changes');
        fireEvent.click(submitButton);

        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'INFO-001',
                updates: expect.objectContaining({
                    title: 'Updated Notes'
                })
            })
        );
    });

    it('should call onClose when cancel is clicked', () => {
        render(<InformationModal {...defaultProps} />);

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should have correct default values for new information', () => {
        render(<InformationModal {...defaultProps} />);

        // Find Type select by its value attribute
        const selects = screen.getAllByRole('combobox');
        const typeSelect = selects.find(s => s.querySelector('option[value="note"]')) as HTMLSelectElement;
        expect(typeSelect?.value).toBe('note');
    });

    it('should update type selection', () => {
        render(<InformationModal {...defaultProps} />);

        // Find Type select by its value attribute
        const selects = screen.getAllByRole('combobox');
        const typeSelect = selects.find(s => s.querySelector('option[value="note"]')) as HTMLSelectElement;

        if (typeSelect) {
            fireEvent.change(typeSelect, { target: { value: 'meeting' } });
            expect(typeSelect.value).toBe('meeting');

            fireEvent.change(typeSelect, { target: { value: 'decision' } });
            expect(typeSelect.value).toBe('decision');
        }
    });

    it('should display revision history when tab is clicked', () => {
        render(<InformationModal {...defaultProps} information={mockInformation} />);

        const historyTab = screen.getByText('Revision History');
        fireEvent.click(historyTab);

        expect(screen.getByTestId('revision-history')).toBeInTheDocument();
    });
});
