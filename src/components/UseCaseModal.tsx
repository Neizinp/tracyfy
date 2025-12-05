import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { UseCase } from '../types';
import { RevisionHistoryTab } from './RevisionHistoryTab';

interface UseCaseModalProps {
  isOpen: boolean;
  useCase?: UseCase | null;
  onClose: () => void;
  onSubmit: (
    useCase: Omit<UseCase, 'id' | 'lastModified'> | { id: string; updates: Partial<UseCase> }
  ) => void;
}

type Tab = 'overview' | 'flows' | 'conditions' | 'history';

export const UseCaseModal: React.FC<UseCaseModalProps> = ({
  isOpen,
  useCase,
  onClose,
  onSubmit,
}) => {
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
    }
  }, [useCase, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
        revision: '01',
      });
    }
    onClose();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'flows', label: 'Flows' },
    { id: 'conditions', label: 'Conditions' },
    { id: 'history', label: 'Revision History' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
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
                    fontSize: '0.875rem',
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
                    fontSize: '0.875rem',
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
                    fontSize: '0.875rem',
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
                    fontSize: '0.875rem',
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
                <label
                  htmlFor="use-case-description"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: '0.875rem',
                  }}
                >
                  Description
                </label>
                <textarea
                  id="use-case-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Brief description of the use case"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'flows' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label
                  htmlFor="use-case-main-flow"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: '0.875rem',
                  }}
                >
                  Main Flow *
                </label>
                <textarea
                  id="use-case-main-flow"
                  value={mainFlow}
                  onChange={(e) => setMainFlow(e.target.value)}
                  required
                  rows={10}
                  placeholder="1. User enters credentials&#10;2. System validates credentials&#10;3. System grants access"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="use-case-alternative-flows"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: '0.875rem',
                  }}
                >
                  Alternative Flows
                </label>
                <textarea
                  id="use-case-alternative-flows"
                  value={alternativeFlows}
                  onChange={(e) => setAlternativeFlows(e.target.value)}
                  rows={8}
                  placeholder="Alternative paths or error scenarios"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'conditions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label
                  htmlFor="use-case-preconditions"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: '0.875rem',
                  }}
                >
                  Preconditions
                </label>
                <textarea
                  id="use-case-preconditions"
                  value={preconditions}
                  onChange={(e) => setPreconditions(e.target.value)}
                  rows={8}
                  placeholder="What must be true before this use case can start"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="use-case-postconditions"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: '0.875rem',
                  }}
                >
                  Postconditions
                </label>
                <textarea
                  id="use-case-postconditions"
                  value={postconditions}
                  onChange={(e) => setPostconditions(e.target.value)}
                  rows={8}
                  placeholder="What must be true after this use case completes"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'history' && useCase && (
            <RevisionHistoryTab artifactId={useCase.id} artifactType="usecases" />
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
              backgroundColor: 'transparent',
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
