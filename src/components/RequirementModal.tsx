/**
 * RequirementModal Component
 *
 * Modal for creating and editing requirements.
 * Uses useRequirementForm hook for form state and handlers.
 */

import React from 'react';
import { Trash2 } from 'lucide-react';
import { BaseArtifactModal } from './BaseArtifactModal';
import type { Requirement } from '../types';
import { MarkdownEditor } from './MarkdownEditor';
import { formatDateTime } from '../utils/dateUtils';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI } from '../app/providers';
import { useLinkService } from '../hooks/useLinkService';
import { useCustomAttributes } from '../hooks/useCustomAttributes';
import { CustomAttributeEditor } from './CustomAttributeEditor';
import { LINK_TYPE_LABELS } from '../utils/linkTypes';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useRequirementForm } from '../hooks/useRequirementForm';

interface RequirementModalProps {
  isOpen: boolean;
  requirement: Requirement | null;
  onClose: () => void;
  onCreate: (req: Omit<Requirement, 'id' | 'children' | 'lastModified'>) => void;
  onUpdate: (id: string, updates: Partial<Requirement>) => void;
  onDelete: (id: string) => void;
}

type Tab = 'overview' | 'details' | 'relationships' | 'comments' | 'customFields' | 'history';

export const RequirementModal: React.FC<RequirementModalProps> = ({
  isOpen,
  requirement,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const { setIsLinkModalOpen, setLinkSourceId, setLinkSourceType } = useUI();

  // Use the extracted hook for form state and handlers
  const {
    isEditMode,
    currentUser,
    activeTab,
    setActiveTab,
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
    customAttributes,
    setCustomAttributes,
    showDeleteConfirm,
    handleDelete,
    confirmDelete,
    cancelDelete,
    handleSubmit,
    handleRemoveLink,
    handleNavigateToArtifact,
  } = useRequirementForm({
    isOpen,
    requirement,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
  });

  const {
    outgoingLinks,
    incomingLinks,
    loading: linksLoading,
  } = useLinkService({
    artifactId: requirement?.id,
  });

  const { definitions: customAttributeDefinitions, loading: attributesLoading } =
    useCustomAttributes();

  useKeyboardShortcuts({
    onSave: handleSubmit,
    onClose: onClose,
  });

  if (!isOpen) return null;

  const modalTitle = isEditMode ? `Edit Requirement - ${requirement?.id}` : 'New Requirement';

  const allTabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'comments', label: 'Comments' },
    { id: 'customFields', label: 'Custom Attributes' },
    ...(isEditMode ? [{ id: 'history' as Tab, label: 'Revision History' }] : []),
  ];

  return (
    <BaseArtifactModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      tabs={allTabs}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as Tab)}
      onSubmit={handleSubmit}
      submitLabel={isEditMode ? 'Save Changes' : 'Create Requirement'}
      footerActions={
        isEditMode && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn-danger"
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-status-error)',
              color: 'var(--color-status-error)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Delete
          </button>
        )
      }
    >
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Requirement['priority'])}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Requirement['status'])}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            >
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="implemented">Implemented</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Author
            </label>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: isEditMode
                  ? 'var(--color-text-muted)'
                  : currentUser
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
              }}
            >
              {isEditMode
                ? requirement?.author || 'Not specified'
                : currentUser?.name || 'No user selected'}
            </div>
          </div>

          {isEditMode && (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Date Created
              </label>
              <input
                type="text"
                value={requirement ? formatDateTime(requirement.dateCreated) : ''}
                disabled
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-muted)',
                  outline: 'none',
                  cursor: 'not-allowed',
                }}
              />
            </div>
          )}

          <div style={{ gridColumn: '1 / -1' }}>
            <MarkdownEditor
              label="Description"
              value={description}
              onChange={setDescription}
              height={200}
              placeholder="Enter description with Markdown formatting..."
            />
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <MarkdownEditor
              label="Requirement Text"
              value={text}
              onChange={setText}
              height={180}
              placeholder="Enter detailed requirement text with Markdown..."
            />
          </div>

          <div>
            <MarkdownEditor
              label="Rationale"
              value={rationale}
              onChange={setRationale}
              height={180}
              placeholder="Explain the rationale with Markdown..."
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Verification Method
            </label>
            <input
              type="text"
              value={verificationMethod}
              onChange={(e) => setVerificationMethod(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'relationships' && (
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
              <label style={{ fontSize: 'var(--font-size-sm)' }}>Linked Items</label>
              {isEditMode && requirement && (
                <button
                  type="button"
                  onClick={() => {
                    setLinkSourceId(requirement.id);
                    setLinkSourceType('requirement');
                    setIsLinkModalOpen(true);
                  }}
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
                  Save the requirement first to add relationships.
                </div>
              ) : linksLoading ? (
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
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
                      }}
                    >
                      <div
                        onClick={() => {
                          const id = link.targetId;
                          let type = 'requirement';
                          if (id.startsWith('UC-')) type = 'useCase';
                          else if (id.startsWith('TC-')) type = 'testCase';
                          else if (id.startsWith('INFO-')) type = 'information';
                          handleNavigateToArtifact(id, type);
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
                          handleRemoveLink(link.targetId);
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-error)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-muted)';
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

          {/* Incoming Links Section */}
          <div>
            <label
              style={{
                fontSize: 'var(--font-size-sm)',
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
                  No incoming links. Other artifacts can link to this requirement.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {incomingLinks.map((link, index) => (
                    <div
                      key={`${link.sourceId}-${index}`}
                      onClick={() => handleNavigateToArtifact(link.sourceId, link.sourceType)}
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
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
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
      )}

      {activeTab === 'comments' && (
        <div>
          <MarkdownEditor
            label="Comments"
            value={comments}
            onChange={setComments}
            height={400}
            placeholder="Add comments with Markdown..."
          />
        </div>
      )}

      {activeTab === 'customFields' && (
        <div>
          <CustomAttributeEditor
            definitions={customAttributeDefinitions}
            values={customAttributes}
            onChange={setCustomAttributes}
            artifactType="requirement"
            loading={attributesLoading}
          />
        </div>
      )}

      {showDeleteConfirm && (
        <div
          style={{
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-light)',
            borderRadius: '6px',
            marginTop: 'var(--spacing-md)',
          }}
        >
          <div
            style={{
              color: 'var(--color-error)',
              fontWeight: 500,
              marginBottom: 'var(--spacing-xs)',
            }}
          >
            ⚠️ Move to Trash
          </div>
          <div
            style={{
              color: 'var(--color-error)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Are you sure you want to move this requirement to the trash? You can restore it later
            from the Trash Bin.
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              type="button"
              onClick={confirmDelete}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--color-error)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Move to Trash
            </button>
            <button
              type="button"
              onClick={cancelDelete}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {activeTab === 'history' && requirement && (
        <RevisionHistoryTab artifactId={requirement.id} artifactType="requirements" />
      )}
    </BaseArtifactModal>
  );
};
