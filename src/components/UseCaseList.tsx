import React, { useMemo, useCallback } from 'react';
import type { UseCase, Project, UseCaseColumnVisibility } from '../types';
import { useProject, useCustomAttributes } from '../app/providers';
import { BaseArtifactTable, MarkdownCell } from './index';
import type { ColumnDef } from './BaseArtifactTable';
import type { SortConfig } from './SortableHeader';

interface UseCaseListProps {
  useCases: UseCase[];
  onEdit: (useCase: UseCase) => void;
  visibleColumns: UseCaseColumnVisibility;
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
}

export const UseCaseList: React.FC<UseCaseListProps> = ({
  useCases,
  onEdit,
  visibleColumns,
  sortConfig,
  onSortChange,
}) => {
  const { projects } = useProject();
  const { definitions } = useCustomAttributes();

  const getProjectNames = useCallback(
    (ucId: string) => {
      if (!projects) return '';
      return projects
        .filter((p: Project) => p.useCaseIds?.includes(ucId))
        .map((p: Project) => p.name)
        .join(', ');
    },
    [projects]
  );

  const columns = useMemo<ColumnDef<UseCase>[]>(
    () => [
      {
        key: 'idTitle',
        label: 'ID / Title',
        width: '250px',
        render: (uc: UseCase) => (
          <>
            <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '2px' }}>
              {uc.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{uc.title}</div>
          </>
        ),
      },
      {
        key: 'projects',
        label: 'Project(s)',
        width: '150px',
        visible: visibleColumns.projects,
        sortable: false,
        render: (uc) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {getProjectNames(uc.id)
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
        key: 'revision',
        label: 'Rev',
        width: '60px',
        visible: visibleColumns.revision,
        render: (uc) => (
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
            {uc.revision || '01'}
          </span>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        minWidth: '200px',
        visible: visibleColumns.description,
        render: (uc) => <MarkdownCell content={uc.description || '-'} />,
      },
      {
        key: 'actor',
        label: 'Actor',
        width: '120px',
        visible: visibleColumns.actor,
        render: (uc) => (
          <span style={{ color: 'var(--color-text-secondary)' }}>{uc.actor || '-'}</span>
        ),
      },
      {
        key: 'author',
        label: 'Author',
        width: '120px',
        visible: visibleColumns.author,
        render: (uc) => (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {uc.author || 'Unassigned'}
          </span>
        ),
      },
      {
        key: 'priority',
        label: 'Priority',
        width: '100px',
        visible: visibleColumns.priority,
        render: (uc) => (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                uc.priority === 'high'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : uc.priority === 'medium'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(16, 185, 129, 0.1)',
              color:
                uc.priority === 'high'
                  ? 'var(--color-error)'
                  : uc.priority === 'medium'
                    ? 'var(--color-warning)'
                    : 'var(--color-success)',
            }}
          >
            {(uc.priority || 'medium').charAt(0).toUpperCase() + (uc.priority || 'medium').slice(1)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '100px',
        visible: visibleColumns.status,
        render: (uc) => (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                uc.status === 'approved'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : uc.status === 'draft'
                    ? 'rgba(107, 114, 128, 0.1)'
                    : 'rgba(59, 130, 246, 0.1)',
              color:
                uc.status === 'approved'
                  ? 'var(--color-success)'
                  : uc.status === 'draft'
                    ? 'var(--color-text-muted)'
                    : 'var(--color-info)',
            }}
          >
            {(uc.status || 'draft').charAt(0).toUpperCase() + (uc.status || 'draft').slice(1)}
          </span>
        ),
      },
      {
        key: 'preconditions',
        label: 'Preconditions',
        minWidth: '200px',
        visible: visibleColumns.preconditions,
        render: (uc) => <MarkdownCell content={uc.preconditions || uc.precondition || '-'} />,
      },
      {
        key: 'mainFlow',
        label: 'Main Flow',
        minWidth: '300px',
        visible: visibleColumns.mainFlow,
        render: (uc) => <MarkdownCell content={uc.mainFlow || '-'} />,
      },
      {
        key: 'alternativeFlows',
        label: 'Alt Flows',
        minWidth: '300px',
        visible: visibleColumns.alternativeFlows,
        render: (uc) => <MarkdownCell content={uc.alternativeFlows || '-'} />,
      },
      {
        key: 'postconditions',
        label: 'Postconditions',
        minWidth: '200px',
        visible: visibleColumns.postconditions,
        render: (uc) => <MarkdownCell content={uc.postconditions || uc.postcondition || '-'} />,
      },
      // Dynamic Custom Attributes
      ...Object.keys(visibleColumns)
        .filter(
          (key) =>
            ![
              'idTitle',
              'revision',
              'description',
              'actor',
              'priority',
              'status',
              'preconditions',
              'mainFlow',
              'alternativeFlows',
              'postconditions',
              'projects',
              'author',
              'created',
            ].includes(key) && visibleColumns[key]
        )
        .map((key) => {
          const definition = definitions.find((def) => def.id === key);
          return {
            key,
            label: definition?.name || key,
            render: (uc: UseCase) => {
              const val = uc.customAttributes?.find((ca) => ca.attributeId === key)?.value;
              return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val?.toString() || '-';
            },
          };
        }),
    ],
    [visibleColumns, getProjectNames, definitions]
  );

  return (
    <BaseArtifactTable
      data={useCases}
      columns={columns}
      sortConfig={sortConfig}
      onSortChange={onSortChange}
      onRowClick={onEdit}
      emptyMessage="No use cases found. Create one to get started."
    />
  );
};
