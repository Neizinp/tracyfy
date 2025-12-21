import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequirementList } from '../RequirementList';
import type { Requirement, ColumnVisibility, Project } from '../../types';
import { useProject, useCustomAttributes } from '../../app/providers';

// Mock ReactMarkdown to avoid ESM issues and simplify testing
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('remark-gfm', () => ({ default: () => {} }));
vi.mock('rehype-raw', () => ({ default: () => {} }));

// Mock hooks
vi.mock('../../app/providers', () => ({
  useProject: vi.fn(() => ({
    projects: [],
  })),
  useCustomAttributes: vi.fn(() => ({
    definitions: [],
  })),
}));

// Mock react-virtuoso to render all items (bypasses virtualization in tests)
vi.mock('react-virtuoso', () => ({
  TableVirtuoso: ({
    data,
    fixedHeaderContent,
    itemContent,
    components,
  }: {
    data: Requirement[];
    fixedHeaderContent: () => React.ReactNode;
    itemContent: (index: number, item: Requirement) => React.ReactNode;
    components: {
      Table: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }>;
      TableHead: React.ForwardRefExoticComponent<
        { children?: React.ReactNode } & React.RefAttributes<HTMLTableSectionElement>
      >;
      TableRow: React.FC<{ item: Requirement; children?: React.ReactNode }>;
    };
  }) => {
    const Table = components.Table;
    const TableRow = components.TableRow;
    return (
      <Table>
        <thead>{fixedHeaderContent()}</thead>
        <tbody>
          {data.map((item, index) => (
            <TableRow key={item.id} item={item}>
              {itemContent(index, item)}
            </TableRow>
          ))}
        </tbody>
      </Table>
    );
  },
}));

describe('RequirementList', () => {
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
      text: '',
      rationale: '',
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
      text: '',
      rationale: '',
    },
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
    approved: true,
    projects: true,
  };

  beforeEach(() => {
    mockOnEdit.mockClear();
    vi.mocked(useProject).mockReturnValue({
      projects: [],
      currentProjectId: '',
      currentProject: null,
      isLoading: false,
      switchProject: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      addToProject: vi.fn(),
    });
    vi.mocked(useCustomAttributes).mockReturnValue({
      definitions: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
      getDefinitionsForType: vi.fn(),
    });
  });

  it('renders requirements correctly', () => {
    render(
      <RequirementList
        requirements={mockRequirements}
        onEdit={mockOnEdit}
        visibleColumns={defaultColumns}
        sortConfig={{ key: 'idTitle', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    expect(screen.getByText('REQ-001')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('REQ-002')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('handles row click to edit', () => {
    render(
      <RequirementList
        requirements={mockRequirements}
        onEdit={mockOnEdit}
        visibleColumns={defaultColumns}
        sortConfig={{ key: 'id', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Login'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockRequirements[0]);
  });

  it('respects column visibility', () => {
    const hiddenColumns: ColumnVisibility = {
      ...defaultColumns,
      description: false,
      priority: false,
    };

    render(
      <RequirementList
        requirements={mockRequirements}
        onEdit={mockOnEdit}
        visibleColumns={hiddenColumns}
        sortConfig={{ key: 'id', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    expect(screen.queryByText('Description')).not.toBeInTheDocument();
    expect(screen.queryByText('Priority')).not.toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders empty state message', () => {
    render(
      <RequirementList
        requirements={[]}
        onEdit={mockOnEdit}
        visibleColumns={defaultColumns}
        sortConfig={{ key: 'id', direction: 'asc' }}
        onSortChange={vi.fn()}
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
        riskIds: [],
        lastModified: Date.now(),
      },
    ];

    vi.mocked(useProject).mockReturnValue({
      projects: mockProjects,
      currentProjectId: '',
      currentProject: null,
      isLoading: false,
      switchProject: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      addToProject: vi.fn(),
    });

    render(
      <RequirementList
        requirements={mockRequirements}
        onEdit={mockOnEdit}
        visibleColumns={defaultColumns}
        sortConfig={{ key: 'idTitle', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    expect(screen.getByText('Project(s)')).toBeInTheDocument();
    expect(screen.getByText('Project A')).toBeInTheDocument();
  });
});
