/**
 * useLinkModal Hook
 *
 * Manages state and handlers for the LinkModal component.
 * Includes target type selection, search filtering, and link creation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ArtifactLink } from '../types';
import {
  LINKABLE_TYPES,
  type ArtifactsByType,
  type LinkableType,
} from '../constants/linkableArtifacts';

export interface LinkModalResult {
  /** Set when the source was chosen in the modal (e.g. from the Links page) */
  sourceId?: string;
  targetId: string;
  type: ArtifactLink['type'];
}

interface UseLinkModalOptions {
  isOpen: boolean;
  sourceArtifactId: string | null;
  sourceArtifactType: LinkableType;
  /** Every linkable artifact, grouped by type */
  artifactsByType: ArtifactsByType;
  onClose: () => void;
  onAddLink: (link: LinkModalResult) => void;
}

export function useLinkModal({
  isOpen,
  sourceArtifactId,
  artifactsByType,
  onClose,
  onAddLink,
}: UseLinkModalOptions) {
  const [targetType, setTargetType] = useState<LinkableType>('requirement');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [linkType, setLinkType] = useState<ArtifactLink['type']>('related_to');
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
    }
  }, [isOpen]);

  // Artifacts of the selected type, minus deleted ones and the source itself
  const filteredArtifacts = useMemo(() => {
    let artifacts = artifactsByType[targetType].filter(
      (a) => !a.isDeleted && a.id !== effectiveSourceId
    );
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
  }, [artifactsByType, targetType, effectiveSourceId, searchQuery]);

  /** All artifacts that can act as a link source (used when no source is preset) */
  const sourceOptions = useMemo(
    () =>
      LINKABLE_TYPES.flatMap(({ type }) => artifactsByType[type])
        .filter((a) => !a.isDeleted)
        .map((a) => ({ id: a.id, title: a.title })),
    [artifactsByType]
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (selectedTargetId && effectiveSourceId) {
        onAddLink({
          sourceId: effectiveSourceId,
          targetId: selectedTargetId,
          type: linkType,
        });
        onClose();
      }
    },
    [selectedTargetId, effectiveSourceId, linkType, onAddLink, onClose]
  );

  const selectTargetType = useCallback((type: LinkableType) => {
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

    // Computed
    filteredArtifacts,

    // Actions
    handleSubmit,
    needsSourceSelection,
    chosenSourceId,
    setChosenSourceId,
    effectiveSourceId,
    sourceOptions,
  };
}
