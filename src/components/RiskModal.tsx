import React, { useMemo } from 'react';
import { BaseArtifactModal } from './BaseArtifactModal';
import type { Risk } from '../types';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI } from '../app/providers';
import { useLinkService } from '../hooks/useLinkService';
import { useCustomAttributes } from '../hooks/useCustomAttributes';
import { CustomAttributeEditor } from './CustomAttributeEditor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useRiskForm } from '../hooks/useRiskForm';
import { ArtifactOverviewFields } from './forms/ArtifactOverviewFields';
import { ArtifactRelationshipsTab } from './forms/ArtifactRelationshipsTab';
import { ArtifactDetailsSections } from './forms/ArtifactDetailsSections';
import { FormField } from './forms/FormField';

interface RiskModalProps {
  isOpen: boolean;
  risk: Risk | null;
  onClose: () => void;
  onSubmit: (
    data: Omit<Risk, 'id' | 'lastModified' | 'dateCreated'> | { id: string; updates: Partial<Risk> }
  ) => void;
  onBack?: () => void;
}

type Tab = 'overview' | 'mitigation' | 'relationships' | 'customFields' | 'history';

export const RiskModal: React.FC<RiskModalProps> = ({
  isOpen,
  risk,
  onClose,
  onSubmit,
  onBack,
}) => {
  const { setIsLinkModalOpen, setLinkSourceId, setLinkSourceType } = useUI();

  // Use the extracted hook for form state and handlers
  const {
    isEditMode,
    activeTab,
    setActiveTab,
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    probability,
    setProbability,
    impact,
    setImpact,
    status,
    setStatus,
    owner,
    setOwner,
    mitigation,
    setMitigation,
    contingency,
    setContingency,
    customAttributes,
    setCustomAttributes,
    riskLevel,
    riskColor,
    showDeleteConfirm,
    handleDelete,
    confirmDelete,
    cancelDelete,
    handleSubmit,
    handleNavigateToArtifact,
    handleRemoveLink,
  } = useRiskForm({ isOpen, risk, onClose, onSubmit });

  const {
    outgoingLinks,
    incomingLinks,
    loading: linksLoading,
  } = useLinkService({
    artifactId: risk?.id,
  });

  const { definitions: customAttributeDefinitions, loading: attributesLoading } =
    useCustomAttributes();

  useKeyboardShortcuts({
    onSave: handleSubmit,
    onClose: onClose,
  });

  const categoryOptions = useMemo(
    () => [
      { value: 'technical', label: 'Technical' },
      { value: 'schedule', label: 'Schedule' },
      { value: 'resource', label: 'Resource' },
      { value: 'external', label: 'External' },
      { value: 'other', label: 'Other' },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: 'identified', label: 'Identified' },
      { value: 'analyzing', label: 'Analyzing' },
      { value: 'mitigating', label: 'Mitigating' },
      { value: 'resolved', label: 'Resolved' },
      { value: 'accepted', label: 'Accepted' },
    ],
    []
  );

  const probabilityOptions = useMemo(
    () => [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
    []
  );

  const impactOptions = useMemo(
    () => [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
    []
  );

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'mitigation', label: 'Mitigation' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'customFields', label: 'Custom Attributes' },
    ...(isEditMode ? [{ id: 'history' as Tab, label: 'Revision History' }] : []),
  ];

  return (
    <BaseArtifactModal
      isOpen={isOpen}
      onClose={onClose}
      onBack={onBack}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <span>{isEditMode ? `Edit Risk - ${risk?.id}` : 'New Risk'}</span>
          {isEditMode && (
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: riskColor,
                color: 'white',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {riskLevel} risk
            </span>
          )}
        </div>
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as Tab)}
      onSubmit={handleSubmit}
      submitLabel={isEditMode ? 'Save Changes' : 'Create Risk'}
      footerActions={
        isEditMode && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn-danger"
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
              priority={probability}
              setPriority={setProbability}
              priorityLabel="Probability"
              priorityOptions={probabilityOptions}
              status={status}
              setStatus={setStatus}
              statusOptions={statusOptions}
              isEditMode={isEditMode}
              dateCreated={risk?.dateCreated}
            />
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}
            >
              <FormField label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Risk['category'])}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Impact">
                <select
                  value={impact}
                  onChange={(e) => setImpact(e.target.value as Risk['impact'])}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {impactOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label="Owner">
              <input
                id="risk-owner"
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Person responsible for this risk"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
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
                height: 120,
              },
            ]}
          />

          {isEditMode && showDeleteConfirm && (
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
                Are you sure you want to move this risk to the trash?
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
        </div>
      )}

      {activeTab === 'mitigation' && (
        <ArtifactDetailsSections
          fields={[
            {
              label: 'Mitigation Strategy',
              value: mitigation,
              onChange: setMitigation,
              height: 180,
              placeholder: 'Actions to reduce the probability or impact of this risk',
            },
            {
              label: 'Contingency Plan',
              value: contingency,
              onChange: setContingency,
              height: 180,
              placeholder: 'Actions to take if the risk occurs',
            },
          ]}
        />
      )}

      {activeTab === 'relationships' && (
        <ArtifactRelationshipsTab
          artifactId={risk?.id || ''}
          artifactType="risk"
          isEditMode={isEditMode}
          outgoingLinks={outgoingLinks}
          incomingLinks={incomingLinks}
          loading={linksLoading}
          onAddLink={() => {
            if (risk) {
              setLinkSourceId(risk.id);
              setLinkSourceType('risk');
              setIsLinkModalOpen(true);
            }
          }}
          onRemoveLink={handleRemoveLink}
          onNavigateToArtifact={handleNavigateToArtifact}
        />
      )}

      {activeTab === 'history' && risk && (
        <RevisionHistoryTab artifactId={risk.id} artifactType="risks" />
      )}

      {activeTab === 'customFields' && (
        <CustomAttributeEditor
          definitions={customAttributeDefinitions}
          values={customAttributes}
          onChange={setCustomAttributes}
          artifactType="risk"
          loading={attributesLoading}
        />
      )}
    </BaseArtifactModal>
  );
};
