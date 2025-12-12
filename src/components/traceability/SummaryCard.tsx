import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  total: number;
  linked: number;
  gaps: number;
  color: { bg: string; border: string; text: string };
  onViewGaps?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  total,
  linked,
  gaps,
  color,
  onViewGaps,
}) => {
  const coverage = total > 0 ? Math.round((linked / total) * 100) : 0;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: `1px solid ${color.border}`,
        borderRadius: '8px',
        padding: 'var(--spacing-md)',
        flex: 1,
        minWidth: '200px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h3
          style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: color.text, margin: 0 }}
        >
          {title}
        </h3>
        <span
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          {total}
        </span>
      </div>

      {/* Coverage bar */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Coverage
          </span>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: color.text }}>
            {coverage}%
          </span>
        </div>
        <div
          style={{
            height: '8px',
            backgroundColor: 'var(--color-bg-tertiary)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${coverage}%`,
              backgroundColor: color.text,
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--color-success-light)',
          }}
        >
          <CheckCircle2 size={14} />
          <span>{linked} linked</span>
        </div>
        {gaps > 0 && (
          <button
            type="button"
            onClick={onViewGaps}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--color-warning-light)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <AlertTriangle size={14} />
            <span>{gaps} gaps</span>
          </button>
        )}
      </div>
    </div>
  );
};
