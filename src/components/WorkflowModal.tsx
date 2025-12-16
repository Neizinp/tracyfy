/**
 * WorkflowModal
 *
 * Modal for creating and editing workflows.
 * Allows selecting artifacts for approval and assigning to a user.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Search, FileText, CheckCircle2, User } from 'lucide-react';
import type { Workflow } from '../types';
import { useUser } from '../app/providers';
import { useFileSystem } from '../app/providers/FileSystemProvider';
import { diskWorkflowService } from '../services/diskWorkflowService';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { MarkdownEditor } from './MarkdownEditor';

interface WorkflowModalProps {
  isOpen: boolean;
  workflow?: Workflow | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  isOpen,
  workflow,
  onClose,
  onSuccess,
}) => {
  const { currentUser, users } = useUser();
  const { requirements, useCases, testCases, information, risks } = useFileSystem();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<string[]>([]);
  const [artifactSearch, setArtifactSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use keyboard shortcut to close on Escape
  useKeyboardShortcuts({ onClose });

  // Reset form when modal opens/closes or workflow changes
  useEffect(() => {
    if (isOpen) {
      if (workflow) {
        setTitle(workflow.title);
        setDescription(workflow.description);
        setAssignedTo(workflow.assignedTo);
        setSelectedArtifactIds(workflow.artifactIds);
      } else {
        setTitle('');
        setDescription('');
        setAssignedTo('');
        setSelectedArtifactIds([]);
      }
      setArtifactSearch('');
    }
  }, [isOpen, workflow]);

  // Get all artifacts for selection
  const allArtifacts = [
    ...requirements
      .filter((r) => !r.isDeleted)
      .map((r) => ({ id: r.id, title: r.title, type: 'Requirement', status: r.status })),
    ...useCases
      .filter((u) => !u.isDeleted)
      .map((u) => ({ id: u.id, title: u.title, type: 'Use Case', status: u.status })),
    ...testCases
      .filter((t) => !t.isDeleted)
      .map((t) => ({ id: t.id, title: t.title, type: 'Test Case', status: t.status })),
    ...information
      .filter((i) => !i.isDeleted)
      .map((i) => ({ id: i.id, title: i.title, type: 'Information', status: 'draft' })),
    ...risks
      .filter((r) => !r.isDeleted)
      .map((r) => ({ id: r.id, title: r.title, type: 'Risk', status: r.status })),
  ];

  // Filter artifacts by search
  const filteredArtifacts = allArtifacts.filter((artifact) => {
    if (!artifactSearch) return true;
    const search = artifactSearch.toLowerCase();
    return (
      artifact.id.toLowerCase().includes(search) ||
      artifact.title.toLowerCase().includes(search) ||
      artifact.type.toLowerCase().includes(search)
    );
  });

  // Available artifacts (not already selected)
  const availableArtifacts = filteredArtifacts.filter((a) => !selectedArtifactIds.includes(a.id));

  // Other users (excluding current user for assignment)
  const otherUsers = users.filter((u) => u.id !== currentUser?.id);

  const handleAddArtifact = (id: string) => {
    setSelectedArtifactIds((prev) => [...prev, id]);
    setArtifactSearch('');
  };

  const handleRemoveArtifact = (id: string) => {
    setSelectedArtifactIds((prev) => prev.filter((a) => a !== id));
  };

  const handleSubmit = useCallback(async () => {
    if (!currentUser) return;
    if (!title.trim()) return;
    if (!assignedTo) return;
    if (selectedArtifactIds.length === 0) return;

    setIsSubmitting(true);
    try {
      if (workflow) {
        // Update existing workflow
        await diskWorkflowService.updateWorkflow(workflow.id, {
          title: title.trim(),
          description,
          assignedTo,
          artifactIds: selectedArtifactIds,
        });
      } else {
        // Create new workflow
        await diskWorkflowService.createWorkflow(
          title.trim(),
          description,
          currentUser.id,
          assignedTo,
          selectedArtifactIds
        );
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentUser,
    title,
    description,
    assignedTo,
    selectedArtifactIds,
    workflow,
    onSuccess,
    onClose,
  ]);

  const getArtifactInfo = (id: string) => {
    return allArtifacts.find((a) => a.id === id);
  };

  if (!isOpen) return null;

  const isValid = title.trim() && assignedTo && selectedArtifactIds.length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '12px',
          width: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--spacing-lg)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>
            {workflow ? 'Edit Workflow' : 'New Workflow'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--color-text-muted)',
              borderRadius: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 'var(--spacing-lg)', overflow: 'auto', flex: 1 }}>
          {/* Title */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Approve Authentication Requirements"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
              }}
            />
          </div>

          {/* Assign To */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              <User size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Assign To *
            </label>
            {otherUsers.length === 0 ? (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                  borderRadius: '6px',
                  color: 'rgb(234, 179, 8)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                No other users available. Create another user in User Settings to assign workflows.
              </div>
            ) : (
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <option value="">Select a user...</option>
                {otherUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Artifacts */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              <FileText size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Artifacts for Approval *
            </label>

            {/* Selected Artifacts */}
            {selectedArtifactIds.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: 'var(--spacing-sm)',
                }}
              >
                {selectedArtifactIds.map((id) => {
                  const info = getArtifactInfo(id);
                  return (
                    <div
                      key={id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: '4px',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      <span style={{ fontFamily: 'monospace', color: 'var(--color-accent)' }}>
                        {id}
                      </span>
                      {info && (
                        <span
                          style={{
                            color: 'var(--color-text-muted)',
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {info.title}
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveArtifact(id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Search and Add Artifacts */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  type="text"
                  value={artifactSearch}
                  onChange={(e) => setArtifactSearch(e.target.value)}
                  placeholder="Search artifacts to add..."
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                />
              </div>

              {/* Artifact dropdown */}
              {artifactSearch && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflow: 'auto',
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    zIndex: 10,
                  }}
                >
                  {availableArtifacts.length === 0 ? (
                    <div
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: 'var(--color-text-muted)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      No matching artifacts
                    </div>
                  ) : (
                    availableArtifacts.slice(0, 10).map((artifact) => (
                      <div
                        key={artifact.id}
                        onClick={() => handleAddArtifact(artifact.id)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = 'transparent')
                        }
                      >
                        <Plus size={14} style={{ color: 'var(--color-accent)' }} />
                        <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>
                          {artifact.id}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 'var(--font-size-sm)',
                          }}
                        >
                          {artifact.title}
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          {artifact.type}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              Description (optional)
            </label>
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              placeholder="Add any notes or context for the approver..."
              height={100}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-lg)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isValid ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
              color: isValid ? 'white' : 'var(--color-text-muted)',
              cursor: isValid ? 'pointer' : 'not-allowed',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={16} />
            {isSubmitting ? 'Saving...' : workflow ? 'Update Workflow' : 'Create Workflow'}
          </button>
        </div>
      </div>
    </div>
  );
};
