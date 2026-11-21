/**
 * ProjectSettingsModal Component
 *
 * Edit the project's name, description and lifecycle settings (saved to tracyfy.yaml).
 * One folder is one project, so there is nothing to create, switch or delete.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FolderOpen } from 'lucide-react';
import type { Project } from '../types';
import type { LifecycleSettings } from '../domain/lifecycle';

export type ProjectSettingsValues = Project & LifecycleSettings;
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { BaseArtifactModal } from './BaseArtifactModal';
import { FormField } from './forms/FormField';

interface ProjectSettingsModalProps {
  project: Project;
  lifecycle: LifecycleSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: ProjectSettingsValues) => Promise<void>;
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg-app)',
  color: 'var(--color-text-primary)',
};

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  project,
  lifecycle,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [reviewOnContentChange, setReviewOnContentChange] = useState(
    lifecycle.reviewOnContentChange
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(project.name);
      setDescription(project.description);
      setReviewOnContentChange(lifecycle.reviewOnContentChange);
      setError(null);
    }
  }, [isOpen, project, lifecycle]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setIsSubmitting(true);
      setError(null);
      try {
        await onSave({ name, description, reviewOnContentChange });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, description, reviewOnContentChange, onSave, onClose]
  );

  useKeyboardShortcuts({ onSave: handleSubmit, onClose });

  if (!isOpen) return null;

  return (
    <BaseArtifactModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Project Settings"
      icon={<FolderOpen size={20} style={{ color: 'var(--color-accent)' }} />}
      submitLabel="Save"
      isSubmitting={isSubmitting}
      isSubmitDisabled={!name.trim()}
      width="500px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <FormField label="Project Name" required fullWidth htmlFor="project-name">
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            style={fieldStyle}
          />
        </FormField>
        <FormField
          label="Description"
          fullWidth
          htmlFor="project-description"
          description="Shown on the cover of exported documents."
        >
          <textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ ...fieldStyle, resize: 'vertical' }}
          />
        </FormField>
        <label style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={reviewOnContentChange}
            onChange={(e) => setReviewOnContentChange(e.target.checked)}
          />
          <span>
            Editing an approved artifact sends it back to review
            <span
              style={{
                display: 'block',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              A change to its title or text sets its status to In review.
            </span>
          </span>
        </label>
        {error && (
          <div
            role="alert"
            style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}
          >
            {error}
          </div>
        )}
      </div>
    </BaseArtifactModal>
  );
};
