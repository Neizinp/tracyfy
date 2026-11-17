import React, { useMemo } from 'react';
import type { Information, InformationColumnVisibility } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { useCustomAttributes } from '../hooks/useCustomAttributes';
import { BaseArtifactTable, MarkdownCell } from './index';
import type { ColumnDef } from './BaseArtifactTable';
import type { SortConfig } from './SortableHeader';

interface InformationListProps {
  information: Information[];
  onEdit: (info: Information) => void;
  visibleColumns: InformationColumnVisibility;
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
}

export const InformationList: React.FC<InformationListProps> = ({
  information,
  onEdit,
  visibleColumns,
  sortConfig,
  onSortChange,
}) => {
  const { definitions } = useCustomAttributes();

  const columns = useMemo<ColumnDef<Information>[]>(
    () => [
      {
        key: 'idTitle',
        label: 'ID / Title',
        width: '280px',
        minWidth: '240px',
        render: (info: Information) => (
          <>
            <div className="tf-mono" style={{ color: 'var(--color-accent)', marginBottom: '2px' }}>
              {info.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{info.title}</div>
          </>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        width: '120px',
        visible: visibleColumns.type,
        render: (info) => (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background: 'var(--color-info-bg)',
              color: 'var(--color-info)',
              textTransform: 'capitalize',
            }}
          >
            {info.type || 'General'}
          </span>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        minWidth: '200px',
        visible: visibleColumns.description,
        render: (info) => <MarkdownCell content={info.description || '-'} />,
      },
      {
        key: 'status',
        label: 'Status',
        width: '120px',
        visible: visibleColumns.status,
        render: (info) => (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                info.status === 'approved'
                  ? 'var(--color-success-bg)'
                  : info.status === 'draft'
                    ? 'var(--color-bg-hover)'
                    : 'var(--color-info-bg)',
              color:
                info.status === 'approved'
                  ? 'var(--color-success)'
                  : info.status === 'draft'
                    ? 'var(--color-text-muted)'
                    : 'var(--color-info)',
              textTransform: 'capitalize',
            }}
          >
            {info.status || 'Draft'}
          </span>
        ),
      },
      {
        key: 'author',
        label: 'Author',
        width: '120px',
        visible: visibleColumns.author,
        render: (info) => (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {info.author || 'Unassigned'}
          </span>
        ),
      },
      {
        key: 'text',
        label: 'Content',
        minWidth: '300px',
        visible: visibleColumns.text,
        render: (info) => <MarkdownCell content={info.text || '-'} />,
      },
      {
        key: 'created',
        label: 'Created',
        width: '120px',
        visible: visibleColumns.created,
        render: (info) => (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {info.dateCreated ? formatDateTime(info.dateCreated) : '-'}
          </span>
        ),
      },
      // Dynamic Custom Attributes
      ...Object.keys(visibleColumns)
        .filter(
          (key) =>
            ![
              'idTitle',
              'type',
              'text',
              'created',
              'author',
              'status',
              'revision',
              'description',
            ].includes(key) && visibleColumns[key]
        )
        .map((key) => {
          const definition = definitions.find((def) => def.id === key);
          return {
            key,
            label: definition?.name || key,
            render: (info: Information) => {
              const val = info.customAttributes?.find((ca) => ca.attributeId === key)?.value;
              return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val?.toString() || '-';
            },
          };
        }),
    ],
    [visibleColumns, definitions]
  );

  return (
    <BaseArtifactTable
      data={information}
      columns={columns}
      sortConfig={sortConfig}
      onSortChange={onSortChange}
      onRowClick={onEdit}
      emptyMessage="No information artifacts found. Create one to get started."
    />
  );
};
