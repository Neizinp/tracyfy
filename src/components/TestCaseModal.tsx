import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { TestCase } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI, useUser } from '../app/providers';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useLinkService } from '../hooks/useLinkService';
import { LINK_TYPE_LABELS } from '../utils/linkTypes';

interface TestCaseModalProps {
  isOpen: boolean;
  testCase: TestCase | null; // null = create mode, TestCase = edit mode
  onClose: () => void;
  onCreate: (testCase: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => void;
  onUpdate: (id: string, updates: Partial<TestCase>) => void;
  onDelete: (id: string) => void;
}

type Tab = 'overview' | 'relationships' | 'history';

export const TestCaseModal: React.FC<TestCaseModalProps> = ({
  isOpen,
  testCase,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const { setIsLinkModalOpen, setLinkSourceId, setLinkSourceType } = useUI();
  const { currentUser } = useUser();
  const isEditMode = testCase !== null;

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TestCase['priority']>('medium');
  const [status, setStatus] = useState<TestCase['status']>('draft');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get links using the new link service
  const {
    outgoingLinks,
    incomingLinks,
    loading: linksLoading,
  } = useLinkService({
    artifactId: testCase?.id,
  });

  // Reset form when modal opens/closes or testCase changes
  useEffect(() => {
    if (isOpen) {
      if (testCase) {
        // Edit mode: populate from testCase
        setTitle(testCase.title);
        setDescription(testCase.description);
        setPriority(testCase.priority);
        setStatus(testCase.status);
      } else {
        // Create mode: reset to defaults
        setTitle('');
        setDescription('');
        setPriority('medium');
        setStatus('draft');
      }
      setActiveTab('overview');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, testCase]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isEditMode && testCase) {
      // Update existing
      const updates: Partial<TestCase> = {
        title,
        description,
        priority,
        status,
        lastModified: Date.now(),
      };

      // Update lastRun when status changes to passed/failed
      if ((status === 'passed' || status === 'failed') && testCase.status !== status) {
        updates.lastRun = Date.now();
      }

      onUpdate(testCase.id, updates);
    } else {
      // Create new
      onCreate({
        title,
        description,
        priority,
        author: currentUser?.name || undefined,
        requirementIds: [],
        status: 'draft',
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

  const confirmDelete = () => {
    if (testCase) {
      onDelete(testCase.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const modalTitle = isEditMode ? `Edit Test Case - ${testCase?.id}` : 'New Test Case';
  const submitLabel = isEditMode ? 'Save Changes' : 'Create Test Case';

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
          width: '500px',
          maxWidth: '90%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--color-bg-card)',
            zIndex: 1,
          }}
        >
          <h3 style={{ fontWeight: 600 }}>{modalTitle}</h3>
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
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'overview' ? 'var(--color-bg-card)' : 'transparent',
              color:
                activeTab === 'overview' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'overview' ? 600 : 400,
              borderBottom:
                activeTab === 'overview'
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('relationships')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor:
                activeTab === 'relationships' ? 'var(--color-bg-card)' : 'transparent',
              color:
                activeTab === 'relationships'
                  ? 'var(--color-accent)'
                  : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'relationships' ? 600 : 400,
              borderBottom:
                activeTab === 'relationships'
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            Relationships
          </button>
          {isEditMode && (
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: activeTab === 'history' ? 'var(--color-bg-card)' : 'transparent',
                color:
                  activeTab === 'history' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontWeight: activeTab === 'history' ? 600 : 400,
                borderBottom:
                  activeTab === 'history'
                    ? '2px solid var(--color-accent)'
                    : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              Revision History
            </button>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: 'var(--spacing-lg)',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          {activeTab === 'overview' && (
            <>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label
                  htmlFor="test-case-title"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Title
                </label>
                <input
                  id="test-case-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
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

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label
                  htmlFor="test-case-description"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Description
                </label>
                <textarea
                  id="test-case-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
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

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label
                  htmlFor="test-case-priority"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Priority
                </label>
                <select
                  id="test-case-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TestCase['priority'])}
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

              {isEditMode && (
                <>
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <label
                      htmlFor="test-case-status"
                      style={{
                        display: 'block',
                        marginBottom: 'var(--spacing-xs)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      Status
                    </label>
                    <select
                      id="test-case-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TestCase['status'])}
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
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: 'var(--spacing-xs)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      Author
                    </label>
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {testCase?.author || 'Not specified'}
                    </div>
                  </div>

                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: 'var(--spacing-xs)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      Date Created
                    </label>
                    <input
                      type="text"
                      value={testCase ? formatDateTime(testCase.dateCreated) : ''}
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
                  </div>

                  {testCase?.lastRun && (
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: 'var(--spacing-xs)',
                          fontSize: 'var(--font-size-sm)',
                        }}
                      >
                        Last Run
                      </label>
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
                    </div>
                  )}
                </>
              )}

              {!isEditMode && (
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 'var(--spacing-xs)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    Author
                  </label>
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: currentUser ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    {currentUser?.name || 'No user selected'}
                  </div>
                </div>
              )}

              {isEditMode && showDeleteConfirm ? (
                <div
                  style={{
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'var(--color-error-bg)',
                    border: '1px solid var(--color-error-light)',
                    borderRadius: '6px',
                    marginBottom: 'var(--spacing-md)',
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
                    Are you sure you want to move this test case to the trash?
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
                      onClick={() => setShowDeleteConfirm(false)}
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
              ) : null}

              <div
                style={{
                  display: 'flex',
                  justifyContent: isEditMode ? 'space-between' : 'flex-end',
                  gap: 'var(--spacing-sm)',
                }}
              >
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={showDeleteConfirm}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-error)',
                      backgroundColor: 'var(--color-bg-card)',
                      color: 'var(--color-error)',
                      cursor: showDeleteConfirm ? 'not-allowed' : 'pointer',
                      fontWeight: 500,
                      opacity: showDeleteConfirm ? 0.5 : 1,
                    }}
                  >
                    Delete
                  </button>
                )}
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
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
                    {submitLabel}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'relationships' && (
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
                  {!isEditMode ? (
                    <div
                      style={{
                        padding: '16px',
                        color: 'var(--color-text-muted)',
                        fontSize: 'var(--font-size-sm)',
                        textAlign: 'center',
                      }}
                    >
                      Save the test case first to add relationships.
                    </div>
                  ) : linksLoading ? (
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
                          if (testCase) {
                            setLinkSourceId(testCase.id);
                            setLinkSourceType('testcase');
                            setIsLinkModalOpen(true);
                          }
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
                            if (testCase) {
                              setLinkSourceId(testCase.id);
                              setLinkSourceType('testcase');
                              setIsLinkModalOpen(true);
                            }
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
                      No incoming links. Other artifacts can link to this test case.
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

          {activeTab === 'history' && testCase && (
            <RevisionHistoryTab artifactId={testCase.id} artifactType="testcases" />
          )}
        </form>
      </div>
    </div>
  );
};
