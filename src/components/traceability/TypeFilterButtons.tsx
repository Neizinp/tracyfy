import React from 'react';
import { ARTIFACT_KINDS, kind, type ArtifactKindId } from '../../domain/artifactKinds';

interface TypeFilterButtonsProps {
  selectedTypes: Set<ArtifactKindId>;
  onToggle: (type: ArtifactKindId) => void;
}

/** One toggle per artifact type (UC, REQ, TC, INFO, RISK, DOC) */
export const TypeFilterButtons: React.FC<TypeFilterButtonsProps> = ({
  selectedTypes,
  onToggle,
}) => (
  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
    {ARTIFACT_KINDS.map(({ id: type, prefix: short, label: { plural: label } }) => {
      const color = kind(type).color.text;
      const active = selectedTypes.has(type);
      return (
        <button
          key={type}
          type="button"
          title={label}
          aria-pressed={active}
          onClick={() => onToggle(type)}
          style={{
            padding: '4px 8px',
            borderRadius: 'var(--radius-xs)',
            border: active ? `2px solid ${color}` : '2px solid var(--color-border)',
            backgroundColor: active
              ? `color-mix(in srgb, ${color} 12%, transparent)`
              : 'transparent',
            color: active ? color : 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            transition: 'all 0.15s',
          }}
        >
          {short}
        </button>
      );
    })}
  </div>
);
