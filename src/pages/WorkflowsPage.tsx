/**
 * WorkflowsPage
 *
 * Displays workflows in two sections:
 * - Waiting for Me: workflows assigned to the current user that are pending
 * - Created by Me: workflows created by the current user
 */

import React, { useEffect, useState, useCallback } from 'react';
import { GitBranch, Clock, CheckCircle2, XCircle, User, FileText } from 'lucide-react';
import { diskWorkflowService } from '../services/diskWorkflowService';
import { useUser } from '../app/providers';
import type { Workflow } from '../types';
import { WorkflowDetailPanel } from '../components/WorkflowDetailPanel';
import { useToast } from '../app/providers/ToastProvider';

const NOTIFIED_APPROVALS_KEY = 'workflow_notified_approvals';

export const WorkflowsPage: React.FC = () => {
  const { currentUser, users } = useUser();
  const { showToast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const all = await diskWorkflowService.getAllWorkflows();
      setWorkflows(all);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // Check for newly approved workflows and show toast notification
  useEffect(() => {
    if (!currentUser || workflows.length === 0) return;

    // Get list of already notified approval IDs
    const notifiedIds = new Set<string>(
      JSON.parse(localStorage.getItem(NOTIFIED_APPROVALS_KEY) || '[]')
    );

    // Find workflows created by current user that are now approved but not yet notified
    const newlyApproved = workflows.filter(
      (wf) => wf.createdBy === currentUser.id && wf.status === 'approved' && !notifiedIds.has(wf.id)
    );

    // Show toast for each newly approved workflow
    newlyApproved.forEach((wf) => {
      const approverName = users.find((u) => u.id === wf.approvedBy)?.name || 'Someone';
      showToast(`🎉 Your workflow "${wf.title}" was approved by ${approverName}!`, 'success');
      notifiedIds.add(wf.id);
    });

    // Save updated notified IDs
    if (newlyApproved.length > 0) {
      localStorage.setItem(NOTIFIED_APPROVALS_KEY, JSON.stringify([...notifiedIds]));
    }
  }, [currentUser, workflows, users, showToast]);

  // Workflows assigned to current user (pending)
  const waitingForMe = workflows.filter(
    (wf) => wf.assignedTo === currentUser?.id && wf.status === 'pending'
  );

  // Workflows created by current user
  const createdByMe = workflows.filter((wf) => wf.createdBy === currentUser?.id);

  // Get user name by ID
  const getUserName = (userId: string): string => {
    const user = users.find((u) => u.id === userId);
    return user?.name || userId;
  };

  // Status badge color
  const getStatusColor = (status: Workflow['status']): string => {
    switch (status) {
      case 'pending':
        return 'rgba(234, 179, 8, 0.2)'; // yellow
      case 'approved':
        return 'rgba(34, 197, 94, 0.2)'; // green
      case 'rejected':
        return 'rgba(239, 68, 68, 0.2)'; // red
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

  const getStatusIcon = (status: Workflow['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} />;
      case 'approved':
        return <CheckCircle2 size={14} />;
      case 'rejected':
        return <XCircle size={14} />;
      default:
        return null;
    }
  };

  const handleWorkflowClick = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
  };

  if (!currentUser) {
    return (
      <div
        style={{
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        Please select a user to view workflows.
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-lg)', height: '100%', overflow: 'auto' }}>
      {loading ? (
        <div
          style={{
            padding: 'var(--spacing-xl)',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
          }}
        >
          Loading workflows...
        </div>
      ) : (
        <>
          {/* Waiting for Me Section */}
          <section style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h3
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-md)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              <Clock size={18} style={{ color: 'rgb(234, 179, 8)' }} />
              Waiting for Me
              {waitingForMe.length > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(234, 179, 8, 0.2)',
                    color: 'rgb(234, 179, 8)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  {waitingForMe.length}
                </span>
              )}
            </h3>
            {waitingForMe.length === 0 ? (
              <div
                style={{
                  padding: 'var(--spacing-lg)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'var(--color-bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                }}
              >
                No workflows waiting for your approval.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {waitingForMe.map((wf) => (
                  <div
                    key={wf.id}
                    onClick={() => handleWorkflowClick(wf)}
                    style={{
                      padding: 'var(--spacing-md)',
                      backgroundColor: 'var(--color-bg-card)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = 'var(--color-accent)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = 'var(--color-border)')
                    }
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            marginBottom: '4px',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 'var(--font-size-sm)',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            {wf.id}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: getStatusColor(wf.status),
                              color: getStatusTextColor(wf.status),
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 500,
                            }}
                          >
                            {getStatusIcon(wf.status)}
                            {wf.status}
                          </span>
                        </div>
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>{wf.title}</div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} />
                            From: {getUserName(wf.createdBy)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={12} />
                            {wf.artifactIds.length} artifact{wf.artifactIds.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Created by Me Section */}
          <section>
            <h3
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-md)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              <GitBranch size={18} style={{ color: 'var(--color-accent)' }} />
              Created by Me
            </h3>
            {createdByMe.length === 0 ? (
              <div
                style={{
                  padding: 'var(--spacing-lg)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'var(--color-bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                }}
              >
                You haven't created any workflows yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {createdByMe.map((wf) => (
                  <div
                    key={wf.id}
                    onClick={() => handleWorkflowClick(wf)}
                    style={{
                      padding: 'var(--spacing-md)',
                      backgroundColor: 'var(--color-bg-card)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = 'var(--color-accent)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = 'var(--color-border)')
                    }
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            marginBottom: '4px',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 'var(--font-size-sm)',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            {wf.id}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: getStatusColor(wf.status),
                              color: getStatusTextColor(wf.status),
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 500,
                            }}
                          >
                            {getStatusIcon(wf.status)}
                            {wf.status}
                          </span>
                        </div>
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>{wf.title}</div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} />
                            Assigned to: {getUserName(wf.assignedTo)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={12} />
                            {wf.artifactIds.length} artifact{wf.artifactIds.length !== 1 ? 's' : ''}
                          </span>
                          {wf.status === 'approved' && wf.approvedBy && (
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: 'rgb(34, 197, 94)',
                              }}
                            >
                              <CheckCircle2 size={12} />
                              Approved by {getUserName(wf.approvedBy)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      {/* Workflow Detail Panel */}
      {selectedWorkflow && (
        <WorkflowDetailPanel
          workflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          onUpdate={() => {
            loadWorkflows();
            setSelectedWorkflow(null);
          }}
        />
      )}
    </div>
  );
};
