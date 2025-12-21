import React, { useMemo, useCallback } from 'react';
import type { Risk, Project, RiskColumnVisibility } from '../types';
import { useProject, useCustomAttributes } from '../app/providers';
import { formatDateTime } from '../utils/dateUtils';
import { BaseArtifactTable, MarkdownCell } from './index';
import type { ColumnDef } from './BaseArtifactTable';
import type { SortConfig } from './SortableHeader';

interface RiskListProps {
  risks: Risk[];
  onEdit: (risk: Risk) => void;
  visibleColumns: RiskColumnVisibility;
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
}

export const RiskList: React.FC<RiskListProps> = ({
  risks,
  onEdit,
  visibleColumns,
  sortConfig,
  onSortChange,
}) => {
  const { projects } = useProject();
  const { definitions } = useCustomAttributes();

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
        key: 'idTitle',
        label: 'ID / Title',
        width: '250px',
        render: (risk: Risk) => (
          <>
            <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '2px' }}>
              {risk.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{risk.title}</div>
          </>
        ),
      },
      {
        key: 'projects',
        label: 'Project(s)',
        width: '150px',
        visible: visibleColumns.projects,
        sortable: false,
        render: (risk) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {getProjectNames(risk.id)
              .split(', ')
              .map(
                (name, i) =>
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
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--color-info)',
            }}
          >
            {risk.category || 'General'}
          </span>
        ),
      },
      {
        key: 'probability',
        label: 'Prob',
        width: '80px',
        visible: visibleColumns.probability,
        render: (risk) => (
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {risk.probability || '-'}
          </span>
        ),
      },
      {
        key: 'impact',
        label: 'Impact',
        width: '80px',
        visible: visibleColumns.impact,
        render: (risk) => (
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {risk.impact || '-'}
          </span>
        ),
      },
      {
        key: 'severity',
        label: 'Severity',
        width: '100px',
        visible: visibleColumns.severity,
        render: (risk) => {
          const prob =
            typeof risk.probability === 'number'
              ? risk.probability
              : parseFloat(risk.probability || '0');
          const imp =
            typeof risk.impact === 'number' ? risk.impact : parseFloat(risk.impact || '0');
          const sev = prob * imp;
          return (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                background:
                  sev >= 15
                    ? 'rgba(239, 68, 68, 0.1)'
                    : sev >= 8
                      ? 'rgba(245, 158, 11, 0.1)'
                      : 'rgba(16, 185, 129, 0.1)',
                color:
                  sev >= 15
                    ? 'var(--color-error)'
                    : sev >= 8
                      ? 'var(--color-warning)'
                      : 'var(--color-success)',
              }}
            >
              {sev > 0 ? sev : '-'}
            </span>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        width: '100px',
        visible: visibleColumns.status,
        render: (risk) => (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                risk.status === 'mitigated'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : risk.status === 'open'
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(107, 114, 128, 0.1)',
              color:
                risk.status === 'mitigated'
                  ? 'var(--color-success)'
                  : risk.status === 'open'
                    ? 'var(--color-error)'
                    : 'var(--color-text-muted)',
            }}
          >
            {(risk.status || 'open').charAt(0).toUpperCase() + (risk.status || 'open').slice(1)}
          </span>
        ),
      },
      {
        key: 'author',
        label: 'Author',
        width: '120px',
        visible: visibleColumns.author,
        render: (risk) => (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {risk.author || 'Unassigned'}
          </span>
        ),
      },
      {
        key: 'mitigation',
        label: 'Mitigation',
        minWidth: '200px',
        visible: visibleColumns.mitigation,
        render: (risk) => <MarkdownCell content={risk.mitigation || '-'} />,
      },
      {
        key: 'contingency',
        label: 'Contingency',
        minWidth: '200px',
        visible: visibleColumns.contingency,
        render: (risk) => <MarkdownCell content={risk.contingency || '-'} />,
      },
      {
        key: 'created',
        label: 'Created',
        width: '120px',
        visible: visibleColumns.created,
        render: (risk) => (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {risk.dateCreated ? formatDateTime(risk.dateCreated) : '-'}
          </span>
        ),
      },
      // Dynamic Custom Attributes
      ...Object.keys(visibleColumns)
        .filter(
          (key) =>
            ![
              'idTitle',
              'category',
              'probability',
              'impact',
              'severity',
              'status',
              'mitigation',
              'contingency',
              'created',
              'projects',
              'author',
              'revision',
            ].includes(key) && visibleColumns[key]
        )
        .map((key) => {
          const definition = definitions.find((def) => def.id === key);
          return {
            key,
            label: definition?.name || key,
            render: (risk: Risk) => {
              const val = risk.customAttributes?.find((ca) => ca.attributeId === key)?.value;
              return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val?.toString() || '-';
            },
          };
        }),
    ],
    [visibleColumns, getProjectNames, definitions]
  );

  return (
    <BaseArtifactTable
      data={risks}
      columns={columns}
      sortConfig={sortConfig}
      onSortChange={onSortChange}
      onRowClick={onEdit}
      emptyMessage="No risks found. Create one to get started."
    />
  );
};
