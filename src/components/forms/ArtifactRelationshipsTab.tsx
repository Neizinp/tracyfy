import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Link } from '../../types';
import type { IncomingLink } from '../../services/diskLinkService';
import { LINK_TYPE_LABELS } from '../../utils/linkTypes';

interface ArtifactRelationshipsTabProps {
  artifactId: string | undefined;
  artifactType: string;
  isEditMode: boolean;
  outgoingLinks: Link[];
  incomingLinks: IncomingLink[];
  loading: boolean;
  onAddLink: () => void;
  onRemoveLink: (targetId: string) => void;
  onNavigateToArtifact: (id: string, type: string) => void;
}

export const ArtifactRelationshipsTab: React.FC<ArtifactRelationshipsTabProps> = ({
  artifactId,
  artifactType,
  isEditMode,
  outgoingLinks,
  incomingLinks,
  loading,
  onAddLink,
  onRemoveLink,
  onNavigateToArtifact,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Linked Items</label>
          {isEditMode && artifactId && (
            <button
              type="button"
              onClick={onAddLink}
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-accent)',
                background: 'none',
                border: '1px solid var(--color-accent)',
                borderRadius: '4px',
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              + Add Link
            </button>
          )}
        </div>
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: '8px',
            backgroundColor: 'var(--color-bg-app)',
            minHeight: '100px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {!isEditMode ? (
            <div
              style={{
                padding: '16px',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
                textAlign: 'center',
              }}
            >
              Save the {artifactType} first to add relationships.
            </div>
          ) : loading ? (
            <div
              style={{
                padding: '8px',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Loading links...
            </div>
          ) : outgoingLinks.length === 0 ? (
            <div
              style={{
                padding: '8px',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              No linked items. Click &quot;+ Add Link&quot; to create relationships with other
              artifacts.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {outgoingLinks.map((link) => (
                <div
                  key={link.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    backgroundColor: 'var(--color-bg-card)',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div
                    onClick={() => {
                      const id = link.targetId;
                      let type = 'requirement';
                      if (id.startsWith('UC-')) type = 'useCase';
                      else if (id.startsWith('TC-')) type = 'testCase';
                      else if (id.startsWith('INFO-')) type = 'information';
                      else if (id.startsWith('RISK-')) type = 'risk';
                      onNavigateToArtifact(id, type);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: 'var(--font-size-sm)',
                      cursor: 'pointer',
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-bg-secondary)',
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {LINK_TYPE_LABELS[link.type] || link.type.replace('_', ' ')}
                    </span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
                    <span style={{ fontWeight: 500, color: 'var(--color-accent)' }}>
                      {link.targetId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLink(link.targetId);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s ease',
                    }}
                    title="Remove link"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            marginBottom: 'var(--spacing-xs)',
            display: 'block',
          }}
        >
          Incoming Links
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              marginLeft: '8px',
              fontWeight: 400,
            }}
          >
            (artifacts that link to this)
          </span>
        </label>
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: '8px',
            backgroundColor: 'var(--color-bg-app)',
            minHeight: '80px',
            maxHeight: '150px',
            overflowY: 'auto',
          }}
        >
          {incomingLinks.length === 0 ? (
            <div
              style={{
                padding: '8px',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              No incoming links. Other artifacts can link to this {artifactType}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {incomingLinks.map((link, index) => (
                <div
                  key={`${link.sourceId}-${index}`}
                  onClick={() => onNavigateToArtifact(link.sourceId, link.sourceType)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 8px',
                    backgroundColor: 'var(--color-bg-card)',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--font-size-sm)',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <span style={{ fontWeight: 500, color: 'var(--color-accent)' }}>
                    {link.sourceId}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--color-bg-secondary)',
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {link.linkType.replace('_', ' ')}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                      marginLeft: 'auto',
                    }}
                  >
                    ({link.sourceType})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
