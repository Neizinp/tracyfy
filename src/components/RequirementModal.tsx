import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Requirement, ArtifactLink } from '../types';
import { MarkdownEditor } from './MarkdownEditor';
import { formatDateTime } from '../utils/dateUtils';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI, useGlobalState, useUser } from '../app/providers';
import { useLinkService } from '../hooks/useLinkService';
import { LINK_TYPE_LABELS } from '../utils/linkTypes';

interface RequirementModalProps {
  isOpen: boolean;
  requirement: Requirement | null; // null = create mode
  onClose: () => void;
  onCreate: (req: Omit<Requirement, 'id' | 'children' | 'lastModified'>) => void;
  onUpdate: (id: string, updates: Partial<Requirement>) => void;
  onDelete: (id: string) => void;
}

type Tab = 'overview' | 'details' | 'relationships' | 'comments' | 'history';

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export const RequirementModal: React.FC<RequirementModalProps> = ({
  isOpen,
  requirement,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const {
    setIsLinkModalOpen,
    setLinkSourceId,
    setLinkSourceType,
    // For navigating to other artifacts
    setEditingRequirement,
    setIsEditRequirementModalOpen,
    setEditingUseCase,
    setIsUseCaseModalOpen,
    setSelectedTestCaseId,
    setIsEditTestCaseModalOpen,
    setSelectedInformation,
    setIsInformationModalOpen,
  } = useUI();
  const { requirements, useCases, information } = useGlobalState();
  const { currentUser } = useUser();
  const isEditMode = requirement !== null;

  // Get links using the new link service
  const {
    outgoingLinks,
    incomingLinks,
    loading: linksLoading,
  } = useLinkService({
    artifactId: requirement?.id,
  });

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [text, setText] = useState('');
  const [rationale, setRationale] = useState('');
  const [priority, setPriority] = useState<Requirement['priority']>('medium');
  const [status, setStatus] = useState<Requirement['status']>('draft');

  const [verificationMethod, setVerificationMethod] = useState('');
  const [comments, setComments] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkedArtifacts, setLinkedArtifacts] = useState<ArtifactLink[]>([]);

  // Reset form when modal opens/closes or requirement changes
  useEffect(() => {
    if (isOpen) {
      if (requirement) {
        // Edit mode: populate from requirement
        setTitle(requirement.title);
        setDescription(requirement.description);
        setText(requirement.text);
        setRationale(requirement.rationale);
        setPriority(requirement.priority);
        setStatus(requirement.status);
        setVerificationMethod(requirement.verificationMethod || '');
        setComments(requirement.comments || '');
        setLinkedArtifacts(requirement.linkedArtifacts || []);
      } else {
        // Create mode: reset to defaults
        setTitle('');
        setDescription('');
        setText('');
        setRationale('');
        setPriority('medium');
        setStatus('draft');
        setVerificationMethod('');
        setComments('');
        setLinkedArtifacts([]);
      }
      setActiveTab('overview');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, requirement]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isEditMode && requirement) {
      // Update existing requirement
      onUpdate(requirement.id, {
        title,
        description,
        text,
        rationale,
        priority,
        status,
        linkedArtifacts,
        verificationMethod,
        comments,
      });
    } else {
      // Create new requirement
      onCreate({
        title,
        description,
        text,
        rationale,
        priority,
        author: currentUser?.name || undefined,
        verificationMethod: verificationMethod || undefined,
        comments: comments || undefined,
        dateCreated: Date.now(),
        status: 'draft',
        revision: '01',
      });
    }
    onClose();
  };

  const handleRemoveLink = (targetId: string) => {
    setLinkedArtifacts((prev) => prev.filter((link) => link.targetId !== targetId));
  };

  useKeyboardShortcuts({
    onSave: handleSubmit,
    onClose: onClose,
  });

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

  // Navigate to a linked artifact by opening its edit modal
  const handleNavigateToArtifact = (sourceId: string, sourceType: string) => {
    onClose(); // Close current modal first

    switch (sourceType) {
      case 'requirement': {
        const req = requirements.find((r) => r.id === sourceId);
        if (req) {
          setEditingRequirement(req);
          setIsEditRequirementModalOpen(true);
        }
        break;
      }
      case 'useCase': {
        const uc = useCases.find((u) => u.id === sourceId);
        if (uc) {
          setEditingUseCase(uc);
          setIsUseCaseModalOpen(true);
        }
        break;
      }
      case 'testCase': {
        setSelectedTestCaseId(sourceId);
        setIsEditTestCaseModalOpen(true);
        break;
      }
      case 'information': {
        const info = information.find((i) => i.id === sourceId);
        if (info) {
          setSelectedInformation(info);
          setIsInformationModalOpen(true);
        }
        break;
      }
    }
  };

  if (!isOpen) return null;

  const modalTitle = isEditMode ? `Edit Requirement - ${requirement?.id}` : 'New Requirement';
  const submitLabel = isEditMode ? 'Save Changes' : 'Create Requirement';

  // Filter tabs based on mode
  const allTabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'comments', label: 'Comments' },
    ...(isEditMode ? [{ id: 'history' as Tab, label: 'Revision History' }] : []),
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
          {allTabs.map((tab) => (
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
                    color: isEditMode
                      ? 'var(--color-text-muted)'
                      : currentUser
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-muted)',
                  }}
                >
                  {isEditMode
                    ? requirement?.author || 'Not specified'
                    : currentUser?.name || 'No user selected'}
                </div>
              </div>

              {isEditMode && (
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
                    value={requirement ? formatDateTime(requirement.dateCreated) : ''}
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
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  <label
                    style={{
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    Linked Items
                  </label>
                  {isEditMode && requirement && (
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
                  )}
                </div>
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
                      Save the requirement first to add relationships.
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
                      No linked items. Click "+ Add Link" to create relationships with other
                      artifacts.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
                          }}
                        >
                          <div
                            onClick={() => {
                              // Determine artifact type from ID prefix
                              const id = link.targetId;
                              let type = 'requirement';
                              if (id.startsWith('UC-')) type = 'useCase';
                              else if (id.startsWith('TC-')) type = 'testCase';
                              else if (id.startsWith('INFO-')) type = 'information';
                              handleNavigateToArtifact(id, type);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: 'var(--font-size-sm)',
                              cursor: 'pointer',
                              flex: 1,
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
                            <span style={{ fontWeight: 500, color: 'var(--color-accent)' }}>
                              {link.targetId}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveLink(link.targetId);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-text-muted)',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--color-error)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--color-text-muted)';
                            }}
                            title="Remove link"
                          >
                            <Trash2 size={14} />
                          </button>
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
                      No incoming links. Other artifacts can link to this requirement.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {incomingLinks.map((link, index) => (
                        <div
                          key={`${link.sourceId}-${index}`}
                          onClick={() => handleNavigateToArtifact(link.sourceId, link.sourceType)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 8px',
                            backgroundColor: 'var(--color-bg-card)',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                            fontSize: 'var(--font-size-sm)',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
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
          {isEditMode && (
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
          )}
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-sm)',
              marginLeft: isEditMode ? '0' : 'auto',
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
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
