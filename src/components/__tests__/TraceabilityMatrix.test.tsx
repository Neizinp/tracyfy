import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TraceabilityMatrix } from '../TraceabilityMatrix';
import type { Requirement, UseCase, TestCase, Information } from '../../types';

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
      linkedArtifacts: [{ targetId: 'REQ-003', type: 'related_to' }],
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

  const mockUseCases: UseCase[] = [
    {
      id: 'UC-001',
      title: 'Test Use Case',
      description: '',
      actor: 'User',
      preconditions: '',
      postconditions: '',
      mainFlow: '',
      priority: 'medium',
      status: 'draft',
      revision: '01',
      lastModified: Date.now(),
      linkedArtifacts: [{ targetId: 'REQ-001', type: 'satisfies' }],
    },
  ];

  const mockTestCases: TestCase[] = [
    {
      id: 'TC-001',
      title: 'Test Case',
      description: '',
      requirementIds: ['REQ-001'],
      status: 'draft',
      priority: 'medium',
      revision: '01',
      dateCreated: Date.now(),
      lastModified: Date.now(),
      linkedArtifacts: [{ targetId: 'REQ-001', type: 'verifies' }],
    },
  ];

  const mockInformation: Information[] = [
    {
      id: 'INFO-001',
      title: 'Test Info',
      content: '',
      type: 'note',
      revision: '01',
      dateCreated: Date.now(),
      lastModified: Date.now(),
    },
  ];

  const defaultProps = {
    requirements: mockRequirements,
    useCases: mockUseCases,
    testCases: mockTestCases,
    information: mockInformation,
  };

  it('renders matrix structure correctly', () => {
    render(<TraceabilityMatrix {...defaultProps} />);

    expect(screen.getByText('From / To')).toBeInTheDocument();
    // Check row headers - REQ-001 appears in row and column
    expect(screen.getAllByText('REQ-001').length).toBeGreaterThanOrEqual(2);
  });

  it('renders filter toggle buttons', () => {
    render(<TraceabilityMatrix {...defaultProps} />);

    expect(screen.getByText('Requirements (3)')).toBeInTheDocument();
    expect(screen.getByText('Use Cases (1)')).toBeInTheDocument();
    expect(screen.getByText('Test Cases (1)')).toBeInTheDocument();
    expect(screen.getByText('Information (1)')).toBeInTheDocument();
  });

  it('filters artifacts when toggle is clicked', () => {
    render(<TraceabilityMatrix {...defaultProps} />);

    // Initially UC-001 should be visible
    expect(screen.getAllByText('UC-001').length).toBeGreaterThanOrEqual(1);

    // Click the Use Cases toggle to hide them
    const useCaseToggle = screen.getByText('Use Cases (1)');
    fireEvent.click(useCaseToggle);

    // UC-001 should no longer be in the matrix
    expect(screen.queryByText('UC-001')).not.toBeInTheDocument();
  });

  it('renders linkedArtifacts relationships', () => {
    render(<TraceabilityMatrix {...defaultProps} />);

    // REQ-001 related_to REQ-003 (via linkedArtifacts)
    // Should show the related_to symbol
    const linkCells = screen.getAllByText('↔');
    expect(linkCells.length).toBeGreaterThan(0);
  });

  it('renders cross-artifact links', () => {
    render(<TraceabilityMatrix {...defaultProps} />);

    // UC-001 satisfies REQ-001
    const satisfiesSymbols = screen.getAllByText('✓');
    expect(satisfiesSymbols.length).toBeGreaterThan(0);

    // TC-001 verifies REQ-001
    const verifiesSymbols = screen.getAllByText('✔');
    expect(verifiesSymbols.length).toBeGreaterThan(0);
  });

  it('renders self-reference cells with special marker', () => {
    render(<TraceabilityMatrix {...defaultProps} />);

    // Diagonal cells show ● for same artifact
    const selfMarkers = screen.getAllByText('●');
    expect(selfMarkers.length).toBeGreaterThanOrEqual(1);
  });

  it('displays legend with all relationship types', () => {
    render(<TraceabilityMatrix {...defaultProps} />);

    expect(screen.getByText('Legend:')).toBeInTheDocument();
    expect(screen.getByText('parent')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
    expect(screen.getByText('depends on')).toBeInTheDocument();
    expect(screen.getByText('related to')).toBeInTheDocument();
  });

  it('shows empty state when all filters are off', () => {
    render(<TraceabilityMatrix {...defaultProps} />);

    // Turn off all filters
    fireEvent.click(screen.getByText('Requirements (3)'));
    fireEvent.click(screen.getByText('Use Cases (1)'));
    fireEvent.click(screen.getByText('Test Cases (1)'));
    fireEvent.click(screen.getByText('Information (1)'));

    expect(
      screen.getByText('No artifacts to display. Enable at least one artifact type above.')
    ).toBeInTheDocument();
  });

  it('hides unlinked artifacts when Show Unlinked is toggled off', () => {
    render(<TraceabilityMatrix {...defaultProps} />);

    // INFO-001 has no links, should be visible initially
    expect(screen.getAllByText('INFO-001').length).toBeGreaterThanOrEqual(1);

    // Toggle off Show Unlinked
    fireEvent.click(screen.getByText('Show Unlinked'));

    // INFO-001 should be hidden now (no links to/from it)
    expect(screen.queryByText('INFO-001')).not.toBeInTheDocument();

    // But REQ-001 should still be visible (has links)
    expect(screen.getAllByText('REQ-001').length).toBeGreaterThanOrEqual(1);
  });
});
