import React, { useMemo } from 'react';
import { BaseArtifactModal } from './BaseArtifactModal';
import type { TestCase } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI } from '../app/providers';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useLinkService } from '../hooks/useLinkService';
import { useCustomAttributes } from '../hooks/useCustomAttributes';
import { CustomAttributeEditor } from './CustomAttributeEditor';
import { useTestCaseForm } from '../hooks/useTestCaseForm';
import { ArtifactOverviewFields } from './forms/ArtifactOverviewFields';
import { ArtifactRelationshipsTab } from './forms/ArtifactRelationshipsTab';
import { ArtifactDetailsSections } from './forms/ArtifactDetailsSections';
import { FormField } from './forms/FormField';

interface TestCaseModalProps {
  isOpen: boolean;
  testCase: TestCase | null;
  onClose: () => void;
  onCreate: (testCase: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => void;
  onUpdate: (id: string, updates: Partial<TestCase>) => void;
  onDelete: (id: string) => void;
  onBack?: () => void;
}

export const TestCaseModal: React.FC<TestCaseModalProps> = ({
  isOpen,
  testCase,
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
    priority,
    setPriority,
    status,
    setStatus,
    customAttributes,
    setCustomAttributes,
    showDeleteConfirm,
    handleDelete,
    confirmDelete,
    cancelDelete,
    handleSubmit,
    handleNavigateToArtifact,
    handleRemoveLink,
  } = useTestCaseForm({
    isOpen,
    testCase,
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
    artifactId: testCase?.id,
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
      { value: 'passed', label: 'Passed' },
      { value: 'failed', label: 'Failed' },
      { value: 'blocked', label: 'Blocked' },
    ],
    []
  );

  if (!isOpen) return null;

  const allTabs: { id: string; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'customFields', label: 'Custom Attributes' },
    ...(isEditMode ? [{ id: 'history', label: 'Revision History' }] : []),
  ];

  return (
    <BaseArtifactModal
      isOpen={isOpen}
      onClose={onClose}
      onBack={onBack}
      title={isEditMode ? `Edit Test Case - ${testCase?.id}` : 'New Test Case'}
      tabs={allTabs}
      activeTab={activeTab}
      onTabChange={(id) =>
        setActiveTab(id as 'overview' | 'relationships' | 'customFields' | 'history')
      }
      onSubmit={handleSubmit}
      submitLabel={isEditMode ? 'Save Changes' : 'Create Test Case'}
      formId="new-testcase-form"
      showDeleteConfirm={showDeleteConfirm}
      onDeleteConfirm={confirmDelete}
      onDeleteCancel={cancelDelete}
      deleteConfirmTitle="Move to Trash"
      deleteConfirmMessage="Are you sure you want to move this test case to the trash?"
      footerActions={
        isEditMode && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn-outline-danger"
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error)',
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
              isEditMode={isEditMode}
              author={isEditMode ? testCase?.author : currentUser?.name}
              dateCreated={testCase?.dateCreated}
              titlePlaceholder="e.g., Load Testing"
            />
            {isEditMode && testCase?.lastRun && (
              <FormField label="Last Run">
                <input
                  type="text"
                  value={formatDateTime(testCase.lastRun)}
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
              </FormField>
            )}
          </div>

          <ArtifactDetailsSections
            fields={[
              {
                label: 'Description',
                value: description,
                onChange: setDescription,
                height: 150,
              },
            ]}
          />
        </div>
      )}

      {activeTab === 'relationships' && (
        <ArtifactRelationshipsTab
          artifactId={testCase?.id || ''}
          artifactType="test case"
          isEditMode={isEditMode}
          outgoingLinks={outgoingLinks}
          incomingLinks={incomingLinks}
          loading={linksLoading}
          onAddLink={() => {
            if (testCase) {
              setLinkSourceId(testCase.id);
              setLinkSourceType('testcase');
              setIsLinkModalOpen(true);
            }
          }}
          onRemoveLink={handleRemoveLink}
          onNavigateToArtifact={handleNavigateToArtifact}
        />
      )}

      {activeTab === 'history' && testCase && (
        <RevisionHistoryTab artifactId={testCase.id} artifactType="testcases" />
      )}

      {activeTab === 'customFields' && (
        <CustomAttributeEditor
          definitions={customAttributeDefinitions}
          values={customAttributes}
          onChange={setCustomAttributes}
          artifactType="testCase"
          loading={attributesLoading}
        />
      )}
    </BaseArtifactModal>
  );
};
