/**
 * ProjectSettingsModal Component
 *
 * Edit the project's name and description (saved to project.md).
 * One folder is one project, so there is nothing to create, switch or delete.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FolderOpen } from 'lucide-react';
import type { Project } from '../types';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { BaseArtifactModal } from './BaseArtifactModal';
import { FormField } from './forms/FormField';

interface ProjectSettingsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => Promise<void>;
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
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(project.name);
      setDescription(project.description);
      setError(null);
    }
  }, [isOpen, project]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setIsSubmitting(true);
      setError(null);
      try {
        await onSave({ name, description });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, description, onSave, onClose]
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
