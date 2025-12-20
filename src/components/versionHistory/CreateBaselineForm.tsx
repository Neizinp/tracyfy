/**
 * CreateBaselineForm Component
 *
 * Inline form for creating new baselines.
 */

import React from 'react';
import { Save } from 'lucide-react';

interface CreateBaselineFormProps {
  isCreating: boolean;
  baselineName: string;
  baselineMessage: string;
  onStartCreating: () => void;
  onNameChange: (name: string) => void;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const CreateBaselineForm: React.FC<CreateBaselineFormProps> = ({
  isCreating,
  baselineName,
  baselineMessage,
  onStartCreating,
  onNameChange,
  onMessageChange,
  onSubmit,
  onCancel,
}) => {
  if (!isCreating) {
    return (
      <button
        onClick={onStartCreating}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          backgroundColor: 'var(--color-info)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: 'var(--font-size-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 500,
        }}
      >
        <Save size={14} />
        Create Baseline
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        type="text"
        value={baselineName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Name (e.g. 1.0)"
        autoFocus
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-app)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)',
          width: '120px',
        }}
      />
      <input
        type="text"
        value={baselineMessage}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="Description (optional)"
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-app)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)',
          width: '200px',
        }}
      />
      <button
        type="submit"
        disabled={!baselineName.trim()}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          backgroundColor: 'var(--color-info)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: 'var(--font-size-sm)',
          opacity: baselineName.trim() ? 1 : 0.5,
        }}
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-card)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Cancel
      </button>
    </form>
  );
};
