import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestCaseList } from '../TestCaseList';
import type { TestCase } from '../../types';

describe('TestCaseList', () => {
    const mockTestCases: TestCase[] = [
        {
            id: 'TC-001',
            title: 'Verify Login',
            description: 'Check login with valid creds',
            requirementIds: ['REQ-001'],
            priority: 'high',
            status: 'passed',
            revision: '01',
            lastModified: Date.now(),
            dateCreated: Date.now()
        }
    ];

    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();

    it('renders test cases', () => {
        render(
            <TestCaseList
                testCases={mockTestCases}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByText('TC-001')).toBeInTheDocument();
        expect(screen.getByText('Verify Login')).toBeInTheDocument();
        expect(screen.getByText('Check login with valid creds')).toBeInTheDocument();
        expect(screen.getByText('passed')).toBeInTheDocument();
    });

    it('handles edit and delete actions', () => {
        render(
            <TestCaseList
                testCases={mockTestCases}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        fireEvent.click(screen.getByTitle('Edit'));
        expect(mockOnEdit).toHaveBeenCalledWith(mockTestCases[0]);

        fireEvent.click(screen.getByTitle('Delete'));
        expect(mockOnDelete).toHaveBeenCalledWith('TC-001');
    });

    it('renders empty state', () => {
        render(
            <TestCaseList
                testCases={[]}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByText('No test cases found.')).toBeInTheDocument();
    });
});
