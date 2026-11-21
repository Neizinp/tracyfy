/**
 * useLinkModal Hook
 *
 * Manages state and handlers for the LinkModal component.
 * Includes target type selection, search filtering, and link creation.
 *
 * The relation menu offers only what the traceability rules allow between
 * the two kinds, read from the source the user started at ("Verified by"
 * from a requirement). The result is the link as it is stored: "Verified by
 * TC-007" from REQ-012 creates "TC-007 verifies REQ-012".
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { LinkType } from '../types';
import { KIND_IDS, kindOfId, type ArtifactKindId } from '../domain/artifactKinds';
import { linkOptions, type LinkOption, type TraceabilityRules } from '../domain/traceability';
import type { ArtifactsByKind } from './useLinkableArtifacts';

/** A link to create, in the direction it is stored */
export interface LinkModalResult {
  sourceId: string;
  targetId: string;
  type: LinkType;
}

interface UseLinkModalOptions {
  isOpen: boolean;
  sourceArtifactId: string | null;
  sourceArtifactType: ArtifactKindId;
  /** Every linkable artifact, grouped by type */
  artifactsByType: ArtifactsByKind;
  rules: TraceabilityRules;
  onClose: () => void;
  onAddLink: (link: LinkModalResult) => void;
}

export function useLinkModal({
  isOpen,
  sourceArtifactId,
  sourceArtifactType,
  artifactsByType,
  rules,
  onClose,
  onAddLink,
}: UseLinkModalOptions) {
  const [targetType, setTargetType] = useState<ArtifactKindId>('requirement');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [optionKey, setOptionKey] = useState('');
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
      setOptionKey('');
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
      KIND_IDS.flatMap((k) => artifactsByType[k])
        .filter((a) => !a.isDeleted)
        .map((a) => ({ id: a.id, title: a.title })),
    [artifactsByType]
  );

  const sourceKind: ArtifactKindId | undefined = sourceArtifactId
    ? sourceArtifactType
    : kindOfId(chosenSourceId);

  /** What the rules allow from the source's kind to each target kind */
  const optionsByKind = useMemo(
    () =>
      Object.fromEntries(
        KIND_IDS.map((k) => [k, sourceKind ? linkOptions(rules, sourceKind, k) : []])
      ) as Record<ArtifactKindId, LinkOption[]>,
    [rules, sourceKind]
  );
  const typeOptions = optionsByKind[targetType];
  // Until the user picks one: the generic association, so nothing stronger is claimed by accident
  const selectedOption =
    typeOptions.find((o) => o.key === optionKey) ??
    typeOptions.find((o) => o.type === 'related_to') ??
    typeOptions[0];

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!selectedTargetId || !effectiveSourceId || !selectedOption) return;
      const forward = selectedOption.direction === 'forward';
      onAddLink({
        sourceId: forward ? effectiveSourceId : selectedTargetId,
        targetId: forward ? selectedTargetId : effectiveSourceId,
        type: selectedOption.type,
      });
      onClose();
    },
    [selectedTargetId, effectiveSourceId, selectedOption, onAddLink, onClose]
  );

  const selectTargetType = useCallback((type: ArtifactKindId) => {
    setTargetType(type);
    setSelectedTargetId('');
    setOptionKey('');
  }, []);

  return {
    // Form state
    targetType,
    selectTargetType,
    searchQuery,
    setSearchQuery,
    selectedTargetId,
    setSelectedTargetId,
    /** The relations the rules allow for the chosen kinds, as read from the source */
    typeOptions,
    optionsByKind,
    selectedOption,
    setOptionKey,

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
