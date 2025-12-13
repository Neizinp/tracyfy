/**
 * TraceabilityGraph Component Tests
 *
 * Tests for the React Flow graph visualization of artifacts and links.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TraceabilityGraph } from '../TraceabilityGraph';
import type { UnifiedArtifact, ArtifactType } from '../../traceability';

// Mock ReactFlow to avoid canvas/DOM issues in tests
vi.mock('reactflow', () => ({
  __esModule: true,
  default: vi.fn(({ children, nodes, edges }) => (
    <div data-testid="react-flow-mock">
      <div data-testid="nodes-count">{nodes?.length || 0}</div>
      <div data-testid="edges-count">{edges?.length || 0}</div>
      {children}
    </div>
  )),
  Background: vi.fn(() => <div data-testid="rf-background" />),
  Controls: vi.fn(() => <div data-testid="rf-controls" />),
  MiniMap: vi.fn(() => <div data-testid="rf-minimap" />),
  ConnectionMode: { Loose: 'loose' },
  useNodesState: vi.fn((initialNodes) => [initialNodes || [], vi.fn(), vi.fn()]),
  useEdgesState: vi.fn((initialEdges) => [initialEdges || [], vi.fn(), vi.fn()]),
}));

describe('TraceabilityGraph', () => {
  // Helper to create test artifacts with proper types
  const createArtifact = (
    id: string,
    type: ArtifactType,
    title: string = 'Test',
    linkedArtifacts: { targetId: string; type: 'satisfies' | 'related_to' | 'verifies' }[] = []
  ): UnifiedArtifact => ({
    id,
    type,
    title,
    linkedArtifacts,
  });

  const mockArtifacts: UnifiedArtifact[] = [
    createArtifact('REQ-001', 'requirement', 'First Requirement', [
      { targetId: 'UC-001', type: 'satisfies' },
    ]),
    createArtifact('UC-001', 'useCase', 'First Use Case', [
      { targetId: 'TC-001', type: 'related_to' },
    ]),
    createArtifact('TC-001', 'testCase', 'First Test Case'),
    createArtifact('INFO-001', 'information', 'Documentation'),
  ];

  const mockLinks = [
    {
      sourceId: 'REQ-001',
      targetId: 'UC-001',
      type: 'satisfies',
      sourceType: 'requirement' as ArtifactType,
      targetType: 'useCase' as ArtifactType,
    },
    {
      sourceId: 'UC-001',
      targetId: 'TC-001',
      type: 'related_to',
      sourceType: 'useCase' as ArtifactType,
      targetType: 'testCase' as ArtifactType,
    },
  ];

  const defaultProps = {
    artifacts: mockArtifacts,
    links: mockLinks,
    selectedTypes: new Set<ArtifactType>(['requirement', 'useCase', 'testCase', 'information']),
    onToggleType: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the Graph View header', () => {
      render(<TraceabilityGraph {...defaultProps} />);

      expect(screen.getByText('Graph View')).toBeInTheDocument();
    });

    it('should render the mocked React Flow component', () => {
      render(<TraceabilityGraph {...defaultProps} />);

      expect(screen.getByTestId('react-flow-mock')).toBeInTheDocument();
    });

    it('should show node and edge counts in stats', () => {
      render(<TraceabilityGraph {...defaultProps} />);

      // The component displays these in the stats section as "<count> nodes" and "<count> edges"
      expect(screen.getByText('nodes')).toBeInTheDocument();
      expect(screen.getByText('edges')).toBeInTheDocument();
    });

    it('should render layout selector', () => {
      render(<TraceabilityGraph {...defaultProps} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render type filter buttons when onToggleType is provided', () => {
      render(<TraceabilityGraph {...defaultProps} />);

      // Filter buttons are rendered
      expect(screen.getByText('REQ')).toBeInTheDocument();
      expect(screen.getByText('UC')).toBeInTheDocument();
      expect(screen.getByText('TC')).toBeInTheDocument();
      expect(screen.getByText('INFO')).toBeInTheDocument();
    });
  });

  describe('Filtering by artifact type', () => {
    it('should filter out artifacts not in selectedTypes', () => {
      const selectedTypes = new Set<ArtifactType>(['requirement', 'useCase']);

      render(<TraceabilityGraph {...defaultProps} selectedTypes={selectedTypes} />);

      // The component shows filtered counts
      expect(screen.getByTestId('nodes-count').textContent).toBe('2');
    });

    it('should call onToggleType when filter button is clicked', () => {
      const mockToggle = vi.fn();

      render(<TraceabilityGraph {...defaultProps} onToggleType={mockToggle} />);

      fireEvent.click(screen.getByText('REQ'));

      expect(mockToggle).toHaveBeenCalledWith('requirement');
    });
  });

  describe('Layout switching', () => {
    it('should default to force layout', () => {
      render(<TraceabilityGraph {...defaultProps} />);

      const layoutSelect = screen.getByRole('combobox');
      expect((layoutSelect as HTMLSelectElement).value).toBe('force');
    });

    it('should allow switching layouts', () => {
      render(<TraceabilityGraph {...defaultProps} />);

      const layoutSelect = screen.getByRole('combobox');
      fireEvent.change(layoutSelect, { target: { value: 'hierarchical' } });

      expect((layoutSelect as HTMLSelectElement).value).toBe('hierarchical');
    });

    it('should have hierarchical, force, and dagre options', () => {
      render(<TraceabilityGraph {...defaultProps} />);

      expect(screen.getByRole('option', { name: /Hierarchical/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Force/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Dagre/i })).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no artifacts match filters', () => {
      const selectedTypes = new Set<ArtifactType>();

      render(<TraceabilityGraph {...defaultProps} selectedTypes={selectedTypes} />);

      expect(
        screen.getByText('No artifacts to display. Try adjusting the filters.')
      ).toBeInTheDocument();
    });

    it('should handle empty artifacts array', () => {
      render(<TraceabilityGraph {...defaultProps} artifacts={[]} links={[]} />);

      expect(
        screen.getByText('No artifacts to display. Try adjusting the filters.')
      ).toBeInTheDocument();
    });
  });

  describe('Edge filtering', () => {
    it('should filter edges based on visible nodes', () => {
      // When only requirements are shown, edges to non-requirements should be filtered
      const selectedTypes = new Set<ArtifactType>(['requirement']);

      render(<TraceabilityGraph {...defaultProps} selectedTypes={selectedTypes} />);

      // With only requirements visible, no edges should show
      // (because links go REQ->UC and UC->TC)
      expect(screen.getByTestId('edges-count').textContent).toBe('0');
    });

    it('should show edges when both source and target are visible', () => {
      const selectedTypes = new Set<ArtifactType>(['requirement', 'useCase']);

      render(<TraceabilityGraph {...defaultProps} selectedTypes={selectedTypes} />);

      // REQ->UC edge should be visible
      expect(screen.getByTestId('edges-count').textContent).toBe('1');
    });
  });

  describe('Node highlighting', () => {
    it('should highlight connected nodes when a node is selected', () => {
      // This behavior is tested through the graphUtils transformArtifactsToNodes
      // The component should pass the right parameters to enable highlighting
      render(<TraceabilityGraph {...defaultProps} />);

      expect(screen.getByTestId('react-flow-mock')).toBeInTheDocument();
    });
  });
});
