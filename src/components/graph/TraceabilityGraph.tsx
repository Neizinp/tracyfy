import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Maximize2, RotateCw } from 'lucide-react';
import type { UnifiedArtifact, ArtifactType } from '../traceability';
import { TRACE_TYPES, ALL_TRACE_TYPES, TypeFilterButtons } from '../traceability';
import {
  transformArtifactsToNodes,
  transformLinksToEdges,
  type LayoutAlgorithm,
  getNodeColor,
} from '../../utils/graphUtils';
import { ArtifactNode } from './ArtifactNode';

interface TraceabilityGraphProps {
  artifacts: UnifiedArtifact[];
  links: {
    sourceId: string;
    targetId: string;
    type: string;
    sourceType: ArtifactType;
    targetType: ArtifactType;
  }[];
  selectedTypes: Set<ArtifactType>;
  onSelectArtifact?: (artifactId: string) => void;
  onToggleType?: (type: ArtifactType) => void;
}

const nodeTypes = {
  artifact: ArtifactNode,
};

export const TraceabilityGraph: React.FC<TraceabilityGraphProps> = ({
  artifacts,
  links,
  selectedTypes,
  onSelectArtifact,
  onToggleType,
}) => {
  const [layout, setLayout] = useState<LayoutAlgorithm>('force');

  // Track selected node for highlighting connected nodes
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Filter artifacts by selected types
  const filteredArtifacts = useMemo(() => {
    if (selectedTypes.size === ALL_TRACE_TYPES.length) return artifacts;
    return artifacts.filter((a) => selectedTypes.has(a.type));
  }, [artifacts, selectedTypes]);

  // Filter links - only show if both source and target are in filtered artifacts
  const filteredLinks = useMemo(() => {
    const artifactIds = new Set(filteredArtifacts.map((a) => a.id));
    return links.filter((l) => artifactIds.has(l.sourceId) && artifactIds.has(l.targetId));
  }, [links, filteredArtifacts]);

  // Compute connected node IDs for the selected node
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const connected = new Set<string>();
    filteredLinks.forEach((link) => {
      if (link.sourceId === selectedNodeId) {
        connected.add(link.targetId);
      }
      if (link.targetId === selectedNodeId) {
        connected.add(link.sourceId);
      }
    });
    return connected;
  }, [selectedNodeId, filteredLinks]);

  // Transform to React Flow format with highlighting info
  const initialNodes = useMemo(
    () => transformArtifactsToNodes(filteredArtifacts, layout, selectedNodeId, connectedNodeIds),
    [filteredArtifacts, layout, selectedNodeId, connectedNodeIds]
  );

  const initialEdges = useMemo(
    () => transformLinksToEdges(filteredLinks, selectedNodeId),
    [filteredLinks, selectedNodeId]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      setSelectedNodeId((prevId) => (prevId === node.id ? null : node.id));
      if (onSelectArtifact) {
        onSelectArtifact(node.id);
      }
    },
    [onSelectArtifact]
  );

  // Re-apply layout
  const handleReLayout = useCallback(() => {
    const newNodes = transformArtifactsToNodes(
      filteredArtifacts,
      layout,
      selectedNodeId,
      connectedNodeIds
    );
    setNodes(newNodes);
  }, [filteredArtifacts, layout, setNodes, selectedNodeId, connectedNodeIds]);

  // Handle layout change
  const handleLayoutChange = useCallback(
    (newLayout: LayoutAlgorithm) => {
      setLayout(newLayout);
      const newNodes = transformArtifactsToNodes(
        filteredArtifacts,
        newLayout,
        selectedNodeId,
        connectedNodeIds
      );
      setNodes(newNodes);
    },
    [filteredArtifacts, setNodes, selectedNodeId, connectedNodeIds]
  );

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Controls bar */}
      <div
        style={{
          padding: 'var(--spacing-md)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-bg-secondary)',
          flexWrap: 'wrap',
          gap: 'var(--spacing-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-primary)',
            }}
          >
            Graph View
          </h3>

          {/* Layout selector */}
          <select
            value={layout}
            onChange={(e) => handleLayoutChange(e.target.value as LayoutAlgorithm)}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
            }}
          >
            <option value="force">Force Layout</option>
            <option value="hierarchical">Hierarchical</option>
            <option value="dagre">Dagre</option>
          </select>

          <button
            type="button"
            onClick={handleReLayout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
            }}
          >
            <RotateCw size={14} />
            Re-arrange
          </button>

          {/* Artifact Type Filter Buttons */}
          {onToggleType && (
            <div style={{ marginLeft: 'var(--spacing-sm)' }}>
              <TypeFilterButtons selectedTypes={selectedTypes} onToggle={onToggleType} />
            </div>
          )}
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-lg)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span>
            <strong>{filteredArtifacts.length}</strong> nodes
          </span>
          <span>
            <strong>{filteredLinks.length}</strong> edges
          </span>
        </div>
      </div>

      {/* Graph canvas */}
      <div style={{ height: '600px', width: '100%' }}>
        {filteredArtifacts.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--color-text-muted)',
              gap: 'var(--spacing-md)',
            }}
          >
            <Maximize2 size={48} style={{ opacity: 0.3 }} />
            <p>No artifacts to display. Try adjusting the filters.</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            attributionPosition="bottom-right"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            <Background color="var(--color-border)" gap={16} />
            <Controls
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
            <MiniMap
              nodeColor={(node) => {
                const data = node.data as { artifactType: ArtifactType };
                return getNodeColor(data.artifactType).border;
              }}
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          padding: 'var(--spacing-md)',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-secondary)',
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--spacing-lg)',
          flexWrap: 'wrap',
          fontSize: 'var(--font-size-xs)',
        }}
      >
        {TRACE_TYPES.map(({ type, label }) => {
          const colors = getNodeColor(type);
          return (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: colors.bg,
                  border: `2px solid ${colors.border}`,
                }}
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
