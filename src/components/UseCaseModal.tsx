/**
 * UseCaseModal Component
 *
 * Modal for creating and editing use cases.
 * Uses useUseCaseForm hook for form state and handlers.
 */

import React from 'react';
import { BaseArtifactModal } from './BaseArtifactModal';
import type { UseCase } from '../types';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI } from '../app/providers';
import { useLinkService } from '../hooks/useLinkService';
import { useCustomAttributes } from '../hooks/useCustomAttributes';
import { CustomAttributeEditor } from './CustomAttributeEditor';
import { LINK_TYPE_LABELS } from '../utils/linkTypes';
import { MarkdownEditor } from './MarkdownEditor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useUseCaseForm } from '../hooks/useUseCaseForm';

interface UseCaseModalProps {
  isOpen: boolean;
  useCase?: UseCase | null;
  onClose: () => void;
  onSubmit: (
    useCase: Omit<UseCase, 'id' | 'lastModified'> | { id: string; updates: Partial<UseCase> }
  ) => void;
}

type Tab = 'overview' | 'flows' | 'conditions' | 'relationships' | 'customFields' | 'history';

export const UseCaseModal: React.FC<UseCaseModalProps> = ({
  isOpen,
  useCase,
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
  } = useUseCaseForm({ isOpen, useCase, onClose, onSubmit });

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

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'flows', label: 'Flows' },
    { id: 'conditions', label: 'Conditions' },
    ...(isEditMode ? [{ id: 'relationships' as Tab, label: 'Relationships' }] : []),
    { id: 'customFields', label: 'Custom Attributes' },
    ...(isEditMode ? [{ id: 'history' as Tab, label: 'Revision History' }] : []),
  ];

  return (
    <BaseArtifactModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Use Case - ${useCase?.id}` : 'New Use Case'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as Tab)}
      onSubmit={handleSubmit}
      submitLabel={isEditMode ? 'Save Changes' : 'Create Use Case'}
    >
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="use-case-title"
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Title *
            </label>
            <input
              id="use-case-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder="e.g., User Login"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="use-case-actor"
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Actor *
            </label>
            <input
              id="use-case-actor"
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
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="use-case-priority"
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Priority
            </label>
            <select
              id="use-case-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as UseCase['priority'])}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text)',
                outline: 'none',
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="use-case-status"
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Status
            </label>
            <select
              id="use-case-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as UseCase['status'])}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text)',
                outline: 'none',
              }}
            >
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="implemented">Implemented</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <MarkdownEditor
              label="Description"
              value={description}
              onChange={setDescription}
              height={150}
            />
          </div>
        </div>
      )}

      {activeTab === 'flows' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <MarkdownEditor
              label="Main Flow *"
              value={mainFlow}
              onChange={setMainFlow}
              height={250}
            />
          </div>

          <div>
            <MarkdownEditor
              label="Alternative Flows"
              value={alternativeFlows}
              onChange={setAlternativeFlows}
              height={200}
            />
          </div>
        </div>
      )}

      {activeTab === 'conditions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <MarkdownEditor
              label="Preconditions"
              value={preconditions}
              onChange={setPreconditions}
              height={200}
            />
          </div>

          <div>
            <MarkdownEditor
              label="Postconditions"
              value={postconditions}
              onChange={setPostconditions}
              height={200}
            />
          </div>
        </div>
      )}

      {activeTab === 'relationships' && useCase && (
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
                backgroundColor: 'var(--color-bg-secondary)',
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
                      setLinkSourceId(useCase.id);
                      setLinkSourceType('usecase');
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
                        setLinkSourceId(useCase.id);
                        setLinkSourceType('usecase');
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
                        <span style={{ color: 'var(--color-text-muted)' }}>→</span>
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
                backgroundColor: 'var(--color-bg-secondary)',
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
                  No incoming links. Other artifacts can link to this use case.
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

      {activeTab === 'history' && useCase && (
        <RevisionHistoryTab artifactId={useCase.id} artifactType="usecases" />
      )}

      {activeTab === 'customFields' && (
        <div>
          <CustomAttributeEditor
            definitions={customAttributeDefinitions}
            values={customAttributes}
            onChange={setCustomAttributes}
            artifactType="useCase"
            loading={attributesLoading}
          />
        </div>
      )}
    </BaseArtifactModal>
  );
};
