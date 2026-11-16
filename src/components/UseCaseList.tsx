import React, { useMemo } from 'react';
import type { UseCase, UseCaseColumnVisibility } from '../types';
import { useCustomAttributes } from '../app/providers';
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
  const { definitions } = useCustomAttributes();

  const columns = useMemo<ColumnDef<UseCase>[]>(
    () => [
      {
        key: 'idTitle',
        label: 'ID / Title',
        width: '280px',
        minWidth: '240px',
        render: (uc: UseCase) => (
          <>
            <div className="tf-mono" style={{ color: 'var(--color-accent)', marginBottom: '2px' }}>
              {uc.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{uc.title}</div>
          </>
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
              borderRadius: 'var(--radius-xs)',
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
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                uc.priority === 'high'
                  ? 'var(--color-error-bg)'
                  : uc.priority === 'medium'
                    ? 'var(--color-warning-bg)'
                    : 'var(--color-success-bg)',
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
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                uc.status === 'approved'
                  ? 'var(--color-success-bg)'
                  : uc.status === 'draft'
                    ? 'var(--color-bg-hover)'
                    : 'var(--color-info-bg)',
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
    [visibleColumns, definitions]
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
