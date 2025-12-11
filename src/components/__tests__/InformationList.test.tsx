import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InformationList } from '../InformationList';
import type { Information, InformationColumnVisibility } from '../../types';

const defaultColumns: InformationColumnVisibility = {
  idTitle: true,
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
      />
    );

    fireEvent.click(screen.getByText('System Architecture'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockInformation[0]);
  });

  it('renders empty state', () => {
    render(
      <InformationList information={[]} onEdit={mockOnEdit} visibleColumns={defaultColumns} />
    );

    expect(
      screen.getByText('No information artifacts found. Create one to get started.')
    ).toBeInTheDocument();
  });
});
