import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentList } from '../DocumentList';
import type { ArtifactDocument, DocumentColumnVisibility } from '../../types';
import { useProject, useCustomAttributes } from '../../app/providers';

// Mock hooks
vi.mock('../../app/providers', () => ({
  useProject: vi.fn(),
  useCustomAttributes: vi.fn(),
}));

// Mock react-virtuoso to render all items
vi.mock('react-virtuoso', () => ({
  TableVirtuoso: ({
    data,
    fixedHeaderContent,
    itemContent,
    components,
  }: {
    data: ArtifactDocument[];
    fixedHeaderContent: () => React.ReactNode;
    itemContent: (index: number, item: ArtifactDocument) => React.ReactNode;
    components: {
      Table: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }>;
      TableRow: React.FC<{ item: ArtifactDocument; children?: React.ReactNode }>;
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

const defaultColumns: DocumentColumnVisibility = {
  idTitle: true,
  description: true,
  structure: true,
  created: true,
  revision: true,
  projects: true,
  author: true,
  status: true,
};

describe('DocumentList', () => {
  const mockDocuments: ArtifactDocument[] = [
    {
      id: 'DOC-001',
      title: 'Project Roadmap',
      description: 'The strategy for the next 6 months',
      projectId: 'PROJ-1',
      status: 'approved',
      author: 'John Doe',
      structure: [{ type: 'heading', title: 'Phase 1', level: 1 }],
      revision: '01',
      dateCreated: Date.now(),
      lastModified: Date.now(),
    },
  ];

  const mockOnEdit = vi.fn();

  beforeEach(() => {
    mockOnEdit.mockClear();
    vi.mocked(useProject).mockReturnValue({
      projects: [
        {
          id: 'PROJ-1',
          name: 'Main Project',
          description: '',
          requirementIds: [],
          useCaseIds: [],
          testCaseIds: [],
          informationIds: [],
          riskIds: [],
          documentIds: [],
          lastModified: Date.now(),
        },
      ],
      currentProjectId: 'PROJ-1',
      currentProject: {
        id: 'PROJ-1',
        name: 'Main Project',
        description: '',
        requirementIds: [],
        useCaseIds: [],
        testCaseIds: [],
        informationIds: [],
        riskIds: [],
        documentIds: [],
        lastModified: Date.now(),
      },
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

  it('renders document items', () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onEdit={mockOnEdit}
        visibleColumns={defaultColumns}
        sortConfig={{ key: 'idTitle', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    expect(screen.getByText('DOC-001')).toBeInTheDocument();
    expect(screen.getByText('Project Roadmap')).toBeInTheDocument();
    expect(screen.getByText('The strategy for the next 6 months')).toBeInTheDocument();
    expect(screen.getByText('1 items')).toBeInTheDocument();
    expect(screen.getByText('approved')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('calls onEdit when row is clicked', () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onEdit={mockOnEdit}
        visibleColumns={defaultColumns}
        sortConfig={{ key: 'idTitle', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Project Roadmap'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockDocuments[0]);
  });

  it('renders empty state', () => {
    render(
      <DocumentList
        documents={[]}
        onEdit={mockOnEdit}
        visibleColumns={defaultColumns}
        sortConfig={{ key: 'idTitle', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    expect(screen.getByText('No documents found.')).toBeInTheDocument();
  });
});
