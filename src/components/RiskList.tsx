import React, { useMemo } from 'react';
import type { Risk, RiskColumnVisibility } from '../types';
import { useCustomAttributes } from '../hooks/useCustomAttributes';
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
  const { definitions } = useCustomAttributes();

  const columns = useMemo<ColumnDef<Risk>[]>(
    () => [
      {
        key: 'idTitle',
        label: 'ID / Title',
        width: '280px',
        minWidth: '240px',
        render: (risk: Risk) => (
          <>
            <div className="tf-mono" style={{ color: 'var(--color-accent)', marginBottom: '2px' }}>
              {risk.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{risk.title}</div>
          </>
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
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background: 'var(--color-info-bg)',
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
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                background:
                  sev >= 15
                    ? 'var(--color-error-bg)'
                    : sev >= 8
                      ? 'var(--color-warning-bg)'
                      : 'var(--color-success-bg)',
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
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                risk.status === 'mitigated'
                  ? 'var(--color-success-bg)'
                  : risk.status === 'open'
                    ? 'var(--color-error-bg)'
                    : 'var(--color-bg-hover)',
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
    [visibleColumns, definitions]
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
