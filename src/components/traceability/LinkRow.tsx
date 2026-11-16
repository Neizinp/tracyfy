import React from 'react';
import { Trash2 } from 'lucide-react';
import { kind, type ArtifactKindId } from '../../domain/artifactKinds';

interface LinkRowProps {
  sourceId: string;
  targetId: string;
  linkType: string;
  sourceType: ArtifactKindId;
  targetType: ArtifactKindId;
  onClickSource?: () => void;
  onClickTarget?: () => void;
  onDelete?: () => void;
}

export const LinkRow: React.FC<LinkRowProps> = ({
  sourceId,
  targetId,
  linkType,
  sourceType,
  targetType,
  onClickSource,
  onClickTarget,
  onDelete,
}) => {
  const sourceColors = kind(sourceType).color;
  const targetColors = kind(targetType).color;

  return (
    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
      <td style={{ padding: '8px 12px' }}>
        <span
          onClick={onClickSource}
          style={{
            fontFamily: 'monospace',
            fontWeight: 600,
            color: sourceColors.text,
            cursor: onClickSource ? 'pointer' : 'default',
            padding: '2px 6px',
            backgroundColor: sourceColors.bg,
            borderRadius: 'var(--radius-xs)',
          }}
        >
          {sourceId}
        </span>
      </td>
      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
        <span
          style={{
            padding: '2px 8px',
            backgroundColor: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-xs)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {(linkType || 'unknown').replace(/_/g, ' ')}
        </span>
      </td>
      <td style={{ padding: '8px 12px' }}>
        <span
          onClick={onClickTarget}
          style={{
            fontFamily: 'monospace',
            fontWeight: 600,
            color: targetColors.text,
            cursor: onClickTarget ? 'pointer' : 'default',
            padding: '2px 6px',
            backgroundColor: targetColors.bg,
            borderRadius: 'var(--radius-xs)',
          }}
        >
          {targetId}
        </span>
      </td>
      {onDelete && (
        <td style={{ padding: '8px 12px', textAlign: 'center', width: '40px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Delete link"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error-light)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            <Trash2 size={14} />
          </button>
        </td>
      )}
    </tr>
  );
};
