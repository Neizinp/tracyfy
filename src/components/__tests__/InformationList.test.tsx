import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InformationList } from '../InformationList';
import type { Information } from '../../types';

describe('InformationList', () => {
    const mockInformation: Information[] = [
        {
            id: 'INFO-001',
            title: 'System Architecture',
            content: 'High level diagram...',
            type: 'other',
            revision: '01',
            lastModified: Date.now(),
            dateCreated: Date.now()
        }
    ];

    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();

    it('renders information items', () => {
        render(
            <InformationList
                information={mockInformation}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByText('INFO-001')).toBeInTheDocument();
        expect(screen.getByText('System Architecture')).toBeInTheDocument();
        expect(screen.getByText('High level diagram...')).toBeInTheDocument();
        expect(screen.getByText('other')).toBeInTheDocument();
    });

    it('handles edit and delete actions', () => {
        render(
            <InformationList
                information={mockInformation}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        fireEvent.click(screen.getByTitle('Edit'));
        expect(mockOnEdit).toHaveBeenCalledWith(mockInformation[0]);

        fireEvent.click(screen.getByTitle('Delete'));
        expect(mockOnDelete).toHaveBeenCalledWith('INFO-001');
    });

    it('renders empty state', () => {
        render(
            <InformationList
                information={[]}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByText('No information artifacts found. Create one to get started.')).toBeInTheDocument();
    });
});
