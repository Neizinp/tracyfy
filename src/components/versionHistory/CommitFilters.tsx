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
}

export const CommitFilters: React.FC<CommitFiltersProps> = ({ selectedTypes, onToggleType }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        padding: '8px 0',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '4px',
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
  );
};
