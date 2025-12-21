/**
 * CommitFilters Component
 *
 * Filter buttons for artifact types in the "All Commits" tab.
 */

import React from 'react';
import { ARTIFACT_TYPE_CONFIG } from '../../hooks/useVersionHistory';

interface CommitFiltersProps {
  selectedTypes: Set<string>;
  onToggleType: (type: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const CommitFilters: React.FC<CommitFiltersProps> = ({
  selectedTypes,
  onToggleType,
  onSelectAll,
  onDeselectAll,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px 0',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '4px',
      }}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={onSelectAll}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-info)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          Select All
        </button>
        <span style={{ color: 'var(--color-border)', fontSize: 'var(--font-size-xs)' }}>|</span>
        <button
          onClick={onDeselectAll}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(155, 155, 155, 0.1)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          Deselect All
        </button>
      </div>
      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
        }}
      >
        {Object.entries(ARTIFACT_TYPE_CONFIG).map(([type, config]) => {
          const isSelected = selectedTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => onToggleType(type)}
              style={{
                padding: '4px 10px',
                borderRadius: '14px',
                border: `1px solid ${isSelected ? config.color : 'var(--color-border)'}`,
                backgroundColor: isSelected ? config.color : 'transparent',
                color: isSelected ? 'white' : 'var(--color-text-muted)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                opacity: isSelected ? 1 : 0.7,
              }}
            >
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
