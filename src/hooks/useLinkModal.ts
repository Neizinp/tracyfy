/**
 * useLinkModal Hook
 *
 * Manages state and handlers for the LinkModal component.
 * Includes target type selection, search filtering, and link creation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Requirement,
  ArtifactLink,
  Project,
  UseCase,
  TestCase,
  Information,
  Risk,
} from '../types';

export interface LinkModalResult {
  /** Set when the source was chosen in the modal (e.g. from the Links page) */
  sourceId?: string;
  targetId: string;
  type: ArtifactLink['type'];
  projectIds: string[];
}

type ArtifactType = 'requirement' | 'usecase' | 'testcase' | 'information' | 'risk';

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
  globalRisks?: Risk[];
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
  globalRisks = [],
  onClose,
  onAddLink,
}: UseLinkModalOptions) {
  const [targetType, setTargetType] = useState<ArtifactType>('requirement');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [linkType, setLinkType] = useState<ArtifactLink['type']>('related_to');
  const [linkScope, setLinkScope] = useState<'global' | 'project'>('project');
  // Source chosen inside the modal when none was preset (e.g. opened from the Links page)
  const [chosenSourceId, setChosenSourceId] = useState('');

  const needsSourceSelection = !sourceArtifactId;
  const effectiveSourceId = sourceArtifactId || chosenSourceId;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setChosenSourceId('');
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
          p.informationIds.includes(id) ||
          (p.riskIds ?? []).includes(id)
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
    else if (targetType === 'risk') artifacts = globalRisks;
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
    artifacts = artifacts.filter((a) => a.id !== effectiveSourceId);

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
    globalRisks,
    effectiveSourceId,
    searchQuery,
  ]);

  /** All artifacts that can act as a link source (used when no source is preset) */
  const sourceOptions = useMemo(
    () =>
      [
        ...globalRequirements,
        ...globalUseCases,
        ...globalTestCases,
        ...globalInformation,
        ...globalRisks,
      ]
        .filter((a) => !a.isDeleted)
        .map((a) => ({ id: a.id, title: a.title })),
    [globalRequirements, globalUseCases, globalTestCases, globalInformation, globalRisks]
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (selectedTargetId && effectiveSourceId) {
        onAddLink({
          sourceId: effectiveSourceId,
          targetId: selectedTargetId,
          type: linkType,
          projectIds: linkScope === 'global' ? [] : [currentProjectId],
        });
        onClose();
      }
    },
    [selectedTargetId, effectiveSourceId, linkType, linkScope, currentProjectId, onAddLink, onClose]
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
    needsSourceSelection,
    chosenSourceId,
    setChosenSourceId,
    effectiveSourceId,
    sourceOptions,
  };
}
