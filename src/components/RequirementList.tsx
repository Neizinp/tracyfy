import React, { useMemo } from 'react';
import type { Requirement, ColumnVisibility } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { useCustomAttributes } from '../app/providers';
import { BaseArtifactTable, type ColumnDef } from './BaseArtifactTable';
import { MarkdownCell } from './index';
import type { SortConfig } from './SortableHeader';

interface RequirementListProps {
  requirements: Requirement[];
  onEdit: (requirement: Requirement) => void;
  visibleColumns: ColumnVisibility;
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
}

export const RequirementList: React.FC<RequirementListProps> = ({
  requirements,
  onEdit,
  visibleColumns,
  sortConfig,
  onSortChange,
}) => {
  const { definitions } = useCustomAttributes();

  const columns = useMemo<ColumnDef<Requirement>[]>(
    () => [
      {
        key: 'idTitle',
        label: 'ID / Title',
        width: '280px',
        minWidth: '240px',
        render: (req: Requirement) => (
          <>
            <div className="tf-mono" style={{ color: 'var(--color-accent)', marginBottom: '2px' }}>
              {req.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{req.title}</div>
          </>
        ),
      },
      {
        key: 'revision',
        label: 'Rev',
        width: '60px',
        render: (req) => (
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {req.revision || '01'}
          </span>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        minWidth: '300px',
        visible: visibleColumns.description,
        render: (req) => <MarkdownCell content={req.description || ''} />,
      },
      {
        key: 'text',
        label: 'Requirement Text',
        minWidth: '300px',
        visible: visibleColumns.text,
        render: (req) => <MarkdownCell content={req.text || '-'} />,
      },
      {
        key: 'rationale',
        label: 'Rationale',
        minWidth: '200px',
        visible: visibleColumns.rationale,
        render: (req) => <MarkdownCell content={req.rationale || '-'} />,
      },
      {
        key: 'verification',
        label: 'Verification',
        minWidth: '200px',
        visible: visibleColumns.verification,
        render: (req) => <MarkdownCell content={req.verificationMethod || '-'} />,
      },
      {
        key: 'author',
        label: 'Author',
        width: '120px',
        visible: visibleColumns.author,
        render: (req) => (
          <span style={{ color: 'var(--color-text-secondary)' }}>{req.author || '-'}</span>
        ),
      },
      {
        key: 'priority',
        label: 'Priority',
        width: '100px',
        visible: visibleColumns.priority,
        render: (req) => (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                req.priority === 'high'
                  ? 'var(--color-error-bg)'
                  : req.priority === 'medium'
                    ? 'var(--color-warning-bg)'
                    : 'var(--color-success-bg)',
              color:
                req.priority === 'high'
                  ? 'var(--color-error)'
                  : req.priority === 'medium'
                    ? 'var(--color-warning)'
                    : 'var(--color-success)',
            }}
          >
            {(req.priority || 'medium').charAt(0).toUpperCase() +
              (req.priority || 'medium').slice(1)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '100px',
        visible: visibleColumns.status,
        render: (req) => (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                req.status === 'approved'
                  ? 'var(--color-success-bg)'
                  : req.status === 'draft'
                    ? 'var(--color-bg-hover)'
                    : 'var(--color-info-bg)',
              color:
                req.status === 'approved'
                  ? 'var(--color-success)'
                  : req.status === 'draft'
                    ? 'var(--color-text-muted)'
                    : 'var(--color-info)',
            }}
          >
            {(req.status || 'draft').charAt(0).toUpperCase() + (req.status || 'draft').slice(1)}
          </span>
        ),
      },
      {
        key: 'comments',
        label: 'Comments',
        width: '150px',
        visible: visibleColumns.comments,
        render: (req) => (
          <span style={{ color: 'var(--color-text-secondary)' }}>{req.comments || '-'}</span>
        ),
      },
      {
        key: 'dateCreated',
        label: 'Created',
        width: '120px',
        visible: visibleColumns.created,
        render: (req) => (
          <span style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            {formatDateTime(req.dateCreated)}
          </span>
        ),
      },
      {
        key: 'approved',
        label: 'Approved',
        width: '100px',
        visible: visibleColumns.approved,
        render: (req) => (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background: req.status === 'approved' ? 'var(--color-success-bg)' : 'transparent',
              color: req.status === 'approved' ? 'var(--color-success)' : 'var(--color-text-muted)',
            }}
          >
            {req.status === 'approved' ? 'Yes' : 'No'}
          </span>
        ),
      },
      // Dynamic Custom Attributes
      ...Object.keys(visibleColumns)
        .filter(
          (key) =>
            ![
              'idTitle',
              'id', // include 'id' just in case
              'description',
              'text',
              'rationale',
              'author',
              'verification',
              'priority',
              'status',
              'comments',
              'created',
              'approved',
            ].includes(key) && visibleColumns[key]
        )
        .map((key) => {
          const definition = definitions.find((def) => def.id === key);
          return {
            key,
            label: definition?.name || key,
            render: (req: Requirement) => {
              const val = req.customAttributes?.find((ca) => ca.attributeId === key)?.value;
              return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val?.toString() || '-';
            },
          };
        }),
    ],
    [visibleColumns, definitions]
  );

  return (
    <BaseArtifactTable
      data={requirements}
      columns={columns}
      sortConfig={sortConfig}
      onSortChange={onSortChange}
      onRowClick={onEdit}
      emptyMessage="No requirements found."
    />
  );
};
