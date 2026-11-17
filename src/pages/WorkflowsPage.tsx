import React, { useEffect, useState, useCallback } from 'react';
import { GitBranch, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { diskWorkflowService } from '../services/diskWorkflowService';
import { useUser } from '../app/providers';
import type { Workflow } from '../types';
import { WorkflowDetailPanel } from '../components/WorkflowDetailPanel';
import { BaseArtifactTable, type ColumnDef } from '../components/BaseArtifactTable';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';
import { notifyError, useAppStore } from '../state';

const NOTIFIED_APPROVALS_KEY = 'workflow_notified_approvals';

export const WorkflowsPage: React.FC = () => {
  const { currentUser } = useUser();
  const showToast = useAppStore((s) => s.showToast);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const all = await diskWorkflowService.getAllWorkflows();
      setWorkflows(all);
    } catch (error) {
      notifyError('Could not load workflows', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
    // Reload whenever a workflow is created/updated anywhere (e.g. via "Create New")
    return diskWorkflowService.subscribe(() => {
      loadWorkflows();
    });
  }, [loadWorkflows]);

  // Check for newly approved workflows and show toast notification
  useEffect(() => {
    if (!currentUser || workflows.length === 0) return;

    const notifiedIds = new Set<string>(
      JSON.parse(localStorage.getItem(NOTIFIED_APPROVALS_KEY) || '[]')
    );

    const newlyApproved = workflows.filter(
      (wf) =>
        wf.createdBy === currentUser.name && wf.status === 'approved' && !notifiedIds.has(wf.id!)
    );

    newlyApproved.forEach((wf) => {
      const approverName = wf.approvedBy || 'Someone';
      showToast(`🎉 Your workflow "${wf.title!}" was approved by ${approverName} !`, 'success');
      notifiedIds.add(wf.id!);
    });

    if (newlyApproved.length > 0) {
      localStorage.setItem(NOTIFIED_APPROVALS_KEY, JSON.stringify([...notifiedIds]));
    }
  }, [currentUser, workflows, showToast]);

  // Shared helpers for columns
  // Workflows name people by their git author name
  const getUserName = useCallback((name: string): string => name, []);

  const getStatusColor = (status: Workflow['status']): string => {
    switch (status) {
      case 'pending':
        return 'var(--color-warning-bg)';
      case 'approved':
        return 'var(--color-success-bg)';
      case 'rejected':
        return 'var(--color-error-bg)';
      default:
        return 'var(--color-bg-secondary)';
    }
  };

  const getStatusTextColor = (status: Workflow['status']): string => {
    switch (status) {
      case 'pending':
        return 'var(--color-warning)';
      case 'approved':
        return 'var(--color-success)';
      case 'rejected':
        return 'var(--color-error)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const getStatusIcon = (status: Workflow['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={12} />;
      case 'approved':
        return <CheckCircle2 size={12} />;
      case 'rejected':
        return <XCircle size={12} />;
      default:
        return null;
    }
  };

  const renderStatus = (wf: Workflow) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
        }}
      >
        {wf.id}
      </span>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: getStatusColor(wf.status),
          color: getStatusTextColor(wf.status),
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
          width: 'fit-content',
        }}
      >
        {getStatusIcon(wf.status)}
        {wf.status}
      </div>
    </div>
  );

  const {
    sortedData: waitingForMe,
    sortConfig: waitingSort,
    handleSortChange: onWaitingSortChange,
  } = useArtifactFilteredData(workflows, {
    searchQuery: '',
    filterFn: (wf: Workflow) => wf.assignedTo === currentUser?.name && wf.status === 'pending',
    getValueFn: (wf: Workflow, key: string) => {
      if (key === 'createdBy') return getUserName(wf.createdBy!);
      if (key === 'artifactIds') return wf.artifactIds?.length || 0;
      return (wf as unknown as Record<string, string | number | undefined>)[key];
    },
  });

  const {
    sortedData: createdByMe,
    sortConfig: createdSort,
    handleSortChange: onCreatedSortChange,
  } = useArtifactFilteredData(workflows, {
    searchQuery: '',
    filterFn: (wf: Workflow) => wf.createdBy === currentUser?.name,
    getValueFn: (wf: Workflow, key: string) => {
      if (key === 'assignedTo') return getUserName(wf.assignedTo!);
      if (key === 'approvedBy') return wf.approvedBy ? getUserName(wf.approvedBy) : '';
      if (key === 'artifactIds') return wf.artifactIds?.length || 0;
      return (wf as unknown as Record<string, string | number | undefined>)[key];
    },
  });

  // Column definitions
  const waitingColumns: ColumnDef<Workflow>[] = [
    { key: 'id', label: 'ID / Status', width: '150px', render: renderStatus, sortable: true },
    {
      key: 'title',
      label: 'Title',
      render: (wf) => <div style={{ fontWeight: 500 }}>{wf.title}</div>,
      sortable: true,
    },
    { key: 'createdBy', label: 'From', render: (wf) => getUserName(wf.createdBy!), sortable: true },
    {
      key: 'artifactIds',
      label: 'Artifacts',
      render: (wf) => `${wf.artifactIds?.length || 0} items`,
      sortable: true,
    },
    {
      key: 'dateCreated',
      label: 'Date Created',
      render: (wf) => new Date(wf.dateCreated).toLocaleDateString(),
      sortable: true,
    },
  ];

  const createdColumns: ColumnDef<Workflow>[] = [
    { key: 'id', label: 'ID / Status', width: '150px', render: renderStatus, sortable: true },
    {
      key: 'title',
      label: 'Title',
      render: (wf) => <div style={{ fontWeight: 500 }}>{wf.title}</div>,
      sortable: true,
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (wf) => getUserName(wf.assignedTo!),
      sortable: true,
    },
    {
      key: 'artifactIds',
      label: 'Artifacts',
      render: (wf) => `${wf.artifactIds?.length || 0} items`,
      sortable: true,
    },
    {
      key: 'approvedBy',
      label: 'Approval info',
      render: (wf) =>
        wf.status === 'approved' && wf.approvedBy ? (
          <span
            style={{
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CheckCircle2 size={12} /> Approved by {getUserName(wf.approvedBy)}
          </span>
        ) : (
          '-'
        ),
      sortable: true,
    },
  ];

  if (!currentUser) {
    return (
      <div
        style={{
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        Set your name in User Settings to view workflows.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 'var(--spacing-lg)',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)',
      }}
    >
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
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <h3
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-md)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 600,
              }}
            >
              <Clock size={18} style={{ color: 'var(--color-warning)' }} />
              Waiting for Me
              {waitingForMe.length > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--color-warning-bg)',
                    color: 'var(--color-warning)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  {waitingForMe.length}
                </span>
              )}
            </h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <BaseArtifactTable
                data={waitingForMe}
                columns={waitingColumns}
                sortConfig={waitingSort}
                onSortChange={onWaitingSortChange}
                onRowClick={setSelectedWorkflow}
                emptyMessage="No workflows waiting for your approval."
              />
            </div>
          </div>

          {/* Created by Me Section */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <h3
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-md)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 600,
              }}
            >
              <GitBranch size={18} style={{ color: 'var(--color-accent)' }} />
              Created by Me
            </h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <BaseArtifactTable
                data={createdByMe}
                columns={createdColumns}
                sortConfig={createdSort}
                onSortChange={onCreatedSortChange}
                onRowClick={setSelectedWorkflow}
                emptyMessage="You haven't created any workflows yet."
              />
            </div>
          </div>
        </>
      )}

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
