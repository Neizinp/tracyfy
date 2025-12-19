/**
 * RiskModal Component
 *
 * Modal for creating and editing risks.
 * Uses useRiskForm hook for form state and handlers.
 */

import React from 'react';
import { BaseArtifactModal } from './BaseArtifactModal';
import type { Risk } from '../types';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI } from '../app/providers';
import { useLinkService } from '../hooks/useLinkService';
import { useCustomAttributes } from '../hooks/useCustomAttributes';
import { CustomAttributeEditor } from './CustomAttributeEditor';
import { LINK_TYPE_LABELS } from '../utils/linkTypes';
import { MarkdownEditor } from './MarkdownEditor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useRiskForm } from '../hooks/useRiskForm';

interface RiskModalProps {
  isOpen: boolean;
  risk: Risk | null;
  onClose: () => void;
  onSubmit: (
    data: Omit<Risk, 'id' | 'lastModified' | 'dateCreated'> | { id: string; updates: Partial<Risk> }
  ) => void;
}

type Tab = 'overview' | 'mitigation' | 'relationships' | 'customFields' | 'history';

export const RiskModal: React.FC<RiskModalProps> = ({ isOpen, risk, onClose, onSubmit }) => {
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
    handleSubmit,
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

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'mitigation', label: 'Mitigation' },
    ...(risk ? [{ id: 'relationships' as Tab, label: 'Relationships' }] : []),
    { id: 'customFields', label: 'Custom Attributes' },
    ...(risk ? [{ id: 'history' as Tab, label: 'Revision History' }] : []),
  ];

  return (
    <BaseArtifactModal
      isOpen={isOpen}
      onClose={onClose}
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
    >
      {activeTab === 'overview' && (
        <>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              htmlFor="risk-title"
              style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}
            >
              Title
            </label>
            <input
              id="risk-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <MarkdownEditor
              label="Description"
              value={description}
              onChange={setDescription}
              height={120}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <div>
              <label
                style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}
              >
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Risk['category'])}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="technical">Technical</option>
                <option value="schedule">Schedule</option>
                <option value="resource">Resource</option>
                <option value="external">External</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}
              >
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Risk['status'])}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="identified">Identified</option>
                <option value="analyzing">Analyzing</option>
                <option value="mitigating">Mitigating</option>
                <option value="resolved">Resolved</option>
                <option value="accepted">Accepted</option>
              </select>
            </div>

            <div>
              <label
                style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}
              >
                Probability
              </label>
              <select
                value={probability}
                onChange={(e) => setProbability(e.target.value as Risk['probability'])}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label
                style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}
              >
                Impact
              </label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as Risk['impact'])}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              htmlFor="risk-owner"
              style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}
            >
              Owner (optional)
            </label>
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
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </>
      )}

      {activeTab === 'mitigation' && (
        <>
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <MarkdownEditor
              label="Mitigation Strategy"
              value={mitigation}
              onChange={setMitigation}
              height={180}
            />
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                marginTop: '4px',
              }}
            >
              Actions to reduce the probability or impact of this risk
            </p>
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <MarkdownEditor
              label="Contingency Plan"
              value={contingency}
              onChange={setContingency}
              height={180}
            />
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                marginTop: '4px',
              }}
            >
              Actions to take if the risk occurs
            </p>
          </div>
        </>
      )}

      {activeTab === 'relationships' && risk && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Linked Items
            </label>
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
              {linksLoading ? (
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
                  No links found.
                  <button
                    type="button"
                    onClick={() => {
                      setLinkSourceId(risk.id);
                      setLinkSourceType('risk');
                      setIsLinkModalOpen(true);
                    }}
                    style={{
                      display: 'block',
                      marginTop: '8px',
                      color: 'var(--color-accent)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    + Create Link
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkSourceId(risk.id);
                        setLinkSourceType('risk');
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
                  </div>
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
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: 'var(--font-size-sm)',
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
                        <span style={{ fontWeight: 500 }}>{link.targetId}</span>
                      </div>
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
                  No incoming links. Other artifacts can link to this risk.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {incomingLinks.map((link, index) => (
                    <div
                      key={`${link.sourceId}-${index}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '6px 8px',
                        backgroundColor: 'var(--color-bg-card)',
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        fontSize: 'var(--font-size-sm)',
                        gap: '8px',
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

      {activeTab === 'history' && risk && (
        <RevisionHistoryTab artifactId={risk.id} artifactType="risks" />
      )}

      {activeTab === 'customFields' && (
        <div>
          <CustomAttributeEditor
            definitions={customAttributeDefinitions}
            values={customAttributes}
            onChange={setCustomAttributes}
            artifactType="risk"
            loading={attributesLoading}
          />
        </div>
      )}
    </BaseArtifactModal>
  );
};
