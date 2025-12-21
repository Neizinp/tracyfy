import React, { useMemo, useCallback } from 'react';
import type { Information, Project, InformationColumnVisibility } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { useProject, useCustomAttributes } from '../app/providers';
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
  const { projects } = useProject();
  const { definitions } = useCustomAttributes();

  const getProjectNames = useCallback(
    (infoId: string) => {
      if (!projects) return '';
      return projects
        .filter((p: Project) => p.informationIds?.includes(infoId))
        .map((p: Project) => p.name)
        .join(', ');
    },
    [projects]
  );

  const columns = useMemo<ColumnDef<Information>[]>(
    () => [
      {
        key: 'idTitle',
        label: 'ID / Title',
        width: '250px',
        render: (info: Information) => (
          <>
            <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '2px' }}>
              {info.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{info.title}</div>
          </>
        ),
      },
      {
        key: 'projects',
        label: 'Project(s)',
        width: '150px',
        visible: visibleColumns.projects,
        sortable: false,
        render: (info) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {getProjectNames(info.id)
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
        key: 'type',
        label: 'Type',
        width: '120px',
        visible: visibleColumns.type,
        render: (info) => (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background: 'rgba(59, 130, 246, 0.1)',
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
              borderRadius: '12px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                info.status === 'approved'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : info.status === 'draft'
                    ? 'rgba(107, 114, 128, 0.1)'
                    : 'rgba(59, 130, 246, 0.1)',
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
        render: (info) => <MarkdownCell content={info.text || info.content || '-'} />,
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
              'projects',
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
    [visibleColumns, getProjectNames, definitions]
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
