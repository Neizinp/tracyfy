import React, { useCallback } from 'react';
import { Search, Link as LinkIcon, Globe, Folder } from 'lucide-react';
import type { ArtifactLink } from '../types';
import {
  LINKABLE_TYPES,
  linkableTypeInfo,
  type ArtifactsByType,
  type LinkableType,
} from '../constants/linkableArtifacts';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useLinkModal, type LinkModalResult } from '../hooks/useLinkModal';
import { BaseArtifactModal } from './BaseArtifactModal';
import { FormField } from './forms/FormField';

export type { LinkModalResult };

interface LinkModalProps {
  isOpen: boolean;
  sourceArtifactId: string | null;
  sourceArtifactType: LinkableType;
  currentProjectId: string;
  /** Every linkable artifact, grouped by type */
  artifactsByType: ArtifactsByType;
  onClose: () => void;
  onAddLink: (link: LinkModalResult) => void;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  sourceArtifactId,
  sourceArtifactType,
  currentProjectId,
  artifactsByType,
  onClose,
  onAddLink,
}) => {
  const {
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
    currentProjectId,
    artifactsByType,
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
      isSubmitDisabled={!selectedTargetId || !effectiveSourceId}
      width="600px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
              }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                fontWeight: 500,
              }}
            >
              Source Artifact
            </label>
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'monospace',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--color-on-accent)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  backgroundColor: linkableTypeInfo(sourceArtifactType).color,
                }}
              >
                {linkableTypeInfo(sourceArtifactType).short}
              </span>
              <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                {sourceArtifactId}
              </span>
            </div>
          </div>
        )}

        {/* Target Selection */}
        <FormField
          label="Target Artifact"
          fullWidth
          description="Select the artifact you want to link to."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Type Selector */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px',
                border: '1px solid var(--color-border)',
                gap: '4px',
              }}
            >
              {LINKABLE_TYPES.map(({ type, short, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => selectTargetType(type)}
                  title={label}
                  aria-pressed={targetType === type}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: targetType === type ? 'var(--color-accent)' : 'transparent',
                    color:
                      targetType === type
                        ? 'var(--color-on-accent)'
                        : 'var(--color-text-secondary)',
                    transition: 'all 0.2s',
                  }}
                >
                  {short}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search artifacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  outline: 'none',
                }}
              />
            </div>

            {/* List */}
            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-bg-secondary)',
                maxHeight: '180px',
                overflowY: 'auto',
              }}
            >
              {filteredArtifacts.length === 0 ? (
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    fontSize: 'var(--font-size-sm)',
                    fontStyle: 'italic',
                  }}
                >
                  No {targetType}s found
                </div>
              ) : (
                filteredArtifacts.map((artifact) => {
                  const isSelected = selectedTargetId === artifact.id;

                  return (
                    <div
                      key={artifact.id}
                      onClick={() => setSelectedTargetId(artifact.id)}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isSelected ? 'var(--color-info-bg)' : 'transparent',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        !isSelected &&
                        (e.currentTarget.style.backgroundColor = 'var(--color-bg-app)')
                      }
                      onMouseLeave={(e) =>
                        !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      <div style={{ minWidth: 0, flex: 1, marginRight: '10px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '2px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 'var(--font-size-xs)',
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              color: 'var(--color-accent)',
                            }}
                          >
                            {artifact.id}
                          </span>
                          <span
                            style={{
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {artifact.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </FormField>

        {/* Link Type */}
        <FormField label="Relation Type" fullWidth>
          <select
            value={linkType}
            onChange={(e) => setLinkType(e.target.value as ArtifactLink['type'])}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-app)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
            }}
          >
            <option value="parent">Parent (hierarchical decomposition)</option>
            <option value="child">Child (hierarchical decomposition)</option>
            <option value="derived_from">Derived From (logical derivation)</option>
            <option value="depends_on">Depends On (dependency)</option>
            <option value="conflicts_with">Conflicts With (mutual exclusivity)</option>
            <option value="duplicates">Duplicates / Similar To (redundancy)</option>
            <option value="refines">Refines (adds detail)</option>
            <option value="satisfies">Satisfies / Implements (design link)</option>
            <option value="verifies">Verifies (test/validation link)</option>
            <option value="constrains">Constrains (imposes restrictions)</option>
            <option value="requires">Requires (precondition)</option>
            <option value="related_to">Related To (generic association)</option>
          </select>
        </FormField>

        {/* Link Scope */}
        <FormField
          label="Link Visibility"
          fullWidth
          description="Define where this link can be seen."
        >
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-sm)',
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
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: linkScope === 'project' ? 'var(--color-accent)' : 'transparent',
                color:
                  linkScope === 'project'
                    ? 'var(--color-on-accent)'
                    : 'var(--color-text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              <Folder size={14} />
              Current Project
            </button>
            <button
              type="button"
              onClick={() => setLinkScope('global')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: linkScope === 'global' ? 'var(--color-accent)' : 'transparent',
                color:
                  linkScope === 'global' ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              <Globe size={14} />
              Global
            </button>
          </div>
        </FormField>
      </div>
    </BaseArtifactModal>
  );
};
