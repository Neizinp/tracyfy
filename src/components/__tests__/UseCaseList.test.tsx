import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UseCaseList } from '../UseCaseList';
import type { UseCase, Project } from '../../types';
import { useProject, useCustomAttributes } from '../../app/providers';

// Mock hooks
vi.mock('../../app/providers', () => ({
  useProject: vi.fn(),
  useCustomAttributes: vi.fn(),
}));

// Mock react-virtuoso to render all items (bypasses virtualization in tests)
vi.mock('react-virtuoso', () => ({
  TableVirtuoso: ({
    data,
    fixedHeaderContent,
    itemContent,
    components,
  }: {
    data: UseCase[];
    fixedHeaderContent: () => React.ReactNode;
    itemContent: (index: number, item: UseCase) => React.ReactNode;
    components: {
      Table: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }>;
      TableHead: React.ForwardRefExoticComponent<
        { children?: React.ReactNode } & React.RefAttributes<HTMLTableSectionElement>
      >;
      TableRow: React.FC<{ item: UseCase; children?: React.ReactNode }>;
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

const visibleColumns = {
  idTitle: true,
  description: true,
  actor: true,
  priority: true,
  status: true,
  preconditions: false,
  mainFlow: false,
  alternativeFlows: false,
  postconditions: false,
  projects: true,
  created: true,
  author: true,
  revision: true,
};

describe('UseCaseList', () => {
  const mockUseCases: UseCase[] = [
    {
      id: 'UC-001',
      title: 'Login',
      description: 'User logs in',
      actor: 'User',
      preconditions: 'None',
      postconditions: 'Logged in',
      mainFlow: '1. Enter creds',
      alternativeFlows: '',
      priority: 'high',
      status: 'implemented',
      revision: '01',
      lastModified: Date.now(),
    },
  ];

  const mockOnEdit = vi.fn();

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

  it('renders use cases', () => {
    render(
      <UseCaseList
        useCases={mockUseCases}
        onEdit={mockOnEdit}
        visibleColumns={visibleColumns}
        sortConfig={{ key: 'idTitle', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    expect(screen.getByText('UC-001')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('calls onEdit when use case is clicked', () => {
    render(
      <UseCaseList
        useCases={mockUseCases}
        onEdit={mockOnEdit}
        visibleColumns={visibleColumns}
        sortConfig={{ key: 'idTitle', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Login'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockUseCases[0]);
  });

  it('renders project names', () => {
    const mockProjects: Project[] = [
      {
        id: 'proj-1',
        name: 'Project A',
        description: '',
        useCaseIds: ['UC-001'],
        requirementIds: [],
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
      <UseCaseList
        useCases={mockUseCases}
        onEdit={mockOnEdit}
        visibleColumns={visibleColumns}
        sortConfig={{ key: 'idTitle', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    expect(screen.getByText('Project A')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <UseCaseList
        useCases={[]}
        onEdit={mockOnEdit}
        visibleColumns={visibleColumns}
        sortConfig={{ key: 'idTitle', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    expect(screen.getByText('No use cases found. Create one to get started.')).toBeInTheDocument();
  });
});
