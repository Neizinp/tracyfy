import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TraceabilityMatrix } from '../TraceabilityMatrix';
import type { Requirement, Link } from '../../types';

describe('TraceabilityMatrix', () => {
  const mockRequirements: Requirement[] = [
    {
      id: 'REQ-001',
      title: 'Parent Req',
      description: '',
      status: 'draft',
      priority: 'medium',
      revision: '01',
      lastModified: Date.now(),
      dateCreated: Date.now(),
      parentIds: [],
      text: '',
      rationale: '',
    },
    {
      id: 'REQ-002',
      title: 'Child Req',
      description: '',
      status: 'draft',
      priority: 'medium',
      revision: '01',
      lastModified: Date.now(),
      dateCreated: Date.now(),
      parentIds: ['REQ-001'],
      text: '',
      rationale: '',
    },
    {
      id: 'REQ-003',
      title: 'Related Req',
      description: '',
      status: 'draft',
      priority: 'medium',
      revision: '01',
      lastModified: Date.now(),
      dateCreated: Date.now(),
      parentIds: [],
      text: '',
      rationale: '',
    },
  ];

  const mockLinks: Link[] = [
    {
      id: 'link-1',
      sourceId: 'REQ-001',
      targetId: 'REQ-003',
      type: 'relates_to',
      description: '',
    },
  ];

  it('renders matrix structure correctly', () => {
    render(<TraceabilityMatrix requirements={mockRequirements} links={mockLinks} />);

    expect(screen.getByText('Traceability Matrix')).toBeInTheDocument();
    // Check row headers
    expect(screen.getAllByText('REQ-001')).toHaveLength(2); // Row header + Column header
    expect(screen.getAllByText('REQ-002')).toHaveLength(2);
    expect(screen.getAllByText('REQ-003')).toHaveLength(2);
  });

  it('renders parent/child relationships', () => {
    render(<TraceabilityMatrix requirements={mockRequirements} links={mockLinks} />);

    // REQ-001 is parent of REQ-002
    // Row REQ-001, Col REQ-002 -> Parent indicator
    // Note: getAllByText because it appears in the table AND the legend
    const parentCells = screen.getAllByText('↓ P');
    expect(parentCells.length).toBeGreaterThanOrEqual(2);

    // Check that at least one is in the table (we could be more specific but this is enough for now)
    const tableCell = parentCells.find((el) => el.tagName === 'TD');
    expect(tableCell).toBeInTheDocument();
    expect(tableCell).toHaveStyle({ backgroundColor: 'rgba(34, 197, 94, 0.2)' }); // Greenish

    // Row REQ-002, Col REQ-001 -> Child indicator
    const childCells = screen.getAllByText('↑ C');
    expect(childCells.length).toBeGreaterThanOrEqual(2);
  });

  it('renders explicit links', () => {
    render(<TraceabilityMatrix requirements={mockRequirements} links={mockLinks} />);

    // REQ-001 relates to REQ-003
    const linkCells = screen.getAllByText('↔');
    expect(linkCells.length).toBeGreaterThanOrEqual(2);
  });

  it('renders self-reference cells as empty/dash', () => {
    render(<TraceabilityMatrix requirements={mockRequirements} links={mockLinks} />);

    // There should be dashes for diagonal cells (same req)
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThan(0);
  });
});
