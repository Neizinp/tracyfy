import React, { useMemo, useCallback } from 'react';
import type { Information, InformationColumnVisibility, Project } from '../types';
import { BaseArtifactTable, type ColumnDef } from './BaseArtifactTable';
import type { SortConfig } from './SortableHeader';

interface InformationListProps {
  information: Information[];
  onEdit: (info: Information) => void;
  visibleColumns: InformationColumnVisibility;
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
}

export const InformationList: React.FC<InformationListProps> = ({
  information,
  onEdit,
  visibleColumns,
  sortConfig,
  onSortChange,
  showProjectColumn,
  projects,
}) => {
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
        key: 'id',
        label: 'ID / Title',
        width: '250px',
        render: (info: Information) => (
          <>
            <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '4px' }}>
              {info.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{info.title}</div>
          </>
        ),
      },
      {
        key: 'text',
        label: 'Content',
        minWidth: '400px',
        visible: visibleColumns.text,
        render: (info: Information) => (
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {info.text}
          </div>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        width: '120px',
        render: (info: Information) => (
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
            {info.type}
          </span>
        ),
      }, // Added missing comma here
      {
        key: 'projects',
        label: 'Project(s)',
        width: '150px',
        visible: showProjectColumn,
        sortable: false,
        render: (info) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {getProjectNames(info.id)
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
    ],
    [visibleColumns, showProjectColumn, getProjectNames]
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
