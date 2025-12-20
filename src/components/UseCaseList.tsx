import React, { useMemo, useCallback } from 'react';
import type { UseCase, Requirement, Project, UseCaseColumnVisibility } from '../types';
import { getPriorityStyle, getStatusStyle, badgeStyle } from '../utils/artifactStyles';
import { BaseArtifactTable, type ColumnDef } from './BaseArtifactTable';
import type { SortConfig } from './SortableHeader';

interface UseCaseListProps {
  useCases: UseCase[];
  requirements: Requirement[];
  onEdit: (useCase: UseCase) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
  visibleColumns: UseCaseColumnVisibility;
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
}

export const UseCaseList: React.FC<UseCaseListProps> = ({
  useCases,
  requirements,
  onEdit,
  showProjectColumn,
  projects,
  visibleColumns,
  sortConfig,
  onSortChange,
}) => {
  const getLinkedRequirements = useCallback(
    (useCaseId: string): Requirement[] => {
      return requirements.filter((req) => req.useCaseIds?.includes(useCaseId));
    },
    [requirements]
  );

  const getProjectNames = useCallback(
    (ucId: string) => {
      if (!projects) return '';
      return projects
        .filter((p) => p.useCaseIds.includes(ucId))
        .map((p) => p.name)
        .join(', ');
    },
    [projects]
  );

  const columns = useMemo<ColumnDef<UseCase>[]>(
    () => [
      {
        key: 'id',
        label: 'ID / Title',
        width: '250px',
        render: (uc) => {
          const linkedReqs = getLinkedRequirements(uc.id);
          return (
            <>
              <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '4px' }}>
                {uc.id}
              </div>
              <div style={{ color: 'var(--color-text-primary)' }}>{uc.title}</div>
              {linkedReqs.length > 0 && (
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    marginTop: '4px',
                  }}
                >
                  {linkedReqs.length} linked req{linkedReqs.length !== 1 ? 's' : ''}
                </div>
              )}
            </>
          );
        },
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
        key: 'projects',
        label: 'Project(s)',
        width: '150px',
        visible: showProjectColumn,
        sortable: false,
        render: (uc) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {getProjectNames(uc.id)
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
        key: 'actor',
        label: 'Actor',
        width: '120px',
        visible: visibleColumns.actor,
        render: (uc) => (
          <span style={{ color: 'var(--color-text-secondary)' }}>{uc.actor || '-'}</span>
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
              ...badgeStyle,
              backgroundColor: getPriorityStyle(uc.priority || 'medium').bg,
              color: getPriorityStyle(uc.priority || 'medium').text,
            }}
          >
            {uc.priority || 'medium'}
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
              ...badgeStyle,
              backgroundColor: getStatusStyle(uc.status || 'draft').bg,
              color: getStatusStyle(uc.status || 'draft').text,
            }}
          >
            {uc.status || 'draft'}
          </span>
        ),
      },
    ],
    [visibleColumns, showProjectColumn, getProjectNames, getLinkedRequirements]
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
