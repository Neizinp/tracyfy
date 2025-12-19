import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InformationList } from '../InformationList';
import type { Information, InformationColumnVisibility } from '../../types';

// Mock react-virtuoso to render all items (bypasses virtualization in tests)
vi.mock('react-virtuoso', () => ({
  TableVirtuoso: ({
    data,
    fixedHeaderContent,
    itemContent,
    components,
  }: {
    data: Information[];
    fixedHeaderContent: () => React.ReactNode;
    itemContent: (index: number, item: Information) => React.ReactNode;
    components: {
      Table: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }>;
      TableHead: React.ForwardRefExoticComponent<{
        children?: React.RefAttributes<HTMLTableSectionElement>;
      }>;
      TableRow: React.FC<{ item: Information; children?: React.ReactNode }>;
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

const defaultColumns: InformationColumnVisibility = {
  idTitle: true,
  revision: true,
  type: true,
  content: true,
  created: true,
};

describe('InformationList', () => {
  const mockInformation: Information[] = [
    {
      id: 'INFO-001',
      title: 'System Architecture',
      content: 'High level diagram...',
      type: 'other',
      revision: '01',
      lastModified: Date.now(),
      dateCreated: Date.now(),
    },
  ];

  const mockOnEdit = vi.fn();

  beforeEach(() => {
    mockOnEdit.mockClear();
  });

  it('renders information items', () => {
    render(
      <InformationList
        information={mockInformation}
        onEdit={mockOnEdit}
        visibleColumns={defaultColumns}
        sortConfig={{ key: 'id', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    expect(screen.getByText('INFO-001')).toBeInTheDocument();
    expect(screen.getByText('System Architecture')).toBeInTheDocument();
    expect(screen.getByText('High level diagram...')).toBeInTheDocument();
    expect(screen.getByText('other')).toBeInTheDocument();
  });

  it('calls onEdit when card is clicked', () => {
    render(
      <InformationList
        information={mockInformation}
        onEdit={mockOnEdit}
        visibleColumns={defaultColumns}
        sortConfig={{ key: 'id', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('System Architecture'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockInformation[0]);
  });

  it('renders empty state', () => {
    render(
      <InformationList
        information={[]}
        onEdit={mockOnEdit}
        visibleColumns={defaultColumns}
        sortConfig={{ key: 'id', direction: 'asc' }}
        onSortChange={vi.fn()}
      />
    );

    expect(
      screen.getByText('No information artifacts found. Create one to get started.')
    ).toBeInTheDocument();
  });
});
