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
import { TYPE_COLORS } from '../traceability';
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

  // Filter artifacts by selected types
  const filteredArtifacts = useMemo(() => {
    if (selectedTypes.size === 4) return artifacts;
    return artifacts.filter((a) => selectedTypes.has(a.type));
  }, [artifacts, selectedTypes]);

  // Filter links - only show if both source and target are in filtered artifacts
  const filteredLinks = useMemo(() => {
    const artifactIds = new Set(filteredArtifacts.map((a) => a.id));
    return links.filter((l) => artifactIds.has(l.sourceId) && artifactIds.has(l.targetId));
  }, [links, filteredArtifacts]);

  // Transform to React Flow format
  const initialNodes = useMemo(
    () => transformArtifactsToNodes(filteredArtifacts, layout),
    [filteredArtifacts, layout]
  );

  const initialEdges = useMemo(() => transformLinksToEdges(filteredLinks), [filteredLinks]);

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
      if (onSelectArtifact) {
        onSelectArtifact(node.id);
      }
    },
    [onSelectArtifact]
  );

  // Re-apply layout
  const handleReLayout = useCallback(() => {
    const newNodes = transformArtifactsToNodes(filteredArtifacts, layout);
    setNodes(newNodes);
  }, [filteredArtifacts, layout, setNodes]);

  // Handle layout change
  const handleLayoutChange = useCallback(
    (newLayout: LayoutAlgorithm) => {
      setLayout(newLayout);
      const newNodes = transformArtifactsToNodes(filteredArtifacts, newLayout);
      setNodes(newNodes);
    },
    [filteredArtifacts, setNodes]
  );

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: '8px',
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
              borderRadius: '6px',
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
              borderRadius: '6px',
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
            <div style={{ display: 'flex', gap: '4px', marginLeft: 'var(--spacing-sm)' }}>
              {[
                { type: 'useCase' as ArtifactType, label: 'UC', color: TYPE_COLORS.useCase.text },
                {
                  type: 'requirement' as ArtifactType,
                  label: 'REQ',
                  color: TYPE_COLORS.requirement.text,
                },
                { type: 'testCase' as ArtifactType, label: 'TC', color: TYPE_COLORS.testCase.text },
                {
                  type: 'information' as ArtifactType,
                  label: 'INFO',
                  color: TYPE_COLORS.information.text,
                },
              ].map(({ type, label, color }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onToggleType(type)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: selectedTypes.has(type)
                      ? `2px solid ${color}`
                      : '2px solid var(--color-border)',
                    backgroundColor: selectedTypes.has(type) ? `${color}20` : 'transparent',
                    color: selectedTypes.has(type) ? color : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
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
                borderRadius: '6px',
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
                borderRadius: '6px',
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
        {[
          { type: 'requirement' as ArtifactType, label: 'Requirements' },
          { type: 'useCase' as ArtifactType, label: 'Use Cases' },
          { type: 'testCase' as ArtifactType, label: 'Test Cases' },
          { type: 'information' as ArtifactType, label: 'Information' },
        ].map(({ type, label }) => {
          const colors = getNodeColor(type);
          return (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
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
