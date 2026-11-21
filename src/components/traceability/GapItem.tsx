import React from 'react';
import { XCircle, Plus, Trash2 } from 'lucide-react';
import type { GapInfo } from './types';
import { ISSUE_COLORS, gapLabel } from './types';
import { kind } from '../../domain/artifactKinds';

interface GapItemProps {
  gap: GapInfo;
  onClick?: () => void;
  onAddLink?: () => void;
  onRemoveOrphan?: () => void;
  onMarkReviewed?: () => void;
}

export const GapItem: React.FC<GapItemProps> = ({
  gap,
  onClick,
  onAddLink,
  onRemoveOrphan,
  onMarkReviewed,
}) => {
  const colors = kind(gap.artifact.type).color;
  const issueColor = ISSUE_COLORS[gap.gap.issue];
  const { label, details } = gapLabel(gap.gap);
  const isOrphan = gap.gap.issue === 'orphan_link';
  const isSuspectLink = gap.gap.issue === 'suspect';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        backgroundColor: colors.bg,
        borderRadius: 'var(--radius-sm)',
        transition: 'background-color 0.15s',
      }}
    >
      <XCircle size={16} style={{ color: issueColor }} />
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
          borderRadius: 'var(--radius-xs)',
          color: issueColor,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      {details && (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {details}
        </span>
      )}
      {/* Quick action buttons */}
      {isSuspectLink && onMarkReviewed && (
        <button
          type="button"
          className="tf-button tf-button-small"
          onClick={(e) => {
            e.stopPropagation();
            onMarkReviewed();
          }}
        >
          Mark reviewed
        </button>
      )}
      {!isOrphan && !isSuspectLink && onAddLink && (
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
            color: 'var(--color-on-accent)',
            border: 'none',
            borderRadius: 'var(--radius-xs)',
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
      {isOrphan && onRemoveOrphan && (
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
            color: 'var(--color-on-accent)',
            border: 'none',
            borderRadius: 'var(--radius-xs)',
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
