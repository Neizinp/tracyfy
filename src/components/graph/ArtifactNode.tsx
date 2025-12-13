import React from 'react';
import { Handle, Position } from 'reactflow';
import { Link2 } from 'lucide-react';
import type { NodeProps } from 'reactflow';
import type { ArtifactNodeData } from '../../utils/graphUtils';
import { getNodeColor } from '../../utils/graphUtils';

/**
 * Custom node component for rendering artifacts in the graph
 */
export const ArtifactNode: React.FC<NodeProps<ArtifactNodeData>> = ({ data, selected }) => {
  const colors = getNodeColor(data.artifactType);

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        border: `2px solid ${selected ? colors.border : 'var(--color-border)'}`,
        backgroundColor: selected ? `${colors.bg}40` : 'var(--color-bg-card)',
        minWidth: '200px',
        maxWidth: '220px',
        boxShadow: selected ? `0 4px 12px ${colors.border}40` : '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: colors.border,
          border: 'none',
        }}
      />

      {/* Header with type badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            color: colors.text,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {data.artifactType === 'useCase'
            ? 'UC'
            : data.artifactType === 'testCase'
              ? 'TC'
              : data.artifactType === 'information'
                ? 'INFO'
                : 'REQ'}
        </span>

        {/* Link count badge */}
        {data.linkCount > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-bg-tertiary)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Link2 size={10} />
            <span>{data.linkCount}</span>
          </div>
        )}
      </div>

      {/* Artifact ID */}
      <div
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: '4px',
        }}
      >
        {data.artifactId}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={data.title}
      >
        {data.title}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: colors.border,
          border: 'none',
        }}
      />
    </div>
  );
};
