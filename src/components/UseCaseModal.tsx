import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { UseCase } from '../types';
import type { CustomAttributeValue } from '../types/customAttributes';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI } from '../app/providers';
import { useLinkService } from '../hooks/useLinkService';
import { useCustomAttributes } from '../hooks/useCustomAttributes';
import { CustomAttributeEditor } from './CustomAttributeEditor';
import { LINK_TYPE_LABELS } from '../utils/linkTypes';
import { MarkdownEditor } from './MarkdownEditor';

interface UseCaseModalProps {
  isOpen: boolean;
  useCase?: UseCase | null;
  onClose: () => void;
  onSubmit: (
    useCase: Omit<UseCase, 'id' | 'lastModified'> | { id: string; updates: Partial<UseCase> }
  ) => void;
}

type Tab = 'overview' | 'flows' | 'conditions' | 'relationships' | 'customFields' | 'history';

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export const UseCaseModal: React.FC<UseCaseModalProps> = ({
  isOpen,
  useCase,
  onClose,
  onSubmit,
}) => {
  const { setIsLinkModalOpen, setLinkSourceId, setLinkSourceType } = useUI();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actor, setActor] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [postconditions, setPostconditions] = useState('');
  const [mainFlow, setMainFlow] = useState('');
  const [alternativeFlows, setAlternativeFlows] = useState('');
  const [priority, setPriority] = useState<UseCase['priority']>('medium');
  const [status, setStatus] = useState<UseCase['status']>('draft');

  // Get links using the new link service
  const {
    outgoingLinks,
    incomingLinks,
    loading: linksLoading,
  } = useLinkService({
    artifactId: useCase?.id,
  });

  // Get custom attribute definitions
  const { definitions: customAttributeDefinitions } = useCustomAttributes();
  const [customAttributes, setCustomAttributes] = useState<CustomAttributeValue[]>([]);

  useEffect(() => {
    if (useCase) {
      setTitle(useCase.title);
      setDescription(useCase.description);
      setActor(useCase.actor);
      setPreconditions(useCase.preconditions);
      setPostconditions(useCase.postconditions);
      setMainFlow(useCase.mainFlow);
      setAlternativeFlows(useCase.alternativeFlows || '');
      setPriority(useCase.priority);
      setStatus(useCase.status);
      setCustomAttributes(useCase.customAttributes || []);
    } else {
      // Reset form for new use case
      setTitle('');
      setDescription('');
      setActor('');
      setPreconditions('');
      setPostconditions('');
      setMainFlow('');
      setAlternativeFlows('');
      setPriority('medium');
      setStatus('draft');
      setCustomAttributes([]);
    }
  }, [useCase, isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (useCase) {
      onSubmit({
        id: useCase.id,
        updates: {
          title,
          description,
          actor,
          preconditions,
          postconditions,
          mainFlow,
          alternativeFlows,
          priority,
          status,
          customAttributes,
        },
      });
    } else {
      onSubmit({
        title,
        description,
        actor,
        preconditions,
        postconditions,
        mainFlow,
        alternativeFlows,
        priority,
        status,
        customAttributes,
        revision: '01',
      });
    }
    onClose();
  };

  useKeyboardShortcuts({
    onSave: handleSubmit,
    onClose: onClose,
  });

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'flows', label: 'Flows' },
    { id: 'conditions', label: 'Conditions' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'customFields', label: 'Custom Fields' },
    { id: 'history', label: 'Revision History' },
  ].filter((tab) => {
    // Only show relationships and history for existing use cases
    if (tab.id === 'relationships' || tab.id === 'history') {
      return useCase !== null && useCase !== undefined;
    }
    return true;
  }) as { id: Tab; label: string }[];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-bg-overlay, #222)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#222',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          width: '800px',
          maxWidth: '95%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-bg-card)',
          }}
        >
          <h3 style={{ fontWeight: 600 }}>
            {useCase ? `Edit Use Case - ${useCase.id}` : 'New Use Case'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'var(--color-bg-card)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 600 : 400,
                borderBottom:
                  activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <form
          id="use-case-form"
          onSubmit={handleSubmit}
          style={{
            padding: 'var(--spacing-lg)',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          {activeTab === 'overview' && (
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}
            >
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
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
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
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
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
                      <div
                        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}
                      >
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
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--spacing-sm)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="use-case-form"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {useCase ? 'Save Changes' : 'Create Use Case'}
          </button>
        </div>
      </div>
    </div>
  );
};
