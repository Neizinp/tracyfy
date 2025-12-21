import React, { useMemo } from 'react';
import { BaseArtifactModal } from './BaseArtifactModal';
import type { UseCase } from '../types';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI } from '../app/providers';
import { useLinkService } from '../hooks/useLinkService';
import { useCustomAttributes } from '../hooks/useCustomAttributes';
import { CustomAttributeEditor } from './CustomAttributeEditor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useUseCaseForm } from '../hooks/useUseCaseForm';
import { ArtifactOverviewFields } from './forms/ArtifactOverviewFields';
import { ArtifactRelationshipsTab } from './forms/ArtifactRelationshipsTab';
import { ArtifactDetailsSections } from './forms/ArtifactDetailsSections';
import { FormField } from './forms/FormField';

interface UseCaseModalProps {
  isOpen: boolean;
  useCase?: UseCase | null;
  onClose: () => void;
  onSubmit: (
    useCase: Omit<UseCase, 'id' | 'lastModified'> | { id: string; updates: Partial<UseCase> }
  ) => void;
  onDelete: (id: string) => void;
  onBack?: () => void;
}

type Tab = 'overview' | 'flows' | 'conditions' | 'relationships' | 'customAttributes' | 'history';

export const UseCaseModal: React.FC<UseCaseModalProps> = ({
  isOpen,
  useCase,
  onClose,
  onSubmit,
  onDelete,
  onBack,
}) => {
  const { setIsLinkModalOpen, setLinkSourceId, setLinkSourceType } = useUI();

  // Use the extracted hook for form state and handlers
  const {
    author,
    setAuthor,
    currentUser,
    isEditMode,
    activeTab,
    setActiveTab,
    title,
    setTitle,
    description,
    setDescription,
    actor,
    setActor,
    preconditions,
    setPreconditions,
    postconditions,
    setPostconditions,
    mainFlow,
    setMainFlow,
    alternativeFlows,
    setAlternativeFlows,
    priority,
    setPriority,
    status,
    setStatus,
    customAttributes,
    setCustomAttributes,
    handleSubmit,
    handleNavigateToArtifact,
    handleRemoveLink,
    handleDelete,
    showDeleteConfirm,
    cancelDelete,
  } = useUseCaseForm({
    isOpen,
    useCase,
    onClose,
    onSubmit,
  });

  const {
    outgoingLinks,
    incomingLinks,
    loading: linksLoading,
  } = useLinkService({
    artifactId: useCase?.id,
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

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'flows', label: 'Flows' },
    { id: 'conditions', label: 'Conditions' },
    ...(isEditMode ? [{ id: 'relationships' as Tab, label: 'Relationships' }] : []),
    { id: 'customAttributes', label: 'Custom Attributes' },
    ...(isEditMode ? [{ id: 'history' as Tab, label: 'Revision History' }] : []),
  ];

  return (
    <BaseArtifactModal
      isOpen={isOpen}
      onClose={onClose}
      onBack={onBack}
      title={isEditMode ? `Edit Use Case - ${useCase?.id}` : 'New Use Case'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as Tab)}
      onSubmit={handleSubmit}
      submitLabel={isEditMode ? 'Save Changes' : 'Create Use Case'}
      formId="new-usecase-form"
      showDeleteConfirm={showDeleteConfirm}
      onDeleteConfirm={() => {
        if (useCase) {
          onDelete(useCase.id);
          onClose();
        }
      }}
      onDeleteCancel={cancelDelete}
      deleteConfirmTitle="Move to Trash"
      deleteConfirmMessage="Are you sure you want to move this use case to the trash?"
      footerActions={
        isEditMode && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn-outline-danger"
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
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}
          >
            <ArtifactOverviewFields
              title={title}
              setTitle={setTitle}
              priority={priority}
              setPriority={setPriority}
              priorityOptions={priorityOptions}
              status={status}
              setStatus={setStatus}
              statusOptions={statusOptions}
              author={author}
              setAuthor={setAuthor}
              currentUser={currentUser?.name}
              isEditMode={isEditMode}
              dateCreated={useCase?.dateCreated}
              titlePlaceholder="e.g., User Login"
            />
            <FormField label="Actor" required>
              <input
                type="text"
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                required
                placeholder="e.g., End User, Administrator, System"
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
            </FormField>
          </div>
          <ArtifactDetailsSections
            fields={[
              {
                label: 'Description',
                value: description,
                onChange: setDescription,
                height: 150,
                placeholder: 'Brief description of the use case',
              },
            ]}
          />
        </div>
      )}

      {activeTab === 'flows' && (
        <ArtifactDetailsSections
          fields={[
            {
              label: 'Main Flow *',
              value: mainFlow,
              onChange: setMainFlow,
              height: 250,
              placeholder: '1. User does X\n2. System does Y',
            },
            {
              label: 'Alternative Flows',
              value: alternativeFlows || '',
              onChange: setAlternativeFlows,
              height: 200,
            },
          ]}
        />
      )}

      {activeTab === 'conditions' && (
        <ArtifactDetailsSections
          fields={[
            {
              label: 'Preconditions',
              value: preconditions,
              onChange: setPreconditions,
              height: 200,
            },
            {
              label: 'Postconditions',
              value: postconditions,
              onChange: setPostconditions,
              height: 200,
            },
          ]}
        />
      )}

      {activeTab === 'relationships' && useCase && (
        <ArtifactRelationshipsTab
          artifactId={useCase.id}
          artifactType="use case"
          isEditMode={isEditMode}
          outgoingLinks={outgoingLinks}
          incomingLinks={incomingLinks}
          loading={linksLoading}
          onAddLink={() => {
            setLinkSourceId(useCase.id);
            setLinkSourceType('usecase');
            setIsLinkModalOpen(true);
          }}
          onRemoveLink={handleRemoveLink}
          onNavigateToArtifact={handleNavigateToArtifact}
        />
      )}

      {activeTab === 'history' && useCase && (
        <RevisionHistoryTab artifactId={useCase.id} artifactType="usecases" />
      )}

      {activeTab === 'customAttributes' && (
        <CustomAttributeEditor
          definitions={customAttributeDefinitions}
          values={customAttributes}
          onChange={setCustomAttributes}
          artifactType="useCase"
          loading={attributesLoading}
        />
      )}
    </BaseArtifactModal>
  );
};
