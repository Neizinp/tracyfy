import React from 'react';
import { Plus, Trash2, Search, FileText, User as UserIcon } from 'lucide-react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useWorkflowForm } from '../hooks/useWorkflowForm';
import { BaseArtifactModal } from './BaseArtifactModal';
import { ArtifactOverviewFields } from './forms/ArtifactOverviewFields';
import { ArtifactDetailsSections } from './forms/ArtifactDetailsSections';
import { FormField } from './forms/FormField';
import { useUser } from '../app/providers';
import type { Workflow } from '../types';

interface WorkflowModalProps {
  isOpen: boolean;
  workflow?: Workflow | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  isOpen,
  workflow,
  onClose,
  onSuccess,
}) => {
  const { currentUser, users } = useUser();
  const {
    title,
    setTitle,
    description,
    setDescription,
    assignedTo,
    setAssignedTo,
    selectedArtifactIds,
    artifactSearch,
    setArtifactSearch,
    isSubmitting,
    isValid,
    availableArtifacts,
    otherUsers,
    handleAddArtifact,
    handleRemoveArtifact,
    getArtifactInfo,
    handleSubmit,
  } = useWorkflowForm({ isOpen, workflow, onClose, onSuccess });

  useKeyboardShortcuts({ onClose });

  if (!isOpen) return null;

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || userId;
  };

  return (
    <BaseArtifactModal
      isOpen={isOpen}
      onClose={onClose}
      title={workflow ? 'Edit Workflow' : 'New Workflow'}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      submitLabel={workflow ? 'Update Workflow' : 'Create Workflow'}
      isSubmitting={isSubmitting}
      isSubmitDisabled={!isValid}
      width="650px"
    >
      <ArtifactOverviewFields
        title={title}
        setTitle={setTitle}
        author={workflow ? getUserName(workflow.createdBy || '') : currentUser?.name}
        dateCreated={workflow?.dateCreated}
        isEditMode={!!workflow}
        currentUser={currentUser?.name}
        hidePriority
        hideStatus
        titlePlaceholder="e.g., Approve Authentication Requirements"
      />

      {/* Assign To Section */}
      <FormField label="Assign To" icon={<UserIcon size={14} />} required>
        {otherUsers.length === 0 ? (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(234, 179, 8, 0.1)',
              borderRadius: '6px',
              color: 'rgb(234, 179, 8)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            No other users available. Create another user in User Settings to assign workflows.
          </div>
        ) : (
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
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
            <option value="">Select a user...</option>
            {otherUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        )}
      </FormField>

      {/* Artifacts Selection Section */}
      <FormField
        label="Artifacts for Approval"
        icon={<FileText size={14} />}
        required
        description="Select artifacts that need to be reviewed and approved in this workflow."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {/* Selected Artifacts Tags */}
          {selectedArtifactIds.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              {selectedArtifactIds.map((id) => {
                const info = getArtifactInfo(id);
                return (
                  <div
                    key={id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderRadius: '4px',
                      fontSize: 'var(--font-size-sm)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        color: 'var(--color-accent)',
                        fontWeight: 600,
                      }}
                    >
                      {id}
                    </span>
                    {info && (
                      <span
                        style={{
                          color: 'var(--color-text-muted)',
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {info.title}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveArtifact(id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
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
                value={artifactSearch}
                onChange={(e) => setArtifactSearch(e.target.value)}
                placeholder="Search artifacts by ID or title..."
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

            {/* Artifact Dropdown */}
            {artifactSearch && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  maxHeight: '200px',
                  overflow: 'auto',
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 10,
                }}
              >
                {availableArtifacts.length === 0 ? (
                  <div
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    No matching artifacts found
                  </div>
                ) : (
                  availableArtifacts.slice(0, 10).map((artifact) => (
                    <div
                      key={artifact.id}
                      onClick={() => handleAddArtifact(artifact.id)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Plus size={14} style={{ color: 'var(--color-accent)' }} />
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 600,
                        }}
                      >
                        {artifact.id}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 'var(--font-size-sm)',
                        }}
                      >
                        {artifact.title}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted)',
                          backgroundColor: 'var(--color-bg-secondary)',
                          padding: '2px 4px',
                          borderRadius: '3px',
                        }}
                      >
                        {artifact.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </FormField>

      <ArtifactDetailsSections
        fields={[
          {
            label: 'Description',
            value: description,
            onChange: setDescription,
            placeholder: 'Add any notes or context for the approver...',
            height: 120,
          },
        ]}
      />
    </BaseArtifactModal>
  );
};
