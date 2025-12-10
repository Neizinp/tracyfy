import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Requirement } from '../types';
import { MarkdownEditor } from './MarkdownEditor';
import { useUser } from '../app/providers';

interface NewRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: Omit<Requirement, 'id' | 'children' | 'lastModified'>) => void;
}

type Tab = 'overview' | 'details' | 'comments';

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export const NewRequirementModal: React.FC<NewRequirementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [text, setText] = useState('');
  const [rationale, setRationale] = useState('');
  const [priority, setPriority] = useState<Requirement['priority']>('medium');
  const [verificationMethod, setVerificationMethod] = useState('');
  const [comments, setComments] = useState('');

  const { currentUser } = useUser();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({
      title,
      description,
      text,
      rationale,
      priority,
      author: currentUser?.name || undefined,
      verificationMethod: verificationMethod || undefined,
      comments: comments || undefined,
      dateCreated: Date.now(),
      status: 'draft',
      revision: '01',
    });
    // Reset form
    setTitle('');
    setDescription('');
    setText('');
    setRationale('');
    setPriority('medium');
    setVerificationMethod('');
    setComments('');
    setActiveTab('overview');
    onClose();
  };

  useKeyboardShortcuts({
    onSave: handleSubmit,
    onClose: onClose,
  });

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'comments', label: 'Comments' },
  ];

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
          width: '800px',
          maxWidth: '95%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontWeight: 600 }}>New Requirement</h3>
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

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'var(--color-bg-card)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 600 : 400,
                borderBottom:
                  activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <form
          id="new-requirement-form"
          onSubmit={handleSubmit}
          style={{
            padding: 'var(--spacing-lg)',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          {activeTab === 'overview' && (
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}
            >
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  htmlFor="req-title"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Title *
                </label>
                <input
                  id="req-title"
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

              <div style={{ gridColumn: '1 / -1' }}>
                <MarkdownEditor
                  label="Requirement Text"
                  value={text}
                  onChange={setText}
                  height={200}
                  placeholder="Enter detailed requirement text with Markdown..."
                />
              </div>

              <div>
                <label
                  htmlFor="req-priority"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Priority
                </label>
                <select
                  id="req-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Requirement['priority'])}
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

              <div>
                <label
                  htmlFor="req-author"
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
            </div>
          )}

          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <MarkdownEditor
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  height={150}
                  placeholder="Enter description with Markdown formatting..."
                />
              </div>

              <div>
                <MarkdownEditor
                  label="Rationale"
                  value={rationale}
                  onChange={setRationale}
                  height={150}
                  placeholder="Explain the rationale with Markdown..."
                />
              </div>

              <div>
                <label
                  htmlFor="req-verification"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Verification Method
                </label>
                <input
                  id="req-verification"
                  type="text"
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value)}
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
            </div>
          )}

          {activeTab === 'comments' && (
            <div>
              <MarkdownEditor
                label="Comments"
                value={comments}
                onChange={setComments}
                height={400}
                placeholder="Add comments with Markdown..."
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--spacing-sm)',
          }}
        >
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
            form="new-requirement-form"
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
            Create Requirement
          </button>
        </div>
      </div>
    </div>
  );
};
