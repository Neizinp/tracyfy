/**
 * TestCaseModal Component
 *
 * Modal for creating and editing test cases.
 * Uses useTestCaseForm hook for form state and handlers.
 */

import React from 'react';
import { BaseArtifactModal } from './BaseArtifactModal';
import type { TestCase } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI } from '../app/providers';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useLinkService } from '../hooks/useLinkService';
import { useCustomAttributes } from '../hooks/useCustomAttributes';
import { CustomAttributeEditor } from './CustomAttributeEditor';
import { LINK_TYPE_LABELS } from '../utils/linkTypes';
import { MarkdownEditor } from './MarkdownEditor';
import { useTestCaseForm } from '../hooks/useTestCaseForm';

interface TestCaseModalProps {
  isOpen: boolean;
  testCase: TestCase | null;
  onClose: () => void;
  onCreate: (testCase: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => void;
  onUpdate: (id: string, updates: Partial<TestCase>) => void;
  onDelete: (id: string) => void;
}

export const TestCaseModal: React.FC<TestCaseModalProps> = ({
  isOpen,
  testCase,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
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
      title={isEditMode ? `Edit Test Case - ${testCase?.id}` : 'New Test Case'}
      tabs={allTabs}
      activeTab={activeTab}
      onTabChange={(id) =>
        setActiveTab(id as 'overview' | 'relationships' | 'customFields' | 'history')
      }
      onSubmit={handleSubmit}
      submitLabel={isEditMode ? 'Save Changes' : 'Create Test Case'}
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
            <MarkdownEditor
              label="Description"
              value={description}
              onChange={setDescription}
              height={150}
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

          {isEditMode && showDeleteConfirm && (
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
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
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

      {activeTab === 'customFields' && (
        <div>
          <CustomAttributeEditor
            definitions={customAttributeDefinitions}
            values={customAttributes}
            onChange={setCustomAttributes}
            artifactType="testCase"
            loading={attributesLoading}
          />
        </div>
      )}
    </BaseArtifactModal>
  );
};
