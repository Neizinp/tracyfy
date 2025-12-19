/**
 * useRequirementForm Hook
 *
 * Manages form state and handlers for creating/editing requirements.
 * Extracted from RequirementModal for better separation of concerns.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Requirement, ArtifactLink } from '../types';
import type { CustomAttributeValue } from '../types/customAttributes';
import { useUser, useUI, useGlobalState } from '../app/providers';

interface UseRequirementFormOptions {
  isOpen: boolean;
  requirement: Requirement | null;
  onClose: () => void;
  onCreate: (req: Omit<Requirement, 'id' | 'children' | 'lastModified'>) => void;
  onUpdate: (id: string, updates: Partial<Requirement>) => void;
  onDelete: (id: string) => void;
}

export function useRequirementForm({
  isOpen,
  requirement,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: UseRequirementFormOptions) {
  const { currentUser } = useUser();
  const {
    setEditingRequirement,
    setIsEditRequirementModalOpen,
    setEditingUseCase,
    setIsUseCaseModalOpen,
    setSelectedTestCaseId,
    setIsEditTestCaseModalOpen,
    setSelectedInformation,
    setIsInformationModalOpen,
  } = useUI();
  const { requirements, useCases, information } = useGlobalState();

  const isEditMode = requirement !== null;

  // Form state
  const [activeTab, setActiveTab] = useState<
    'overview' | 'details' | 'relationships' | 'comments' | 'customFields' | 'history'
  >('overview');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [text, setText] = useState('');
  const [rationale, setRationale] = useState('');
  const [priority, setPriority] = useState<Requirement['priority']>('medium');
  const [status, setStatus] = useState<Requirement['status']>('draft');
  const [verificationMethod, setVerificationMethod] = useState('');
  const [comments, setComments] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkedArtifacts, setLinkedArtifacts] = useState<ArtifactLink[]>([]);
  const [customAttributes, setCustomAttributes] = useState<CustomAttributeValue[]>([]);

  // Reset form when modal opens/closes or requirement changes
  useEffect(() => {
    if (isOpen) {
      if (requirement) {
        // Edit mode: populate from requirement
        setTitle(requirement.title);
        setDescription(requirement.description);
        setText(requirement.text);
        setRationale(requirement.rationale);
        setPriority(requirement.priority);
        setStatus(requirement.status);
        setVerificationMethod(requirement.verificationMethod || '');
        setComments(requirement.comments || '');
        setLinkedArtifacts(requirement.linkedArtifacts || []);
        setCustomAttributes(requirement.customAttributes || []);
      } else {
        // Create mode: reset to defaults
        setTitle('');
        setDescription('');
        setText('');
        setRationale('');
        setPriority('medium');
        setStatus('draft');
        setVerificationMethod('');
        setComments('');
        setLinkedArtifacts([]);
        setCustomAttributes([]);
      }
      setActiveTab('overview');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, requirement]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (isEditMode && requirement) {
        onUpdate(requirement.id, {
          title,
          description,
          text,
          rationale,
          priority,
          status,
          linkedArtifacts,
          verificationMethod,
          comments,
          customAttributes,
        });
      } else {
        onCreate({
          title,
          description,
          text,
          rationale,
          priority,
          author: currentUser?.name || undefined,
          verificationMethod: verificationMethod || undefined,
          comments: comments || undefined,
          customAttributes,
          dateCreated: Date.now(),
          status: 'draft',
          revision: '01',
        });
      }
      onClose();
    },
    [
      isEditMode,
      requirement,
      title,
      description,
      text,
      rationale,
      priority,
      status,
      linkedArtifacts,
      verificationMethod,
      comments,
      customAttributes,
      currentUser,
      onCreate,
      onUpdate,
      onClose,
    ]
  );

  const handleRemoveLink = useCallback((targetId: string) => {
    setLinkedArtifacts((prev) => prev.filter((link) => link.targetId !== targetId));
  }, []);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (requirement) {
      onDelete(requirement.id);
      onClose();
    }
  }, [requirement, onDelete, onClose]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  // Navigate to a linked artifact by opening its edit modal
  const handleNavigateToArtifact = useCallback(
    (sourceId: string, sourceType: string) => {
      onClose();

      switch (sourceType) {
        case 'requirement': {
          const req = requirements.find((r) => r.id === sourceId);
          if (req) {
            setEditingRequirement(req);
            setIsEditRequirementModalOpen(true);
          }
          break;
        }
        case 'useCase': {
          const uc = useCases.find((u) => u.id === sourceId);
          if (uc) {
            setEditingUseCase(uc);
            setIsUseCaseModalOpen(true);
          }
          break;
        }
        case 'testCase': {
          setSelectedTestCaseId(sourceId);
          setIsEditTestCaseModalOpen(true);
          break;
        }
        case 'information': {
          const info = information.find((i) => i.id === sourceId);
          if (info) {
            setSelectedInformation(info);
            setIsInformationModalOpen(true);
          }
          break;
        }
      }
    },
    [
      onClose,
      requirements,
      useCases,
      information,
      setEditingRequirement,
      setIsEditRequirementModalOpen,
      setEditingUseCase,
      setIsUseCaseModalOpen,
      setSelectedTestCaseId,
      setIsEditTestCaseModalOpen,
      setSelectedInformation,
      setIsInformationModalOpen,
    ]
  );

  return {
    // Mode
    isEditMode,
    currentUser,

    // Tab state
    activeTab,
    setActiveTab,

    // Form fields
    title,
    setTitle,
    description,
    setDescription,
    text,
    setText,
    rationale,
    setRationale,
    priority,
    setPriority,
    status,
    setStatus,
    verificationMethod,
    setVerificationMethod,
    comments,
    setComments,
    linkedArtifacts,
    setLinkedArtifacts,
    customAttributes,
    setCustomAttributes,

    // Delete confirmation
    showDeleteConfirm,
    handleDelete,
    confirmDelete,
    cancelDelete,

    // Actions
    handleSubmit,
    handleRemoveLink,
    handleNavigateToArtifact,
  };
}
