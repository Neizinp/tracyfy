import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UseCaseModal } from '../UseCaseModal';
import type { UseCase } from '../../types';

// Mock RevisionHistoryTab
vi.mock('../RevisionHistoryTab', () => ({
    RevisionHistoryTab: () => <div data-testid="revision-history">Revision History</div>
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
        revision: '01'
    };

    const defaultProps = {
        isOpen: true,
        useCase: null,
        onClose: vi.fn(),
        onSubmit: vi.fn()
    };

    it('should render when isOpen is true', () => {
        render(<UseCaseModal {...defaultProps} />);
        expect(screen.getByText('New Use Case')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
        render(<UseCaseModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('New Use Case')).not.toBeInTheDocument();
    });

    it('should display all tabs', () => {
        render(<UseCaseModal {...defaultProps} />);
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Flows')).toBeInTheDocument();
        expect(screen.getByText('Conditions')).toBeInTheDocument();
        expect(screen.getByText('Revision History')).toBeInTheDocument();
    });

    it('should switch tabs when clicked', () => {
        render(<UseCaseModal {...defaultProps} />);

        const flowsTab = screen.getByText('Flows');
        fireEvent.click(flowsTab);

        expect(screen.getByLabelText(/Main Flow/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Alternative Flows/i)).toBeInTheDocument();
    });

    it('should populate form fields when editing existing use case', () => {
        render(<UseCaseModal {...defaultProps} useCase={mockUseCase} />);

        expect(screen.getByText(/Edit Use Case - UC-001/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('User Login')).toBeInTheDocument();
        expect(screen.getByDisplayValue('End User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('User authentication flow')).toBeInTheDocument();
    });

    it('should call onSubmit with correct data when creating new use case', () => {
        render(<UseCaseModal {...defaultProps} />);

        const titleInput = screen.getByLabelText(/Title/i);
        const actorInput = screen.getByLabelText(/Actor/i);

        fireEvent.change(titleInput, { target: { value: 'New Use Case' } });
        fireEvent.change(actorInput, { target: { value: 'Test Actor' } });

        // Switch to Flows tab to fill required field
        const flowsTab = screen.getByText('Flows');
        fireEvent.click(flowsTab);

        const mainFlowInput = screen.getByLabelText(/Main Flow/i);
        fireEvent.change(mainFlowInput, { target: { value: 'Test flow' } });

        const submitButton = screen.getByText('Create Use Case');
        fireEvent.click(submitButton);

        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'New Use Case',
                actor: 'Test Actor',
                mainFlow: 'Test flow',
                revision: '01'
            })
        );
    });

    it('should call onSubmit with updates when editing existing use case', () => {
        render(<UseCaseModal {...defaultProps} useCase={mockUseCase} />);

        const titleInput = screen.getByDisplayValue('User Login');
        fireEvent.change(titleInput, { target: { value: 'Updated Login' } });

        const submitButton = screen.getByText('Save Changes');
        fireEvent.click(submitButton);

        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'UC-001',
                updates: expect.objectContaining({
                    title: 'Updated Login'
                })
            })
        );
    });

    it('should call onClose when cancel is clicked', () => {
        render(<UseCaseModal {...defaultProps} />);

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should show revision history tab when editing', () => {
        render(<UseCaseModal {...defaultProps} useCase={mockUseCase} />);

        const historyTab = screen.getByText('Revision History');
        fireEvent.click(historyTab);

        expect(screen.getByTestId('revision-history')).toBeInTheDocument();
    });

    it('should validate required fields', () => {
        render(<UseCaseModal {...defaultProps} />);

        const titleInput = screen.getByLabelText(/Title/i);
        const actorInput = screen.getByLabelText(/Actor/i);

        expect(titleInput).toHaveAttribute('required');
        expect(actorInput).toHaveAttribute('required');

        // Switch to Flows tab
        const flowsTab = screen.getByText('Flows');
        fireEvent.click(flowsTab);

        const mainFlowInput = screen.getByLabelText(/Main Flow/i);
        expect(mainFlowInput).toHaveAttribute('required');
    });

    it('should have correct default values for new use case', () => {
        render(<UseCaseModal {...defaultProps} />);

        const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;
        const statusSelect = screen.getByLabelText(/Status/i) as HTMLSelectElement;

        expect(prioritySelect.value).toBe('medium');
        expect(statusSelect.value).toBe('draft');
    });

    it('should update priority and status', () => {
        render(<UseCaseModal {...defaultProps} />);

        const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;
        const statusSelect = screen.getByLabelText(/Status/i) as HTMLSelectElement;

        fireEvent.change(prioritySelect, { target: { value: 'high' } });
        fireEvent.change(statusSelect, { target: { value: 'approved' } });

        expect(prioritySelect.value).toBe('high');
        expect(statusSelect.value).toBe('approved');
    });
});
