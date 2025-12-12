import React from 'react';
import { XCircle, Plus, Trash2 } from 'lucide-react';
import type { GapInfo } from './types';
import { TYPE_COLORS, ISSUE_LABELS } from './types';

interface GapItemProps {
  gap: GapInfo;
  onClick?: () => void;
  onAddLink?: () => void;
  onRemoveOrphan?: () => void;
}

export const GapItem: React.FC<GapItemProps> = ({ gap, onClick, onAddLink, onRemoveOrphan }) => {
  const colors = TYPE_COLORS[gap.artifact.type];
  const issueInfo = ISSUE_LABELS[gap.issueType];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        backgroundColor: colors.bg,
        borderRadius: '6px',
        transition: 'background-color 0.15s',
      }}
    >
      <XCircle size={16} style={{ color: issueInfo.color }} />
      <span
        onClick={onClick}
        style={{
          fontFamily: 'monospace',
          fontWeight: 600,
          color: colors.text,
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        {gap.artifact.id}
      </span>
      <span
        style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', flex: 1 }}
      >
        {gap.artifact.title}
      </span>
      <span
        style={{
          fontSize: 'var(--font-size-xs)',
          padding: '2px 8px',
          backgroundColor: 'var(--color-bg-tertiary)',
          borderRadius: '4px',
          color: issueInfo.color,
          fontWeight: 500,
        }}
      >
        {issueInfo.label}
      </span>
      {gap.details && (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {gap.details}
        </span>
      )}
      {/* Quick action buttons */}
      {gap.issueType !== 'orphan_link' && onAddLink && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddLink();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: 'var(--font-size-xs)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
          title="Add a link to this artifact"
        >
          <Plus size={12} />
          Link
        </button>
      )}
      {gap.issueType === 'orphan_link' && onRemoveOrphan && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveOrphan();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            backgroundColor: 'var(--color-error-light, #f87171)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: 'var(--font-size-xs)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
          title="Remove the orphan link"
        >
          <Trash2 size={12} />
          Fix
        </button>
      )}
    </div>
  );
};
