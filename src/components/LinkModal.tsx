import React, { useState, useEffect } from 'react';
import { X, Search, Link as LinkIcon } from 'lucide-react';
import type { Requirement, ArtifactLink, Project, UseCase, TestCase, Information } from '../types';

interface LinkModalProps {
  isOpen: boolean;
  sourceArtifactId: string | null;
  sourceArtifactType: 'requirement' | 'usecase' | 'testcase' | 'information';
  projects: Project[];
  currentProjectId: string;
  globalRequirements: Requirement[];
  globalUseCases: UseCase[];
  globalTestCases: TestCase[];
  globalInformation: Information[];
  onClose: () => void;
  onAddLink: (link: ArtifactLink) => void;
}

type ArtifactType = 'requirement' | 'usecase' | 'testcase' | 'information';

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

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
  const [targetType, setTargetType] = useState<ArtifactType>('requirement');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [linkType, setLinkType] = useState<ArtifactLink['type']>('relates_to');

  useEffect(() => {
    if (isOpen) {
      setTargetType('requirement');
      setSearchQuery('');
      setSelectedTargetId('');
      setLinkType('relates_to');
    }
  }, [isOpen]);

  // Helper to find which project an artifact belongs to
  const findProjectForArtifact = (id: string): Project | undefined => {
    return projects.find(
      (p) =>
        p.requirementIds.includes(id) ||
        p.useCaseIds.includes(id) ||
        p.testCaseIds.includes(id) ||
        p.informationIds.includes(id)
    );
  };

  // Filter artifacts based on type and search
  const getFilteredArtifacts = () => {
    let artifacts: { id: string; title: string; description?: string }[] = [];

    if (targetType === 'requirement') artifacts = globalRequirements;
    else if (targetType === 'usecase') artifacts = globalUseCases;
    else if (targetType === 'testcase') artifacts = globalTestCases;
    else if (targetType === 'information')
      artifacts = globalInformation.map((i) => ({
        id: i.id,
        title: i.title,
        // Information has 'content' but usually strict 'description' is displayed.
        // We can map content to description or just use title.
        description: i.content.length > 100 ? i.content.substring(0, 100) + '...' : i.content,
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
  };

  const filteredArtifacts = getFilteredArtifacts();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedTargetId) {
      onAddLink({
        targetId: selectedTargetId,
        type: linkType,
      });
      onClose();
    }
  };

  useKeyboardShortcuts({
    onSave: handleSubmit,
    onClose: onClose,
  });

  if (!isOpen || !sourceArtifactId) return null;

  const getSourceLabel = () => {
    switch (sourceArtifactType) {
      case 'requirement':
        return 'Source Requirement';
      case 'usecase':
        return 'Source Use Case';
      case 'testcase':
        return 'Source Test Case';
      case 'information':
        return 'Source Information';
      default:
        return 'Source Artifact';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '42rem',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LinkIcon size={20} style={{ color: 'var(--color-accent)' }} />
            Create Link
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          {/* Source Artifact */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
                marginBottom: '0.25rem',
              }}
            >
              {getSourceLabel()}
            </label>
            <div
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontFamily: 'monospace',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-inverse)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  backgroundColor:
                    sourceArtifactType === 'requirement'
                      ? 'var(--color-info-bg)'
                      : sourceArtifactType === 'usecase'
                        ? 'var(--color-accent-bg, rgba(99, 102, 241, 0.3))'
                        : sourceArtifactType === 'testcase'
                          ? 'var(--color-success-bg)'
                          : 'var(--color-warning-bg)',
                }}
              >
                {sourceArtifactType.substring(0, 3)}
              </span>
              {sourceArtifactId}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Target Type */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: '0.5rem',
                }}
              >
                Target Type
              </label>
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
                      onClick={() => {
                        setTargetType(type);
                        setSelectedTargetId('');
                      }}
                      style={{
                        flex: 1,
                        padding: '0.375rem 0.5rem',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        backgroundColor:
                          targetType === type ? 'var(--color-accent)' : 'transparent',
                        color: targetType === type ? '#fff' : 'var(--color-text-secondary)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {type === 'requirement'
                        ? 'Req'
                        : type === 'usecase'
                          ? 'UC'
                          : type === 'testcase'
                            ? 'TC'
                            : 'Info'}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Search & Select Target */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: '0.5rem',
                }}
              >
                Select Target
              </label>
              <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    fontSize: 'var(--font-size-sm)',
                  }}
                />
              </div>

              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-bg-secondary)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {filteredArtifacts.length === 0 ? (
                  <div
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      fontStyle: 'italic',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    No artifacts found
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
                          padding: '0.75rem',
                          borderBottom: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1, marginRight: '0.75rem' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: 'var(--font-size-xs)',
                                fontFamily: 'monospace',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--color-bg-card)',
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
                          {artifact.description && (
                            <div
                              style={{
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--color-text-muted)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {artifact.description}
                            </div>
                          )}
                        </div>
                        {project && (
                          <span
                            style={{
                              fontSize: 'var(--font-size-xs)',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              whiteSpace: 'nowrap',
                              backgroundColor: isCurrentProject
                                ? 'var(--color-bg-card)'
                                : 'rgba(99, 102, 241, 0.2)',
                              color: isCurrentProject
                                ? 'var(--color-text-muted)'
                                : 'var(--color-accent)',
                              border: isCurrentProject
                                ? 'none'
                                : '1px solid rgba(99, 102, 241, 0.3)',
                            }}
                          >
                            {isCurrentProject ? 'Current Project' : project.name}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Link Type */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: '0.5rem',
                }}
              >
                Link Type
              </label>
              <select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value as ArtifactLink['type'])}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <option value="relates_to">Relates To</option>
                <option value="depends_on">Depends On</option>
                <option value="conflicts_with">Conflicts With</option>
              </select>
            </div>

            {/* Footer Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedTargetId}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: selectedTargetId
                    ? 'var(--color-accent)'
                    : 'var(--color-bg-secondary)',
                  color: selectedTargetId ? '#fff' : 'var(--color-text-muted)',
                  cursor: selectedTargetId ? 'pointer' : 'not-allowed',
                  fontWeight: 500,
                }}
              >
                Create Link
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
