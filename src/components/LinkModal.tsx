import React, { useCallback } from 'react';
import { Search, Link as LinkIcon } from 'lucide-react';
import { ARTIFACT_KINDS, kind, type ArtifactKindId } from '../domain/artifactKinds';
import { LINK_TYPES, type LinkType } from '../domain/linkTypes';

const linkTypeDescription = (type: LinkType) => LINK_TYPES[type].description;
import type { ArtifactsByKind } from '../hooks/useLinkableArtifacts';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useLinkModal, type LinkModalResult } from '../hooks/useLinkModal';
import { BaseArtifactModal } from './BaseArtifactModal';
import { FormField } from './forms/FormField';
import { useAppStore } from '../state';

export type { LinkModalResult };

interface LinkModalProps {
  isOpen: boolean;
  sourceArtifactId: string | null;
  sourceArtifactType: ArtifactKindId;
  /** Every linkable artifact, grouped by type */
  artifactsByType: ArtifactsByKind;
  onClose: () => void;
  onAddLink: (link: LinkModalResult) => void;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  sourceArtifactId,
  sourceArtifactType,
  artifactsByType,
  onClose,
  onAddLink,
}) => {
  const rules = useAppStore((s) => s.settings.traceability);
  const {
    targetType,
    selectTargetType,
    searchQuery,
    setSearchQuery,
    selectedTargetId,
    setSelectedTargetId,
    typeOptions,
    optionsByKind,
    selectedOption,
    setOptionKey,
    filteredArtifacts,
    handleSubmit,
    needsSourceSelection,
    chosenSourceId,
    setChosenSourceId,
    effectiveSourceId,
    sourceOptions,
  } = useLinkModal({
    isOpen,
    sourceArtifactId,
    sourceArtifactType,
    artifactsByType,
    rules,
    onClose,
    onAddLink,
  });

  const wrappedHandleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      handleSubmit(e);
    },
    [handleSubmit]
  );

  useKeyboardShortcuts({
    onSave: wrappedHandleSubmit,
    onClose: onClose,
  });

  if (!isOpen) return null;

  return (
    <BaseArtifactModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={wrappedHandleSubmit}
      title="Create Link"
      icon={<LinkIcon size={20} style={{ color: 'var(--color-accent)' }} />}
      submitLabel="Create Link"
      isSubmitDisabled={!selectedTargetId || !effectiveSourceId || !selectedOption}
      width="600px"
    >
      <div className="tf-linkmodal">
        {needsSourceSelection ? (
          <FormField
            label="Source Artifact"
            fullWidth
            description="Select the artifact the link starts from."
          >
            <select
              aria-label="Source Artifact"
              value={chosenSourceId}
              onChange={(e) => setChosenSourceId(e.target.value)}
              className="tf-linkmodal-box"
            >
              <option value="">Select source…</option>
              {sourceOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} – {a.title}
                </option>
              ))}
            </select>
          </FormField>
        ) : (
          // Source Artifact (read-only)
          <div className="tf-linkmodal-source">
            <label className="tf-linkmodal-label">Source Artifact</label>
            <div className="tf-linkmodal-box tf-linkmodal-source-id">
              <span
                className="tf-linkmodal-badge"
                // The kind's own color
                style={{ backgroundColor: kind(sourceArtifactType).color.text }}
              >
                {kind(sourceArtifactType).prefix}
              </span>
              <span className="tf-linkmodal-id">{sourceArtifactId}</span>
            </div>
          </div>
        )}

        {/* Target Selection */}
        <FormField
          label="Target Artifact"
          fullWidth
          description="Select the artifact you want to link to."
        >
          <div className="tf-linkmodal-target">
            <div className="tf-linkmodal-kinds">
              {ARTIFACT_KINDS.map(({ id: type, prefix: short, label: { plural: label } }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => selectTargetType(type)}
                  title={
                    optionsByKind[type].length > 0
                      ? label
                      : `The traceability rules allow no link to ${label.toLowerCase()} from here`
                  }
                  disabled={optionsByKind[type].length === 0}
                  aria-pressed={targetType === type}
                  className="tf-linkmodal-kind"
                >
                  {short}
                </button>
              ))}
            </div>

            <div className="tf-linkmodal-search">
              <Search size={14} className="tf-linkmodal-search-icon" />
              <input
                type="text"
                placeholder="Search artifacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="tf-linkmodal-list">
              {filteredArtifacts.length === 0 ? (
                <div className="tf-linkmodal-empty">No {targetType}s found</div>
              ) : (
                filteredArtifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    onClick={() => setSelectedTargetId(artifact.id)}
                    className="tf-linkmodal-item"
                    data-selected={selectedTargetId === artifact.id || undefined}
                  >
                    <span className="tf-linkmodal-item-id">{artifact.id}</span>
                    <span className="tf-linkmodal-item-title">{artifact.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </FormField>

        {/* Relation: only what the traceability rules allow, read from the source */}
        <FormField
          label="Relation Type"
          fullWidth
          htmlFor="link-relation"
          description={selectedOption ? linkTypeDescription(selectedOption.type) : undefined}
        >
          {typeOptions.length === 0 ? (
            <div role="alert" className="tf-hint">
              The traceability rules in tracyfy.yaml allow no link between these kinds.
            </div>
          ) : (
            <select
              id="link-relation"
              className="tf-input"
              value={selectedOption?.key ?? ''}
              onChange={(e) => setOptionKey(e.target.value)}
            >
              {typeOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>
    </BaseArtifactModal>
  );
};
