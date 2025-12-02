import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailedRequirementView } from '../DetailedRequirementView';
import type { Requirement, ColumnVisibility, Project } from '../../types';

// Mock ReactMarkdown to avoid ESM issues and simplify testing
vi.mock('react-markdown', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('remark-gfm', () => ({ default: () => { } }));
vi.mock('rehype-raw', () => ({ default: () => { } }));

describe('DetailedRequirementView', () => {
    const mockRequirements: Requirement[] = [
        {
            id: 'REQ-001',
            title: 'Login',
            description: 'User login',
            status: 'approved',
            priority: 'high',
            revision: '01',
            lastModified: Date.now(),
            dateCreated: Date.now(),
            parentIds: [],
            text: '',
            rationale: ''
        },
        {
            id: 'REQ-002',
            title: 'Logout',
            description: 'User logout',
            status: 'draft',
            priority: 'medium',
            revision: '02',
            lastModified: Date.now(),
            dateCreated: Date.now(),
            parentIds: [],
            text: '',
            rationale: ''
        }
    ];

    const mockOnEdit = vi.fn();

    const defaultColumns: ColumnVisibility = {
        idTitle: true,
        description: true,
        text: true,
        rationale: true,
        author: true,
        verification: true,
        priority: true,
        status: true,
        comments: true,
        created: true,
        approved: true
    };

    it('renders requirements correctly', () => {
        render(
            <DetailedRequirementView
                requirements={mockRequirements}
                onEdit={mockOnEdit}
                visibleColumns={defaultColumns}
            />
        );

        expect(screen.getByText('REQ-001')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('REQ-002')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('handles row click to edit', () => {
        render(
            <DetailedRequirementView
                requirements={mockRequirements}
                onEdit={mockOnEdit}
                visibleColumns={defaultColumns}
            />
        );

        fireEvent.click(screen.getByText('Login'));
        expect(mockOnEdit).toHaveBeenCalledWith(mockRequirements[0]);
    });

    it('respects column visibility', () => {
        const hiddenColumns: ColumnVisibility = {
            ...defaultColumns,
            description: false,
            priority: false
        };

        render(
            <DetailedRequirementView
                requirements={mockRequirements}
                onEdit={mockOnEdit}
                visibleColumns={hiddenColumns}
            />
        );

        expect(screen.queryByText('Description')).not.toBeInTheDocument();
        expect(screen.queryByText('Priority')).not.toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders empty state message', () => {
        render(
            <DetailedRequirementView
                requirements={[]}
                onEdit={mockOnEdit}
                visibleColumns={defaultColumns}
            />
        );

        expect(screen.getByText('No requirements found.')).toBeInTheDocument();
    });

    it('renders project column when enabled', () => {
        const mockProjects: Project[] = [
            {
                id: 'proj-1',
                name: 'Project A',
                description: '',
                requirementIds: ['REQ-001'],
                useCaseIds: [],
                testCaseIds: [],
                informationIds: [],
                lastModified: Date.now()
            }
        ];

        render(
            <DetailedRequirementView
                requirements={mockRequirements}
                onEdit={mockOnEdit}
                visibleColumns={defaultColumns}
                showProjectColumn={true}
                projects={mockProjects}
            />
        );

        expect(screen.getByText('Project(s)')).toBeInTheDocument();
        expect(screen.getByText('Project A')).toBeInTheDocument();
    });
});
