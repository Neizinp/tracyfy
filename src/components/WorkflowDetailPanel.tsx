/**
 * WorkflowDetailPanel
 *
 * Shows workflow details and allows approve/reject actions.
 * Updates linked artifact statuses on approval.
 */

import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Clock, User, FileText, MessageSquare } from 'lucide-react';
import type { Workflow } from '../types';
import {
  useUser,
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
  useRisks,
} from '../app/providers';
import { useFileSystem } from '../app/providers/FileSystemProvider';
import { diskWorkflowService } from '../services/diskWorkflowService';
import { useToast } from '../app/providers/ToastProvider';
import type { TestCase } from '../types';

interface WorkflowDetailPanelProps {
  workflow: Workflow;
  onClose: () => void;
  onUpdate: () => void;
}

export const WorkflowDetailPanel: React.FC<WorkflowDetailPanelProps> = ({
  workflow,
  onClose,
  onUpdate,
}) => {
  const { currentUser, users } = useUser();
  const { requirements, handleUpdateRequirement } = useRequirements();
  const { useCases, handleUpdateUseCase } = useUseCases();
  const { testCases, handleUpdateTestCase } = useTestCases();
  const { information, handleUpdateInformation } = useInformation();
  const { risks, handleUpdateRisk } = useRisks();
  const { reloadData } = useFileSystem();
  const { showToast } = useToast();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAssignedToMe = workflow.assignedTo === currentUser?.id;
  const isPending = workflow.status === 'pending';
  const canApprove = isAssignedToMe && isPending;

  const getUserName = (userId: string): string => {
    const user = users.find((u) => u.id === userId);
    return user?.name || userId;
  };

  const getStatusColor = (status: Workflow['status']): string => {
    switch (status) {
      case 'pending':
        return 'rgba(234, 179, 8, 0.2)';
      case 'approved':
        return 'rgba(34, 197, 94, 0.2)';
      case 'rejected':
        return 'rgba(239, 68, 68, 0.2)';
      default:
        return 'var(--color-bg-secondary)';
    }
  };

  const getStatusTextColor = (status: Workflow['status']): string => {
    switch (status) {
      case 'pending':
        return 'rgb(234, 179, 8)';
      case 'approved':
        return 'rgb(34, 197, 94)';
      case 'rejected':
        return 'rgb(239, 68, 68)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  /**
   * Update artifact status to 'approved'
   */
  const updateArtifactStatus = async (artifactId: string): Promise<void> => {
    // Check requirements
    const req = requirements.find((r) => r.id === artifactId);
    if (req) {
      await handleUpdateRequirement(artifactId, {
        status: 'approved',
        approvalDate: Date.now(),
      });
      return;
    }

    // Check use cases
    const uc = useCases.find((u) => u.id === artifactId);
    if (uc) {
      await handleUpdateUseCase(artifactId, {
        status: 'approved',
      });
      return;
    }

    // Check test cases
    const tc = testCases.find((t) => t.id === artifactId);
    if (tc) {
      await handleUpdateTestCase(artifactId, {
        status: 'approved' as TestCase['status'],
      });
      return;
    }

    // Check information
    const info = information.find((i) => i.id === artifactId);
    if (info) {
      await handleUpdateInformation(artifactId, {
        status: 'approved',
      });
      return;
    }

    // Check risks
    const risk = risks.find((r) => r.id === artifactId);
    if (risk) {
      await handleUpdateRisk(artifactId, {
        status: 'approved',
      });
      return;
    }
  };

  const handleApprove = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);

    try {
      // 1. Approve the workflow
      const approvedWorkflow = await diskWorkflowService.approveWorkflow(
        workflow.id,
        currentUser.id,
        currentUser.name,
        comment || undefined
      );

      if (!approvedWorkflow) {
        showToast('Failed to approve workflow', 'error');
        return;
      }

      // 2. Update all linked artifact statuses to 'approved'
      for (const artifactId of workflow.artifactIds || []) {
        try {
          await updateArtifactStatus(artifactId);
        } catch (err) {
          console.error(`Failed to update status for ${artifactId}:`, err);
        }
      }

      // 3. Auto-commit with approval message
      await diskWorkflowService.commitApproval(workflow.id, workflow.title, currentUser.name);

      showToast(
        `Workflow ${workflow.id} approved! ${(workflow.artifactIds || []).length} artifact(s) updated.`,
        'success'
      );

      // 4. Reload data to reflect changes
      await reloadData();
      onUpdate();
    } catch (error) {
      console.error('Failed to approve workflow:', error);
      showToast('Failed to approve workflow', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!currentUser) return;
    if (!comment.trim()) {
      showToast('Please provide a reason for rejection', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await diskWorkflowService.rejectWorkflow(workflow.id, currentUser.id, comment);
      showToast(`Workflow ${workflow.id} rejected`, 'info');
      await reloadData();
      onUpdate();
    } catch (error) {
      console.error('Failed to reject workflow:', error);
      showToast('Failed to reject workflow', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get artifact info
  const getArtifactInfo = (id: string) => {
    const req = requirements.find((r) => r.id === id);
    if (req) return { id, title: req.title, type: 'Requirement', status: req.status };
    const uc = useCases.find((u) => u.id === id);
    if (uc) return { id, title: uc.title, type: 'Use Case', status: uc.status };
    const tc = testCases.find((t) => t.id === id);
    if (tc) return { id, title: tc.title, type: 'Test Case', status: tc.status };
    return { id, title: 'Unknown', type: 'Unknown', status: 'unknown' };
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <span style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
              {workflow.id}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: getStatusColor(workflow.status),
                color: getStatusTextColor(workflow.status),
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              {workflow.status === 'pending' && <Clock size={14} />}
              {workflow.status === 'approved' && <CheckCircle2 size={14} />}
              {workflow.status === 'rejected' && <XCircle size={14} />}
              {workflow.status}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--color-text-muted)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 'var(--spacing-lg)', overflow: 'auto', flex: 1 }}>
          {/* Title */}
          <h2 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: 'var(--font-size-xl)' }}>
            {workflow.title}
          </h2>

          {/* Meta info */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={14} />
              Created by: {getUserName(workflow.createdBy || '')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={14} />
              Assigned to: {getUserName(workflow.assignedTo || '')}
            </span>
          </div>

          {/* Description */}
          {workflow.description && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h4
                style={{
                  margin: '0 0 var(--spacing-xs) 0',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                }}
              >
                Description
              </h4>
              <div
                style={{
                  padding: 'var(--spacing-sm)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderRadius: '6px',
                  fontSize: 'var(--font-size-sm)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {workflow.description}
              </div>
            </div>
          )}

          {/* Artifacts */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h4
              style={{
                margin: '0 0 var(--spacing-sm) 0',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              <FileText size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Artifacts for Approval ({(workflow.artifactIds || []).length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(workflow.artifactIds || []).map((id) => {
                const info = getArtifactInfo(id);
                return (
                  <div
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderRadius: '6px',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', color: 'var(--color-accent)' }}>
                      {id}
                    </span>
                    <span style={{ flex: 1 }}>{info.title}</span>
                    <span
                      style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}
                    >
                      {info.type}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor:
                          info.status === 'approved'
                            ? 'rgba(34, 197, 94, 0.2)'
                            : 'var(--color-bg-app)',
                        color:
                          info.status === 'approved'
                            ? 'rgb(34, 197, 94)'
                            : 'var(--color-text-muted)',
                      }}
                    >
                      {info.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Approval result (if not pending) */}
          {workflow.status !== 'pending' && workflow.approvedBy && (
            <div
              style={{
                padding: 'var(--spacing-md)',
                backgroundColor: getStatusColor(workflow.status),
                borderRadius: '8px',
                marginBottom: 'var(--spacing-lg)',
              }}
            >
              <div
                style={{
                  fontWeight: 500,
                  color: getStatusTextColor(workflow.status),
                  marginBottom: '4px',
                }}
              >
                {workflow.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                {getUserName(workflow.approvedBy)}
              </div>
              {workflow.approverComment && (
                <div
                  style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}
                >
                  {workflow.approverComment}
                </div>
              )}
            </div>
          )}

          {/* Approval comment (if pending and can approve) */}
          {canApprove && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                }}
              >
                <MessageSquare size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Comment (optional for approval, required for rejection)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  resize: 'vertical',
                }}
              />
            </div>
          )}
        </div>

        {/* Footer - Actions */}
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
            Close
          </button>

          {canApprove && (
            <>
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'rgb(239, 68, 68)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <XCircle size={16} />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'rgb(34, 197, 94)',
                  color: 'white',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle2 size={16} />
                {isSubmitting ? 'Approving...' : 'Approve'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
