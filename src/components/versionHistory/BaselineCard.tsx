/**
 * BaselineCard Component
 *
 * Displays a single baseline item with view button.
 */

import React from 'react';
import { Tag } from 'lucide-react';
import type { ProjectBaseline } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';

interface BaselineCardProps {
  baseline: ProjectBaseline;
  versionLabel: string;
  onView: () => void;
}

export const BaselineCard: React.FC<BaselineCardProps> = ({ baseline, versionLabel, onView }) => {
  return (
    <div
      style={{
        padding: 'var(--spacing-md)',
        borderRadius: '6px',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        transition: 'background-color 0.2s',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {formatDateTime(baseline.timestamp)}
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-info)',
                color: 'white',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Tag size={10} />
              {versionLabel}
            </span>
          </div>
          <div
            style={{
              fontWeight: 500,
              color: 'var(--color-text-primary)',
            }}
          >
            {baseline.description || baseline.name}
          </div>
        </div>
        <button
          onClick={onView}
          style={{
            padding: '4px 12px',
            borderRadius: '4px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-xs)',
            cursor: 'pointer',
          }}
        >
          View
        </button>
      </div>
    </div>
  );
};
