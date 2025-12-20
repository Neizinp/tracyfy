import React, { useMemo } from 'react';
import { BaseArtifactModal } from './BaseArtifactModal';
import type { ArtifactDocument } from '../types';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useDocumentForm } from '../hooks/useDocumentForm';
import { ArtifactOverviewFields } from './forms/ArtifactOverviewFields';
import { ArtifactDetailsSections } from './forms/ArtifactDetailsSections';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { DocumentEditor } from './DocumentEditor';

interface DocumentModalProps {
  isOpen: boolean;
  document: ArtifactDocument | null;
  onClose: () => void;
  onSubmit: (
    data:
      | Omit<ArtifactDocument, 'id' | 'lastModified' | 'revision'>
      | { id: string; updates: Partial<ArtifactDocument> }
  ) => void;
  onDelete?: (id: string) => void;
  onExport?: (doc: ArtifactDocument) => void;
  onBack?: () => void;
}

type Tab = 'overview' | 'content' | 'history';

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  document,
  onClose,
  onSubmit,
  onDelete: _onDelete,
  onExport,
  onBack,
}) => {
  const {
    isEditMode,
    activeTab,
    setActiveTab,
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    showDeleteConfirm,
    handleDelete,
    confirmDelete,
    cancelDelete,
    structure,
    setStructure,
    handleSubmit,
  } = useDocumentForm({ isOpen, document: document, onClose, onSubmit });

  useKeyboardShortcuts({
    onSave: handleSubmit,
    onClose: onClose,
  });

  const statusOptions = useMemo(
    () => [
      { value: 'draft', label: 'Draft' },
      { value: 'review', label: 'In Review' },
      { value: 'approved', label: 'Approved' },
      { value: 'obsolete', label: 'Obsolete' },
    ],
    []
  );

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'content', label: 'Content' },
    ...(isEditMode ? [{ id: 'history' as Tab, label: 'Revision History' }] : []),
  ];

  return (
    <BaseArtifactModal
      isOpen={isOpen}
      onClose={onClose}
      onBack={onBack}
      title={isEditMode ? `Edit Document - ${document?.id}` : 'New Document'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as Tab)}
      onSubmit={handleSubmit}
      submitLabel={isEditMode ? 'Save Changes' : 'Create Document'}
      formId="new-document-form"
      showDeleteConfirm={showDeleteConfirm}
      onDeleteConfirm={confirmDelete}
      onDeleteCancel={cancelDelete}
      deleteConfirmTitle="Move to Trash"
      deleteConfirmMessage="Are you sure you want to move this document to the trash?"
      footerActions={
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          {isEditMode && onExport && document && (
            <button
              type="button"
              onClick={() => onExport(document)}
              className="btn-outline-primary"
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-primary)',
                color: 'var(--color-primary)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Export to PDF
            </button>
          )}
          {isEditMode && (
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
          )}
        </div>
      }
    >
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <ArtifactOverviewFields
            title={title}
            setTitle={setTitle}
            status={status}
            setStatus={setStatus}
            statusOptions={statusOptions}
            isEditMode={isEditMode}
            dateCreated={document?.dateCreated}
          />

          <ArtifactDetailsSections
            fields={[
              {
                label: 'Description',
                value: description,
                onChange: setDescription,
                height: 120,
              },
            ]}
          />
        </div>
      )}

      {activeTab === 'content' && <DocumentEditor structure={structure} onChange={setStructure} />}

      {activeTab === 'history' && document && (
        <RevisionHistoryTab artifactId={document.id} artifactType="documents" />
      )}
    </BaseArtifactModal>
  );
};
