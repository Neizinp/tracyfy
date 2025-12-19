import React, { useCallback } from 'react';
import { Search, Link as LinkIcon, Globe, Folder } from 'lucide-react';
import type { Requirement, ArtifactLink, Project, UseCase, TestCase, Information } from '../types';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useLinkModal, type LinkModalResult } from '../hooks/useLinkModal';
import { BaseArtifactModal } from './BaseArtifactModal';
import { FormField } from './forms/FormField';

export type { LinkModalResult };

interface LinkModalProps {
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

type ArtifactType = 'requirement' | 'usecase' | 'testcase' | 'information';

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  sourceArtifactId,
  sourceArtifactType,
  projects,
  currentProjectId,
  globalRequirements,
  globalUseCases,
  globalTestCases,
  globalInformation,
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
    findProjectForArtifact,
    handleSubmit,
  } = useLinkModal({
    isOpen,
    sourceArtifactId,
    sourceArtifactType,
    projects,
    currentProjectId,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
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

  if (!isOpen || !sourceArtifactId) return null;

  return (
    <BaseArtifactModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={wrappedHandleSubmit}
      title="Create Link"
      icon={<LinkIcon size={20} style={{ color: 'var(--color-accent)' }} />}
      submitLabel="Create Link"
      isSubmitDisabled={!selectedTargetId}
      width="600px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Source Artifact (read-only) */}
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
              borderRadius: '6px',
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
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontWeight: 700,
                backgroundColor:
                  sourceArtifactType === 'requirement'
                    ? 'var(--color-info)'
                    : sourceArtifactType === 'usecase'
                      ? 'var(--color-accent)'
                      : sourceArtifactType === 'testcase'
                        ? 'var(--color-success)'
                        : 'var(--color-warning)',
              }}
            >
              {sourceArtifactType.substring(0, 3)}
            </span>
            <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
              {sourceArtifactId}
            </span>
          </div>
        </div>

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
                borderRadius: '6px',
                padding: '4px',
                border: '1px solid var(--color-border)',
                gap: '4px',
              }}
            >
              {(['requirement', 'usecase', 'testcase', 'information'] as ArtifactType[]).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => selectTargetType(type)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '4px',
                      border: 'none',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: targetType === type ? 'var(--color-accent)' : 'transparent',
                      color: targetType === type ? '#fff' : 'var(--color-text-secondary)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {type === 'requirement'
                      ? 'REQ'
                      : type === 'usecase'
                        ? 'UC'
                        : type === 'testcase'
                          ? 'TC'
                          : 'INFO'}
                  </button>
                )
              )}
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
                  borderRadius: '6px',
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
                borderRadius: '6px',
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
                  const project = findProjectForArtifact(artifact.id);
                  const isCurrentProject = project?.id === currentProjectId;
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
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
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
                      {project && (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            whiteSpace: 'nowrap',
                            backgroundColor: isCurrentProject
                              ? 'var(--color-bg-card)'
                              : 'rgba(99, 102, 241, 0.15)',
                            color: isCurrentProject
                              ? 'var(--color-text-muted)'
                              : 'var(--color-accent)',
                            fontWeight: 500,
                            border: isCurrentProject
                              ? '1px solid var(--color-border)'
                              : '1px solid rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          {isCurrentProject ? 'Local' : project.name}
                        </span>
                      )}
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
              borderRadius: '6px',
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
              borderRadius: '6px',
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
                borderRadius: '4px',
                border: 'none',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: linkScope === 'project' ? 'var(--color-accent)' : 'transparent',
                color: linkScope === 'project' ? '#fff' : 'var(--color-text-secondary)',
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
                borderRadius: '4px',
                border: 'none',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: linkScope === 'global' ? 'var(--color-accent)' : 'transparent',
                color: linkScope === 'global' ? '#fff' : 'var(--color-text-secondary)',
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
