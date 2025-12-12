import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestCaseList } from '../TestCaseList';
import type { TestCase, TestCaseColumnVisibility } from '../../types';

// Mock react-virtuoso to render all items (bypasses virtualization in tests)
vi.mock('react-virtuoso', () => ({
  TableVirtuoso: ({
    data,
    fixedHeaderContent,
    itemContent,
    components,
  }: {
    data: TestCase[];
    fixedHeaderContent: () => React.ReactNode;
    itemContent: (index: number, item: TestCase) => React.ReactNode;
    components: {
      Table: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }>;
      TableHead: React.ForwardRefExoticComponent<
        { children?: React.ReactNode } & React.RefAttributes<HTMLTableSectionElement>
      >;
      TableRow: React.FC<{ item: TestCase; children?: React.ReactNode }>;
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

const defaultColumns: TestCaseColumnVisibility = {
  idTitle: true,
  revision: true,
  description: true,
  requirements: true,
  priority: true,
  status: true,
  author: false,
  lastRun: true,
  created: false,
};

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
      dateCreated: Date.now(),
    },
  ];

  const mockOnEdit = vi.fn();

  beforeEach(() => {
    mockOnEdit.mockClear();
  });

  it('renders test cases', () => {
    render(
      <TestCaseList testCases={mockTestCases} onEdit={mockOnEdit} visibleColumns={defaultColumns} />
    );

    expect(screen.getByText('TC-001')).toBeInTheDocument();
    expect(screen.getByText('Verify Login')).toBeInTheDocument();
    expect(screen.getByText('Check login with valid creds')).toBeInTheDocument();
    expect(screen.getByText('passed')).toBeInTheDocument();
  });

  it('calls onEdit when row is clicked', () => {
    render(
      <TestCaseList testCases={mockTestCases} onEdit={mockOnEdit} visibleColumns={defaultColumns} />
    );

    fireEvent.click(screen.getByText('Verify Login'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTestCases[0]);
  });

  it('renders empty state', () => {
    render(<TestCaseList testCases={[]} onEdit={mockOnEdit} visibleColumns={defaultColumns} />);

    expect(screen.getByText('No test cases found. Create one to get started.')).toBeInTheDocument();
  });
});
