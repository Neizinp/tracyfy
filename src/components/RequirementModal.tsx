import React, { useMemo } from 'react';
import { BaseArtifactModal } from './BaseArtifactModal';
import type { Requirement } from '../types';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI } from '../app/providers';
import { useLinkService } from '../hooks/useLinkService';
import { useCustomAttributes } from '../hooks/useCustomAttributes';
import { CustomAttributeEditor } from './CustomAttributeEditor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useRequirementForm } from '../hooks/useRequirementForm';
import { ArtifactOverviewFields } from './forms/ArtifactOverviewFields';
import { ArtifactRelationshipsTab } from './forms/ArtifactRelationshipsTab';
import { ArtifactDetailsSections } from './forms/ArtifactDetailsSections';

interface RequirementModalProps {
  isOpen: boolean;
  requirement: Requirement | null;
  onClose: () => void;
  onCreate: (req: Omit<Requirement, 'id' | 'children' | 'lastModified'>) => void;
  onUpdate: (id: string, updates: Partial<Requirement>) => void;
  onDelete: (id: string) => void;
  onBack?: () => void;
}

type Tab = 'overview' | 'details' | 'relationships' | 'comments' | 'customFields' | 'history';

export const RequirementModal: React.FC<RequirementModalProps> = ({
  isOpen,
  requirement,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onBack,
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

  const priorityOptions = useMemo(
    () => [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: 'draft', label: 'Draft' },
      { value: 'approved', label: 'Approved' },
      { value: 'implemented', label: 'Implemented' },
      { value: 'verified', label: 'Verified' },
    ],
    []
  );

  const detailFields = useMemo(
    () => [
      {
        label: 'Rationale',
        value: rationale,
        onChange: setRationale,
        height: 150,
        placeholder: 'Explain the reason for this requirement...',
      },
      {
        label: 'Comments',
        value: comments,
        onChange: setComments,
        height: 150,
        placeholder: 'Internal notes or discussion...',
      },
    ],
    [rationale, setRationale, comments, setComments]
  );

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
      onBack={onBack}
      title={modalTitle}
      tabs={allTabs}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as Tab)}
      onSubmit={handleSubmit}
      submitLabel={isEditMode ? 'Save Changes' : 'Create Requirement'}
      formId="new-requirement-form"
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <ArtifactOverviewFields
            title={title}
            setTitle={setTitle}
            priority={priority}
            setPriority={setPriority}
            priorityOptions={priorityOptions}
            status={status}
            setStatus={setStatus}
            statusOptions={statusOptions}
            author={requirement?.author}
            dateCreated={requirement?.dateCreated}
            isEditMode={isEditMode}
            currentUser={currentUser?.name}
            titlePlaceholder="e.g., System shall authenticate users"
          />
          <ArtifactDetailsSections
            fields={[
              {
                label: 'Requirement Text',
                value: text,
                onChange: setText,
                height: 200,
                placeholder: 'Enter detailed requirement text with Markdown...',
              },
              {
                label: 'Description',
                value: description,
                onChange: setDescription,
                height: 150,
                placeholder: 'Enter description with Markdown formatting...',
              },
            ]}
          />
        </div>
      )}

      {activeTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <ArtifactDetailsSections fields={detailFields} />
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
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
        <ArtifactRelationshipsTab
          artifactId={requirement?.id}
          artifactType="requirement"
          isEditMode={isEditMode}
          outgoingLinks={outgoingLinks}
          incomingLinks={incomingLinks}
          loading={linksLoading}
          onAddLink={() => {
            if (requirement) {
              setLinkSourceId(requirement.id);
              setLinkSourceType('requirement');
              setIsLinkModalOpen(true);
            }
          }}
          onRemoveLink={handleRemoveLink}
          onNavigateToArtifact={handleNavigateToArtifact}
        />
      )}

      {activeTab === 'comments' && (
        <ArtifactDetailsSections
          fields={[
            {
              label: 'Comments',
              value: comments,
              onChange: setComments,
              height: 400,
              placeholder: 'Add comments with Markdown...',
            },
          ]}
        />
      )}

      {activeTab === 'customFields' && (
        <CustomAttributeEditor
          definitions={customAttributeDefinitions}
          values={customAttributes}
          onChange={setCustomAttributes}
          artifactType="requirement"
          loading={attributesLoading}
        />
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
