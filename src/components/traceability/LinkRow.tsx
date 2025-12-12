import React from 'react';
import type { ArtifactType } from './types';
import { TYPE_COLORS } from './types';

interface LinkRowProps {
  sourceId: string;
  targetId: string;
  linkType: string;
  sourceType: ArtifactType;
  targetType: ArtifactType;
  onClickSource?: () => void;
  onClickTarget?: () => void;
}

export const LinkRow: React.FC<LinkRowProps> = ({
  sourceId,
  targetId,
  linkType,
  sourceType,
  targetType,
  onClickSource,
  onClickTarget,
}) => {
  const sourceColors = TYPE_COLORS[sourceType];
  const targetColors = TYPE_COLORS[targetType];

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
            borderRadius: '4px',
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
            borderRadius: '4px',
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
            borderRadius: '4px',
          }}
        >
          {targetId}
        </span>
      </td>
    </tr>
  );
};
