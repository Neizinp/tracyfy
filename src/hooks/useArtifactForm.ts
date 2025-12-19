import { useState, useEffect, useCallback } from 'react';
import type { ArtifactLink } from '../types';
import type { CustomAttributeValue } from '../types/customAttributes';
import { useUser } from '../app/providers';
import { useBaseArtifactForm } from './useBaseArtifactForm';

export interface UseArtifactFormOptions<T extends { id: string }, TabType extends string> {
  isOpen: boolean;
  artifact: T | null;
  onClose: () => void;
  onCreate: (data: Partial<T> & { dateCreated: number; revision: string }) => void;
  onUpdate: (id: string, updates: Partial<T>) => void;
  onDelete: (id: string) => void;
  defaultTab: TabType;
  initialState?: Partial<T>;
}

/**
 * A generic hook for artifact management forms.
 * Consolidates common state and handlers for all artifact types.
 */
export function useArtifactForm<T extends { id: string }, TabType extends string>({
  isOpen,
  artifact,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  defaultTab,
  initialState = {} as Partial<T>,
}: UseArtifactFormOptions<T, TabType>) {
  const { currentUser } = useUser();

  const {
    isEditMode,
    activeTab,
    setActiveTab,
    showDeleteConfirm,
    handleDelete,
    confirmDelete,
    cancelDelete,
  } = useBaseArtifactForm<T, TabType>({
    isOpen,
    artifact,
    defaultTab,
    onClose,
    onDelete,
  });

  // Form state fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [status, setStatus] = useState<string>('draft');
  const [author, setAuthor] = useState('');
  const [linkedArtifacts, setLinkedArtifacts] = useState<ArtifactLink[]>([]);
  const [customAttributes, setCustomAttributes] = useState<CustomAttributeValue[]>([]);

  // Reset form when modal opens or artifact changes
  useEffect(() => {
    if (isOpen) {
      if (artifact) {
        // Edit mode: populate from artifact
        const a = artifact as Record<string, unknown>;
        setTitle((a.title as string) || '');
        setDescription((a.description as string) || '');
        setText((a.text as string) || '');
        setPriority((a.priority as string) || 'medium');
        setStatus((a.status as string) || 'draft');
        setAuthor((a.author as string) || '');
        setLinkedArtifacts((a.linkedArtifacts as ArtifactLink[]) || []);
        setCustomAttributes((a.customAttributes as CustomAttributeValue[]) || []);
      } else {
        // Create mode: reset to defaults or initial state
        const s = initialState as Record<string, unknown>;
        setTitle((s.title as string) || '');
        setDescription((s.description as string) || '');
        setText((s.text as string) || '');
        setPriority((s.priority as string) || 'medium');
        setStatus((s.status as string) || 'draft');
        setAuthor((s.author as string) || currentUser?.name || '');
        setLinkedArtifacts((s.linkedArtifacts as ArtifactLink[]) || []);
        setCustomAttributes((s.customAttributes as CustomAttributeValue[]) || []);
      }
    }
  }, [isOpen, artifact, initialState, currentUser?.name]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent, additionalData: Partial<T> = {}) => {
      if (e) e.preventDefault();

      const commonData = {
        title,
        description,
        text,
        status,
        priority,
        author,
        linkedArtifacts,
        customAttributes,
        lastModified: Date.now(),
        ...additionalData,
      } as Partial<T>;

      if (isEditMode && artifact) {
        onUpdate(artifact.id, commonData as Partial<T>);
      } else {
        onCreate({
          ...commonData,
          dateCreated: Date.now(),
          revision: '01',
        });
      }
      onClose();
    },
    [
      isEditMode,
      artifact,
      title,
      description,
      text,
      status,
      priority,
      author,
      linkedArtifacts,
      customAttributes,
      onCreate,
      onUpdate,
      onClose,
    ]
  );

  const handleRemoveLink = useCallback((targetId: string) => {
    setLinkedArtifacts((prev) => prev.filter((link) => link.targetId !== targetId));
  }, []);

  return {
    // Mode
    isEditMode,
    currentUser,

    // Tab state (from base hook)
    activeTab,
    setActiveTab,

    // Form fields
    title,
    setTitle,
    description,
    setDescription,
    text,
    setText,
    priority,
    setPriority,
    status,
    setStatus,
    author,
    setAuthor,
    linkedArtifacts,
    setLinkedArtifacts,
    customAttributes,
    setCustomAttributes,

    // Actions (including from base hook)
    handleSubmit,
    handleRemoveLink,
    handleDelete,
    confirmDelete,
    cancelDelete,
    showDeleteConfirm,
  };
}
