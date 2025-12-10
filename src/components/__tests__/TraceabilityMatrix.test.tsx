import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TraceabilityMatrix } from '../TraceabilityMatrix';
import type { Requirement } from '../../types';

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

      text: '',
      rationale: '',
      linkedArtifacts: [{ targetId: 'REQ-003', type: 'relates_to' }],
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

      text: '',
      rationale: '',
    },
  ];

  it('renders matrix structure correctly', () => {
    render(<TraceabilityMatrix requirements={mockRequirements} />);

    expect(screen.getByText('Traceability Matrix')).toBeInTheDocument();
    // Check row headers
    expect(screen.getAllByText('REQ-001')).toHaveLength(2); // Row header + Column header
    expect(screen.getAllByText('REQ-002')).toHaveLength(2);
    expect(screen.getAllByText('REQ-003')).toHaveLength(2);
  });

  it('renders linkedArtifacts relationships', () => {
    render(<TraceabilityMatrix requirements={mockRequirements} />);

    // REQ-001 relates_to REQ-003 (via linkedArtifacts)
    // Should show the relates_to symbol
    const linkCells = screen.getAllByText('↔');
    expect(linkCells.length).toBeGreaterThan(0);
  });

  it('renders explicit links', () => {
    render(<TraceabilityMatrix requirements={mockRequirements} />);

    // REQ-001 relates to REQ-003 (via linkedArtifacts)
    const linkCells = screen.getAllByText('↔');
    expect(linkCells.length).toBeGreaterThanOrEqual(2);
  });

  it('renders self-reference cells as empty/dash', () => {
    render(<TraceabilityMatrix requirements={mockRequirements} />);

    // There should be dashes for diagonal cells (same req)
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThan(0);
  });
});
