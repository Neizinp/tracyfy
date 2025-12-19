import React, { useMemo, useCallback } from 'react';
import type { TestCase, TestCaseColumnVisibility, Project } from '../types';
import { BaseArtifactTable, type ColumnDef } from './BaseArtifactTable';
import type { SortConfig } from './SortableHeader';

interface TestCaseListProps {
  testCases: TestCase[];
  onEdit: (testCase: TestCase) => void;
  visibleColumns: TestCaseColumnVisibility;
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
}

export const TestCaseList: React.FC<TestCaseListProps> = ({
  testCases,
  onEdit,
  visibleColumns,
  sortConfig,
  onSortChange,
  showProjectColumn,
  projects,
}) => {
  const getProjectNames = useCallback(
    (tcId: string) => {
      if (!projects) return '';
      return projects
        .filter((p: Project) => p.testCaseIds?.includes(tcId))
        .map((p: Project) => p.name)
        .join(', ');
    },
    [projects]
  );

  const columns = useMemo<ColumnDef<TestCase>[]>(
    () => [
      {
        key: 'id',
        label: 'ID / Title',
        width: '250px',
        render: (tc) => (
          <>
            <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '4px' }}>
              {tc.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{tc.title}</div>
          </>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        minWidth: '300px',
        visible: visibleColumns.description,
      },
      {
        key: 'projects',
        label: 'Project(s)',
        width: '150px',
        visible: showProjectColumn,
        sortable: false,
        render: (tc) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {getProjectNames(tc.id)
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
        key: 'status',
        label: 'Status',
        width: '120px',
        visible: visibleColumns.status,
        render: (tc) => (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                tc.status === 'passed'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : tc.status === 'failed'
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(107, 114, 128, 0.1)',
              color:
                tc.status === 'passed'
                  ? 'var(--color-success)'
                  : tc.status === 'failed'
                    ? 'var(--color-error)'
                    : 'var(--color-text-muted)',
            }}
          >
            {tc.status.charAt(0).toUpperCase() + tc.status.slice(1)}
          </span>
        ),
      },
    ],
    [visibleColumns, showProjectColumn, getProjectNames]
  );

  return (
    <BaseArtifactTable
      data={testCases}
      columns={columns}
      sortConfig={sortConfig}
      onSortChange={onSortChange}
      onRowClick={onEdit}
      emptyMessage="No test cases found. Create one to get started."
    />
  );
};
