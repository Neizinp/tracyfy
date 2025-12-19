import React, { useState, useEffect, useCallback } from 'react';
import { Link as LinkIcon, Globe, Folder, Trash2, ArrowRight } from 'lucide-react';
import type { Link, Project } from '../types';
import type { LinkType } from '../utils/linkTypes';
import { LINK_TYPE_LABELS } from '../utils/linkTypes';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { BaseArtifactModal } from './BaseArtifactModal';
import { FormField } from './forms/FormField';

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

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
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
    },
    [link, linkType, linkScope, selectedProjectIds, onSave, onClose]
  );

  useKeyboardShortcuts({
    onSave: handleSubmit,
    onClose: onClose,
  });

  if (!isOpen || !link) return null;

  const isSubmitDisabled = linkScope === 'project' && selectedProjectIds.length === 0;

  return (
    <BaseArtifactModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={`Edit Link - ${link.id}`}
      icon={<LinkIcon size={20} style={{ color: 'var(--color-accent)' }} />}
      submitLabel="Save Changes"
      isSubmitting={saving}
      isSubmitDisabled={isSubmitDisabled}
      width="500px"
      footerLeft={
        <div style={{ padding: '4px 0' }}>
          {showDeleteConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-status-error)',
                  fontWeight: 500,
                }}
              >
                Delete this link?
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
                  padding: '4px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: 'var(--color-status-error)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                }}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-status-error)',
                backgroundColor: 'transparent',
                color: 'var(--color-status-error)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Link Info (read-only) */}
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'monospace',
          }}
        >
          <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{link.sourceId}</span>
          <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{link.targetId}</span>
        </div>

        {/* Link Type */}
        <FormField label="Link Type" icon={<LinkIcon size={14} />} fullWidth>
          <select
            value={linkType}
            onChange={(e) => setLinkType(e.target.value as LinkType)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-app)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
            }}
          >
            {Object.entries(LINK_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>

        {/* Link Scope */}
        <FormField label="Link Scope" fullWidth description="Define where this link is visible.">
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
                padding: '8px',
                borderRadius: '4px',
                border: 'none',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
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
                padding: '8px',
                borderRadius: '4px',
                border: 'none',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
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
            <div style={{ marginTop: '12px' }}>
              <div
                style={{
                  maxHeight: '150px',
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
                        gap: '10px',
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--color-bg-app)')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
                      <span
                        style={{ fontWeight: selectedProjectIds.includes(project.id) ? 500 : 400 }}
                      >
                        {project.name}
                      </span>
                    </label>
                  ))}
              </div>
              {selectedProjectIds.length === 0 && (
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-status-error)',
                  }}
                >
                  Please select at least one project.
                </div>
              )}
            </div>
          )}
        </FormField>
      </div>
    </BaseArtifactModal>
  );
};
