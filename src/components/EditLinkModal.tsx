/**
 * EditLinkModal Component
 *
 * Modal for editing an existing link's type and project scope.
 */

import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Globe, Folder, Trash2 } from 'lucide-react';
import type { Link, Project } from '../types';
import type { LinkType } from '../utils/linkTypes';
import { LINK_TYPE_LABELS } from '../utils/linkTypes';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface EditLinkModalProps {
  isOpen: boolean;
  link: Link | null;
  projects: Project[];
  onClose: () => void;
  onSave: (linkId: string, updates: { type: LinkType; projectIds: string[] }) => Promise<void>;
  onDelete: (linkId: string) => Promise<void>;
}

export const EditLinkModal: React.FC<EditLinkModalProps> = ({
  isOpen,
  link,
  projects,
  onClose,
  onSave,
  onDelete,
}) => {
  const [linkType, setLinkType] = useState<LinkType>('related_to');
  const [linkScope, setLinkScope] = useState<'global' | 'project'>('global');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset form when modal opens with a link
  useEffect(() => {
    if (isOpen && link) {
      setLinkType(link.type);
      if (link.projectIds.length === 0) {
        setLinkScope('global');
        setSelectedProjectIds([]);
      } else {
        setLinkScope('project');
        setSelectedProjectIds(link.projectIds);
      }
      setShowDeleteConfirm(false);
    }
  }, [isOpen, link]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!link) return;

    setSaving(true);
    try {
      await onSave(link.id, {
        type: linkType,
        projectIds: linkScope === 'global' ? [] : selectedProjectIds,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update link:', error);
    } finally {
      setSaving(false);
    }
  };

  useKeyboardShortcuts({
    onSave: handleSubmit,
    onClose: onClose,
  });

  if (!isOpen || !link) return null;

  // Get project names for display
  const getProjectName = (projectId: string): string => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || projectId;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '32rem',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LinkIcon size={20} style={{ color: 'var(--color-accent)' }} />
            Edit Link - {link.id}
          </h3>
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

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {/* Link Info (read-only) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    color: 'var(--color-accent)',
                    fontWeight: 500,
                  }}
                >
                  {link.sourceId}
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    color: 'var(--color-accent)',
                    fontWeight: 500,
                  }}
                >
                  {link.targetId}
                </span>
              </div>
            </div>
          </div>

          {/* Link Type */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                marginBottom: '0.5rem',
              }}
            >
              Link Type
            </label>
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as LinkType)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {Object.entries(LINK_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Link Scope */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                marginBottom: '0.5rem',
              }}
            >
              Link Scope
            </label>
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '6px',
                padding: '4px',
                border: '1px solid var(--color-border)',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setLinkScope('project')}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: linkScope === 'project' ? 'var(--color-accent)' : 'transparent',
                  color: linkScope === 'project' ? '#fff' : 'var(--color-text-secondary)',
                  transition: 'all 0.2s',
                }}
              >
                <Folder size={14} />
                Project-Specific
              </button>
              <button
                type="button"
                onClick={() => setLinkScope('global')}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: linkScope === 'global' ? 'var(--color-accent)' : 'transparent',
                  color: linkScope === 'global' ? '#fff' : 'var(--color-text-secondary)',
                  transition: 'all 0.2s',
                }}
              >
                <Globe size={14} />
                Global
              </button>
            </div>

            {/* Project selection when project-specific */}
            {linkScope === 'project' && (
              <div style={{ marginTop: '0.75rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Select project(s):
                </label>
                <div
                  style={{
                    maxHeight: '120px',
                    overflowY: 'auto',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-bg-secondary)',
                  }}
                >
                  {projects
                    .filter((p) => !p.isDeleted)
                    .map((project) => (
                      <label
                        key={project.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          borderBottom: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-sm)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProjectIds.includes(project.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjectIds([...selectedProjectIds, project.id]);
                            } else {
                              setSelectedProjectIds(
                                selectedProjectIds.filter((id) => id !== project.id)
                              );
                            }
                          }}
                        />
                        {project.name}
                      </label>
                    ))}
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: '0.5rem',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              {linkScope === 'project'
                ? selectedProjectIds.length === 0
                  ? 'Select at least one project.'
                  : `Visible in: ${selectedProjectIds.map(getProjectName).join(', ')}`
                : 'Link will be visible across all projects.'}
            </div>
          </div>

          {/* Footer Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            {/* Delete section */}
            <div>
              {showDeleteConfirm ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error)' }}>
                    Delete?
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (link) {
                        await onDelete(link.id);
                        onClose();
                      }
                    }}
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: 'var(--color-error)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-error)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-error)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>

            {/* Save/Cancel section */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.5rem 1rem',
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
                disabled={saving || (linkScope === 'project' && selectedProjectIds.length === 0)}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor:
                    linkScope === 'project' && selectedProjectIds.length === 0
                      ? 'var(--color-bg-secondary)'
                      : 'var(--color-accent)',
                  color:
                    linkScope === 'project' && selectedProjectIds.length === 0
                      ? 'var(--color-text-muted)'
                      : '#fff',
                  cursor:
                    linkScope === 'project' && selectedProjectIds.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight: 500,
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
