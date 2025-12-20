/**
 * useLinkModal Hook
 *
 * Manages state and handlers for the LinkModal component.
 * Includes target type selection, search filtering, and link creation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Requirement, ArtifactLink, Project, UseCase, TestCase, Information } from '../types';

export interface LinkModalResult {
  targetId: string;
  type: ArtifactLink['type'];
  projectIds: string[];
}

type ArtifactType = 'requirement' | 'usecase' | 'testcase' | 'information';

interface UseLinkModalOptions {
  isOpen: boolean;
  sourceArtifactId: string | null;
  sourceArtifactType: 'requirement' | 'usecase' | 'testcase' | 'information' | 'risk';
  projects: Project[];
  currentProjectId: string;
  globalRequirements: Requirement[];
  globalUseCases: UseCase[];
  globalTestCases: TestCase[];
  globalInformation: Information[];
  onClose: () => void;
  onAddLink: (link: LinkModalResult) => void;
}

export function useLinkModal({
  isOpen,
  sourceArtifactId,
  projects,
  currentProjectId,
  globalRequirements,
  globalUseCases,
  globalTestCases,
  globalInformation,
  onClose,
  onAddLink,
}: UseLinkModalOptions) {
  const [targetType, setTargetType] = useState<ArtifactType>('requirement');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [linkType, setLinkType] = useState<ArtifactLink['type']>('related_to');
  const [linkScope, setLinkScope] = useState<'global' | 'project'>('project');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetType('requirement');
      setSearchQuery('');
      setSelectedTargetId('');
      setLinkType('related_to');
      setLinkScope('project');
    }
  }, [isOpen]);

  // Helper to find which project an artifact belongs to
  const findProjectForArtifact = useCallback(
    (id: string): Project | undefined => {
      return projects.find(
        (p) =>
          p.requirementIds.includes(id) ||
          p.useCaseIds.includes(id) ||
          p.testCaseIds.includes(id) ||
          p.informationIds.includes(id)
      );
    },
    [projects]
  );

  // Filter artifacts based on type and search
  const filteredArtifacts = useMemo(() => {
    let artifacts: { id: string; title: string; description?: string }[] = [];

    if (targetType === 'requirement') artifacts = globalRequirements;
    else if (targetType === 'usecase') artifacts = globalUseCases;
    else if (targetType === 'testcase') artifacts = globalTestCases;
    else if (targetType === 'information')
      artifacts = globalInformation.map((i) => ({
        id: i.id,
        title: i.title,
        description:
          (i.content || i.text || '').length > 100
            ? (i.content || i.text || '').substring(0, 100) + '...'
            : i.content || i.text || '',
      }));

    // Filter out source artifact (can't link to self)
    artifacts = artifacts.filter((a) => a.id !== sourceArtifactId);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      artifacts = artifacts.filter(
        (a) =>
          a.id.toLowerCase().includes(query) ||
          a.title.toLowerCase().includes(query) ||
          (a.description && a.description.toLowerCase().includes(query))
      );
    }

    return artifacts;
  }, [
    targetType,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    sourceArtifactId,
    searchQuery,
  ]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (selectedTargetId) {
        onAddLink({
          targetId: selectedTargetId,
          type: linkType,
          projectIds: linkScope === 'global' ? [] : [currentProjectId],
        });
        onClose();
      }
    },
    [selectedTargetId, linkType, linkScope, currentProjectId, onAddLink, onClose]
  );

  const selectTargetType = useCallback((type: ArtifactType) => {
    setTargetType(type);
    setSelectedTargetId('');
  }, []);

  return {
    // Form state
    targetType,
    selectTargetType,
    searchQuery,
    setSearchQuery,
    selectedTargetId,
    setSelectedTargetId,
    linkType,
    setLinkType,
    linkScope,
    setLinkScope,

    // Computed
    filteredArtifacts,
    findProjectForArtifact,
    currentProjectId,

    // Actions
    handleSubmit,
  };
}
