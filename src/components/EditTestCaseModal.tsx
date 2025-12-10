import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { TestCase, Requirement } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI } from '../app/providers';

interface EditTestCaseModalProps {
  isOpen: boolean;
  testCase: TestCase | null;
  requirements: Requirement[];
  onClose: () => void;
  onSubmit: (id: string, updates: Partial<TestCase>) => void;
  onDelete: (id: string) => void;
}

type Tab = 'overview' | 'relationships' | 'history';

export const EditTestCaseModal: React.FC<EditTestCaseModalProps> = ({
  isOpen,
  testCase,
  requirements,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const { setIsLinkModalOpen, setLinkSourceId, setLinkSourceType } = useUI();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TestCase['priority']>('medium');
  const [status, setStatus] = useState<TestCase['status']>('draft');
  const [requirementIds, setRequirementIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (testCase) {
      setTitle(testCase.title);
      setDescription(testCase.description);
      setPriority(testCase.priority);
      setStatus(testCase.status);
      setRequirementIds(testCase.requirementIds || []);
    }
  }, [testCase]);

  if (!isOpen || !testCase) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<TestCase> = {
      title,
      description,
      priority,
      status,
      requirementIds,
      lastModified: Date.now(),
    };

    // Update lastRun when status changes to passed/failed
    if ((status === 'passed' || status === 'failed') && testCase.status !== status) {
      updates.lastRun = Date.now();
    }

    onSubmit(testCase.id, updates);
    onClose();
  };

  const handleRequirementToggle = (reqId: string) => {
    setRequirementIds((prev) =>
      prev.includes(reqId) ? prev.filter((id) => id !== reqId) : [...prev, reqId]
    );
  };

  const confirmDelete = () => {
    onDelete(testCase.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const activeRequirements = requirements.filter((r) => !r.isDeleted);

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
        // no blur
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
          <h3 style={{ fontWeight: 600 }}>Edit Test Case - {testCase.id}</h3>
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
                activeTab === 'history' ? '2px solid var(--color-accent)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            Revision History
          </button>
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
                  htmlFor="edit-test-case-title"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Title
                </label>
                <input
                  id="edit-test-case-title"
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
                  htmlFor="edit-test-case-description"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Description
                </label>
                <textarea
                  id="edit-test-case-description"
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
                  htmlFor="edit-test-case-priority"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Priority
                </label>
                <select
                  id="edit-test-case-priority"
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

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label
                  htmlFor="edit-test-case-status"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Status
                </label>
                <select
                  id="edit-test-case-status"
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
                  htmlFor="edit-test-case-author"
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
                  {testCase.author || 'Not specified'}
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
                  value={formatDateTime(testCase.dateCreated)}
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

              {testCase.lastRun && (
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

              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Linked Requirements ({requirementIds.length} selected)
                </label>
                <div
                  style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: '8px',
                    backgroundColor: 'var(--color-bg-app)',
                  }}
                >
                  {activeRequirements.length === 0 ? (
                    <div
                      style={{
                        padding: '8px',
                        color: 'var(--color-text-muted)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      No requirements available
                    </div>
                  ) : (
                    activeRequirements.map((req) => (
                      <label
                        key={req.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          marginBottom: '2px',
                          transition: 'background-color 0.1s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = 'var(--color-bg-card)')
                        }
                      >
                        <input
                          type="checkbox"
                          checked={requirementIds.includes(req.id)}
                          onChange={() => handleRequirementToggle(req.id)}
                          style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-accent-light)',
                            marginRight: '8px',
                          }}
                        >
                          {req.id}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-sm)' }}>{req.title}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {showDeleteConfirm ? (
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
                  justifyContent: 'space-between',
                  gap: 'var(--spacing-sm)',
                }}
              >
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
                    Save Changes
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
                  {(testCase.linkedArtifacts || []).length === 0 ? (
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
                          setLinkSourceId(testCase.id);
                          setLinkSourceType('testcase');
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
                            setLinkSourceId(testCase.id);
                            setLinkSourceType('testcase');
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
                      {(testCase.linkedArtifacts || []).map((link, index) => (
                        <div
                          key={`${link.targetId}-${index}`}
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
                              {link.type.replace('_', ' ')}
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
