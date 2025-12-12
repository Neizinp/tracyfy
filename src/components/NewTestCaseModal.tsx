import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { TestCase } from '../types';
import { useUser } from '../app/providers';

interface NewTestCaseModalProps {
  isOpen: boolean;

  onClose: () => void;
  onSubmit: (testCase: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => void;
}

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export const NewTestCaseModal: React.FC<NewTestCaseModalProps> = ({
  isOpen,

  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TestCase['priority']>('medium');

  const { currentUser } = useUser();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({
      title,
      description,
      priority,
      author: currentUser?.name || undefined,
      requirementIds: [], // Use Relationships tab to add links after creation
      status: 'draft',
      revision: '01',
    });
    // Reset form
    setTitle('');
    setDescription('');
    setPriority('medium');

    onClose();
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
          backgroundColor: '#222',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          width: '500px',
          maxWidth: '90%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
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
          <h3 style={{ fontWeight: 600 }}>New Test Case</h3>
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

        <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-lg)', overflow: 'auto' }}>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              htmlFor="new-test-case-title"
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Title
            </label>
            <input
              id="new-test-case-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              htmlFor="new-test-case-description"
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Description
            </label>
            <textarea
              id="new-test-case-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              htmlFor="new-test-case-priority"
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Priority
            </label>
            <select
              id="new-test-case-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TestCase['priority'])}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              htmlFor="new-test-case-author"
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Author
            </label>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: currentUser ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              }}
            >
              {currentUser?.name || 'No user selected'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
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
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Create Test Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
