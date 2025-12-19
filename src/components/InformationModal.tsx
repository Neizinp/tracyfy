import React, { useMemo } from 'react';
import { BaseArtifactModal } from './BaseArtifactModal';
import type { Information } from '../types';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI } from '../app/providers';
import { useLinkService } from '../hooks/useLinkService';
import { useCustomAttributes } from '../hooks/useCustomAttributes';
import { CustomAttributeEditor } from './CustomAttributeEditor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useInformationForm } from '../hooks/useInformationForm';
import { ArtifactOverviewFields } from './forms/ArtifactOverviewFields';
import { ArtifactRelationshipsTab } from './forms/ArtifactRelationshipsTab';
import { ArtifactDetailsSections } from './forms/ArtifactDetailsSections';
import { FormField } from './forms/FormField';

interface InformationModalProps {
  isOpen: boolean;
  information: Information | null;
  onClose: () => void;
  onSubmit: (
    data:
      | Omit<Information, 'id' | 'lastModified' | 'dateCreated'>
      | { id: string; updates: Partial<Information> }
  ) => void;
}

type Tab = 'overview' | 'relationships' | 'customFields' | 'history';

export const InformationModal: React.FC<InformationModalProps> = ({
  isOpen,
  information,
  onClose,
  onSubmit,
}) => {
  const { setIsLinkModalOpen, setLinkSourceId, setLinkSourceType } = useUI();

  // Use the extracted hook for form state and handlers
  const {
    isEditMode,
    activeTab,
    setActiveTab,
    title,
    setTitle,
    text,
    setText,
    type,
    setType,
    customAttributes,
    setCustomAttributes,
    handleSubmit,
    handleNavigateToArtifact,
    handleRemoveLink,
  } = useInformationForm({ isOpen, information, onClose, onSubmit });

  const {
    outgoingLinks,
    incomingLinks,
    loading: linksLoading,
  } = useLinkService({
    artifactId: information?.id,
  });

  const { definitions: customAttributeDefinitions, loading: attributesLoading } =
    useCustomAttributes();

  useKeyboardShortcuts({
    onSave: handleSubmit,
    onClose: onClose,
  });

  const typeOptions = useMemo(
    () => [
      { value: 'note', label: 'Note' },
      { value: 'meeting', label: 'Meeting Transcript' },
      { value: 'decision', label: 'Decision Log' },
      { value: 'reference', label: 'Reference' },
      { value: 'other', label: 'Other' },
    ],
    []
  );

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'customFields', label: 'Custom Attributes' },
    ...(isEditMode ? [{ id: 'history' as Tab, label: 'Revision History' }] : []),
  ];

  return (
    <BaseArtifactModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Information - ${information?.id}` : 'New Information'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as Tab)}
      onSubmit={handleSubmit}
      submitLabel={isEditMode ? 'Save Changes' : 'Create Information'}
    >
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}
          >
            <ArtifactOverviewFields
              title={title}
              setTitle={setTitle}
              isEditMode={isEditMode}
              dateCreated={information?.dateCreated}
              hidePriority
              hideStatus
            />
            <FormField label="Type">
              <select
                id="info-type"
                value={type}
                onChange={(e) => setType(e.target.value as Information['type'])}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <ArtifactDetailsSections
            fields={[
              {
                label: 'Content',
                value: text,
                onChange: setText,
                height: 300,
              },
            ]}
          />
        </div>
      )}

      {activeTab === 'relationships' && (
        <ArtifactRelationshipsTab
          artifactId={information?.id || ''}
          artifactType="information"
          isEditMode={isEditMode}
          outgoingLinks={outgoingLinks}
          incomingLinks={incomingLinks}
          loading={linksLoading}
          onAddLink={() => {
            if (information) {
              setLinkSourceId(information.id);
              setLinkSourceType('information');
              setIsLinkModalOpen(true);
            }
          }}
          onRemoveLink={handleRemoveLink}
          onNavigateToArtifact={handleNavigateToArtifact}
        />
      )}

      {activeTab === 'history' && information && (
        <RevisionHistoryTab artifactId={information.id} artifactType="information" />
      )}

      {activeTab === 'customFields' && (
        <CustomAttributeEditor
          definitions={customAttributeDefinitions}
          values={customAttributes}
          onChange={setCustomAttributes}
          artifactType="information"
          loading={attributesLoading}
        />
      )}
    </BaseArtifactModal>
  );
};
