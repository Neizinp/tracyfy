import React, { useMemo, useCallback } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { Risk, RiskColumnVisibility, Project } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { BaseArtifactTable, type ColumnDef } from './BaseArtifactTable';
import type { SortConfig } from './SortableHeader';

interface RiskListProps {
  risks: Risk[];
  onEdit: (risk: Risk) => void;
  visibleColumns: RiskColumnVisibility;
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
}

const getProbabilityStyle = (probability: string) => {
  switch (probability) {
    case 'high':
      return { bg: 'var(--color-error-bg)', text: 'var(--color-error-light)' };
    case 'medium':
      return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-light)' };
    case 'low':
      return { bg: 'var(--color-success-bg)', text: 'var(--color-success-light)' };
    default:
      return { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' };
  }
};

const getImpactStyle = (impact: string) => {
  switch (impact) {
    case 'high':
      return { bg: 'var(--color-error-bg)', text: 'var(--color-error-light)' };
    case 'medium':
      return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-light)' };
    case 'low':
      return { bg: 'var(--color-success-bg)', text: 'var(--color-success-light)' };
    default:
      return { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' };
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'resolved':
      return { bg: 'var(--color-success-bg)', text: 'var(--color-success-light)' };
    case 'accepted':
      return { bg: 'var(--color-info-bg)', text: 'var(--color-info-light)' };
    case 'mitigating':
      return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-light)' };
    case 'analyzing':
      return { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' };
    default:
      return { bg: 'var(--color-error-bg)', text: 'var(--color-error-light)' };
  }
};

export const RiskList: React.FC<RiskListProps> = ({
  risks,
  onEdit,
  visibleColumns,
  sortConfig,
  onSortChange,
  showProjectColumn,
  projects,
}) => {
  const badgeStyle: React.CSSProperties = useMemo(
    () => ({
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: 'var(--font-size-xs)',
      fontWeight: 500,
      textTransform: 'capitalize',
    }),
    []
  );

  const getProjectNames = useCallback(
    (riskId: string) => {
      if (!projects) return '';
      return projects
        .filter((p: Project) => p.riskIds?.includes(riskId))
        .map((p: Project) => p.name)
        .join(', ');
    },
    [projects]
  );

  const columns = useMemo<ColumnDef<Risk>[]>(
    () => [
      {
        key: 'id',
        label: 'ID / Title',
        width: '250px',
        render: (risk) => (
          <>
            <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '4px' }}>
              {risk.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{risk.title}</div>
          </>
        ),
      },
      {
        key: 'revision',
        label: 'Rev',
        width: '60px',
        visible: visibleColumns.revision,
        render: (risk) => (
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {risk.revision || '01'}
          </span>
        ),
      },
      {
        key: 'projects',
        label: 'Project(s)',
        width: '150px',
        visible: showProjectColumn,
        sortable: false,
        render: (risk) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {getProjectNames(risk.id)
              .split(', ')
              .map(
                (name: string, i: number) =>
                  name && (
                    <span
                      key={i}
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {name}
                    </span>
                  )
              )}
          </div>
        ),
      },
      {
        key: 'category',
        label: 'Category',
        width: '120px',
        visible: visibleColumns.category,
        render: (risk) => (
          <span
            style={{
              ...badgeStyle,
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {risk.category}
          </span>
        ),
      },
      {
        key: 'probability',
        label: 'Probability',
        width: '100px',
        visible: visibleColumns.probability,
        render: (risk) => (
          <span
            style={{
              ...badgeStyle,
              backgroundColor: getProbabilityStyle(risk.probability || 'medium').bg,
              color: getProbabilityStyle(risk.probability || 'medium').text,
            }}
          >
            {risk.probability || 'medium'}
          </span>
        ),
      },
      {
        key: 'impact',
        label: 'Impact',
        width: '100px',
        visible: visibleColumns.impact,
        render: (risk) => (
          <span
            style={{
              ...badgeStyle,
              backgroundColor: getImpactStyle(risk.impact || 'medium').bg,
              color: getImpactStyle(risk.impact || 'medium').text,
            }}
          >
            {risk.impact || 'medium'}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '120px',
        visible: visibleColumns.status,
        render: (risk) => (
          <span
            style={{
              ...badgeStyle,
              backgroundColor: getStatusStyle(risk.status || 'open').bg,
              color: getStatusStyle(risk.status || 'open').text,
            }}
          >
            {risk.status || 'open'}
          </span>
        ),
      },
      {
        key: 'owner',
        label: 'Owner',
        width: '120px',
        visible: visibleColumns.owner,
        render: (risk) => (
          <span style={{ color: 'var(--color-text-secondary)' }}>{risk.owner || '—'}</span>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        minWidth: '200px',
        visible: visibleColumns.description,
        render: (risk) => (
          <div
            style={{
              color: 'var(--color-text-secondary)',
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {risk.description}
          </div>
        ),
      },
      {
        key: 'dateCreated',
        label: 'Created',
        width: '140px',
        visible: visibleColumns.created,
        render: (risk) => (
          <span style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {formatDateTime(risk.dateCreated)}
          </span>
        ),
      },
    ],
    [visibleColumns, badgeStyle, getProjectNames, showProjectColumn]
  );

  if (risks.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-xl)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          gap: 'var(--spacing-md)',
        }}
      >
        <ShieldAlert size={48} />
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          No risks found. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <BaseArtifactTable
      data={risks}
      columns={columns}
      sortConfig={sortConfig}
      onSortChange={onSortChange}
      onRowClick={onEdit}
      emptyMessage="No risks found."
    />
  );
};
