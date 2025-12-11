import React, { useState, useEffect } from 'react';
import type { Project } from '../types';

interface ProjectSettingsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (projectId: string, name: string, description: string) => Promise<void>;
  onDelete: (projectId: string) => void;
  onCopy?: (originalProject: Project, newName: string, newDescription: string) => Promise<void>;
}

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  project,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onCopy,
}) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRenameConfirm, setShowRenameConfirm] = useState(false);
  const [showCopyMode, setShowCopyMode] = useState(false);
  const [copyName, setCopyName] = useState('');
  const [copyDescription, setCopyDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(project.name);
      setDescription(project.description);
      setShowDeleteConfirm(false);
      setShowRenameConfirm(false);
      setShowCopyMode(false);
      setCopyName(`${project.name} (Copy)`);
      setCopyDescription(project.description);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, project]);

  const isNameChanged = name.trim() !== project.name;

  const doSave = async () => {
    setError(null);
    setIsSubmitting(true);
    setShowRenameConfirm(false);

    try {
      await onUpdate(project.id, name, description);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // If name changed, show confirmation dialog
    if (isNameChanged) {
      setShowRenameConfirm(true);
      return;
    }

    // Otherwise, save directly
    await doSave();
  };

  const handleCopyProject = async () => {
    if (!copyName.trim()) {
      setError('Please enter a name for the new project');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCopy?.(project, copyName.trim(), copyDescription.trim());
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
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
          backgroundColor: 'var(--color-bg-card)',
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
          <h3 style={{ fontWeight: 600 }}>Project Settings</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-lg)', overflowY: 'auto' }}>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              htmlFor="project-name"
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Project Name
            </label>
            <input
              type="text"
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
              htmlFor="project-description"
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Description
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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

          {error && (
            <div
              style={{
                marginBottom: 'var(--spacing-md)',
                padding: 'var(--spacing-sm)',
                backgroundColor: 'var(--color-error-bg)',
                color: 'var(--color-error)',
                borderRadius: '6px',
                border: '1px solid var(--color-error-light)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {error}
            </div>
          )}

          {showRenameConfirm && (
            <div
              style={{
                marginBottom: 'var(--spacing-md)',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-warning-bg, #fef3cd)',
                borderRadius: '6px',
                border: '1px solid var(--color-warning-border, #ffc107)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-warning-text, #856404)',
                  marginBottom: 'var(--spacing-sm)',
                }}
              >
                Renaming the project will create an automatic commit. Continue?
              </p>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button
                  type="button"
                  onClick={() => setShowRenameConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-card)',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={doSave}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  Confirm Rename
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 'var(--spacing-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-md)',
            }}
          >
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
                disabled={isSubmitting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isSubmitting
                    ? 'var(--color-bg-disabled)'
                    : 'var(--color-accent)',
                  color: 'white',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Copy Project Section */}
            {onCopy && (
              <div
                style={{
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 'var(--spacing-md)',
                  marginTop: 'var(--spacing-sm)',
                }}
              >
                {!showCopyMode ? (
                  <button
                    type="button"
                    onClick={() => setShowCopyMode(true)}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-card)',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                    }}
                  >
                    Copy Project
                  </button>
                ) : (
                  <div
                    style={{
                      padding: 'var(--spacing-md)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 var(--spacing-sm) 0',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 500,
                      }}
                    >
                      Copy Project
                    </p>
                    <p
                      style={{
                        margin: '0 0 var(--spacing-md) 0',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Create a copy of this project with all its artifacts.
                    </p>
                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: 'var(--spacing-xs)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 500,
                        }}
                      >
                        New Project Name
                      </label>
                      <input
                        type="text"
                        value={copyName}
                        onChange={(e) => setCopyName(e.target.value)}
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
                        style={{
                          display: 'block',
                          marginBottom: 'var(--spacing-xs)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 500,
                        }}
                      >
                        Description
                      </label>
                      <textarea
                        value={copyDescription}
                        onChange={(e) => setCopyDescription(e.target.value)}
                        rows={3}
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
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <button
                        type="button"
                        onClick={() => setShowCopyMode(false)}
                        style={{
                          flex: 1,
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
                        type="button"
                        onClick={handleCopyProject}
                        disabled={isSubmitting}
                        style={{
                          flex: 1,
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: isSubmitting
                            ? 'var(--color-bg-disabled)'
                            : 'var(--color-accent)',
                          color: 'white',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        {isSubmitting ? 'Copying...' : 'Create Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Move to Trash Section */}
            <div
              style={{
                borderTop: '1px solid var(--color-border)',
                paddingTop: 'var(--spacing-md)',
                marginTop: 'var(--spacing-sm)',
              }}
            >
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-error-light)',
                    backgroundColor: 'var(--color-bg-card)',
                    color: 'var(--color-error)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  <svg
                    style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Project
                </button>
              ) : (
                <div
                  style={{
                    backgroundColor: 'var(--color-error-bg)',
                    padding: 'var(--spacing-md)',
                    borderRadius: '6px',
                    border: '1px solid var(--color-error-light)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-error)',
                      marginBottom: 'var(--spacing-sm)',
                    }}
                  >
                    Delete <strong>{project.name}</strong>? This action cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-card)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 500,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(project.id);
                        onClose();
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'var(--color-error)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 500,
                      }}
                    >
                      Delete Project
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
