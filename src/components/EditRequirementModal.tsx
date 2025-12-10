import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Requirement } from '../types';
import { MarkdownEditor } from './MarkdownEditor';
import { formatDateTime } from '../utils/dateUtils';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI } from '../app/providers';

interface EditRequirementModalProps {
  isOpen: boolean;
  requirement: Requirement | null;
  allRequirements: Requirement[];
  onClose: () => void;
  onSubmit: (id: string, updates: Partial<Requirement>) => void;
  onDelete: (id: string) => void;
}

type Tab = 'overview' | 'details' | 'relationships' | 'comments' | 'history';

export const EditRequirementModal: React.FC<EditRequirementModalProps> = ({
  isOpen,
  requirement,
  allRequirements,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const { setIsLinkModalOpen, setLinkSourceId, setLinkSourceType } = useUI();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [text, setText] = useState('');
  const [rationale, setRationale] = useState('');
  const [priority, setPriority] = useState<Requirement['priority']>('medium');
  const [status, setStatus] = useState<Requirement['status']>('draft');
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [verificationMethod, setVerificationMethod] = useState('');
  const [comments, setComments] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (requirement) {
      setTitle(requirement.title);
      setDescription(requirement.description);
      setText(requirement.text);
      setRationale(requirement.rationale);
      setPriority(requirement.priority);
      setStatus(requirement.status);
      setParentIds(requirement.parentIds || []);
      setVerificationMethod(requirement.verificationMethod || '');
      setComments(requirement.comments || '');
    }
  }, [requirement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirement) return;

    onSubmit(requirement.id, {
      title,
      description,
      text,
      rationale,
      priority,
      status,
      parentIds,
      verificationMethod,
      comments,
    });
    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (requirement) {
      onDelete(requirement.id);
      onClose();
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleParentToggle = (parentId: string) => {
    setParentIds((prev) =>
      prev.includes(parentId) ? prev.filter((id) => id !== parentId) : [...prev, parentId]
    );
  };

  const canBeParent = (potentialParentId: string): boolean => {
    if (!requirement) return true;

    const getAllDescendants = (reqId: string): Set<string> => {
      const descendants = new Set<string>();
      const queue = [reqId];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        allRequirements
          .filter((r) => r.parentIds?.includes(currentId))
          .forEach((child) => {
            if (!descendants.has(child.id)) {
              descendants.add(child.id);
              queue.push(child.id);
            }
          });
      }

      return descendants;
    };

    const descendants = getAllDescendants(requirement.id);
    return !descendants.has(potentialParentId);
  };

  const availableParents = allRequirements.filter(
    (req) => req.id !== requirement?.id && !req.isDeleted
  );

  if (!isOpen || !requirement) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'comments', label: 'Comments' },
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
        backgroundColor: 'var(--color-bg-overlay, #222)',
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
          <h3 style={{ fontWeight: 600 }}>Edit Requirement - {requirement.id}</h3>
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
          id="edit-requirement-form"
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
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Title *
                </label>
                <input
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

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Requirement['priority'])}
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

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Requirement['status'])}
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

              <div>
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
                  {requirement.author || 'Not specified'}
                </div>
              </div>

              <div>
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
                  value={formatDateTime(requirement.dateCreated)}
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

              <div style={{ gridColumn: '1 / -1' }}>
                <MarkdownEditor
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  height={200}
                  placeholder="Enter description with Markdown formatting..."
                />
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <MarkdownEditor
                  label="Requirement Text"
                  value={text}
                  onChange={setText}
                  height={180}
                  placeholder="Enter detailed requirement text with Markdown..."
                />
              </div>

              <div>
                <MarkdownEditor
                  label="Rationale"
                  value={rationale}
                  onChange={setRationale}
                  height={180}
                  placeholder="Explain the rationale with Markdown..."
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Verification Method
                </label>
                <input
                  type="text"
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value)}
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
            </div>
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
                  Parent Requirements ({parentIds.length} selected)
                </label>
                <div
                  style={{
                    maxHeight: '250px',
                    overflowY: 'auto',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: '8px',
                    backgroundColor: 'var(--color-bg-app)',
                  }}
                >
                  {availableParents.length === 0 ? (
                    <div
                      style={{
                        padding: '8px',
                        color: 'var(--color-text-muted)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      No other requirements available
                    </div>
                  ) : (
                    availableParents.map((req) => {
                      const isDescendant = !canBeParent(req.id);
                      const isDisabled = isDescendant;

                      return (
                        <label
                          key={req.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 8px',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            borderRadius: '4px',
                            marginBottom: '2px',
                            transition: 'background-color 0.1s',
                            opacity: isDisabled ? 0.5 : 1,
                          }}
                          onMouseEnter={(e) =>
                            !isDisabled &&
                            (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = 'var(--color-bg-card)')
                          }
                          title={
                            isDisabled
                              ? `Cannot select: ${req.id} is a descendant of this requirement (would create circular dependency)`
                              : ''
                          }
                        >
                          <input
                            type="checkbox"
                            checked={parentIds.includes(req.id)}
                            onChange={() => handleParentToggle(req.id)}
                            disabled={isDisabled}
                            style={{
                              marginRight: '8px',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                            }}
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
                          {isDescendant && (
                            <span
                              style={{
                                marginLeft: 'auto',
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--color-text-muted)',
                              }}
                            >
                              (descendant)
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

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
                  {(requirement.linkedArtifacts || []).length === 0 ? (
                    <div
                      style={{
                        padding: '8px',
                        color: 'var(--color-text-muted)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      No linked items.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div
                        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setLinkSourceId(requirement.id);
                            setLinkSourceType('requirement');
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
                      {(requirement.linkedArtifacts || []).map((link, index) => (
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

          {activeTab === 'comments' && (
            <div>
              <MarkdownEditor
                label="Comments"
                value={comments}
                onChange={setComments}
                height={400}
                placeholder="Add comments with Markdown..."
              />
            </div>
          )}

          {showDeleteConfirm && (
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
                Are you sure you want to move this requirement to the trash? You can restore it
                later from the Trash Bin.
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
          {activeTab === 'history' && requirement && (
            <RevisionHistoryTab artifactId={requirement.id} artifactType="requirements" />
          )}
        </form>

        {/* Footer */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 'var(--spacing-sm)',
          }}
        >
          <button
            type="button"
            onClick={handleDelete}
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
              form="edit-requirement-form"
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
      </div>
    </div>
  );
};
