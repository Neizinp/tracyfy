import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
}

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (name.trim()) {
      onSubmit(name, description);
      setName('');
      setDescription('');
      onClose();
    }
  };

  useKeyboardShortcuts({
    onSave: handleSubmit,
    onClose: onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-bg-overlay, #222)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        // no blur
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-raised)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border-light)',
          width: '500px',
          maxWidth: '90%',
          boxShadow: 'var(--shadow-popover)',
        }}
      >
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontWeight: 600 }}>Create New Project</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Project Name <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
              placeholder="e.g., Mars Rover 2030"
              autoFocus
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                resize: 'vertical',
              }}
              placeholder="Brief description of the project..."
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-on-accent)',
                cursor: !name.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                opacity: !name.trim() ? 0.5 : 1,
              }}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
