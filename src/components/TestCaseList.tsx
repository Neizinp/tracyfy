import React, { useMemo, useCallback } from 'react';
import type { TestCase, TestCaseColumnVisibility } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { useProject, useCustomAttributes } from '../app/providers';
import { BaseArtifactTable, MarkdownCell } from './index';
import type { ColumnDef } from './BaseArtifactTable';
import type { SortConfig } from './SortableHeader';

interface TestCaseListProps {
  testCases: TestCase[];
  onEdit: (testCase: TestCase) => void;
  visibleColumns: TestCaseColumnVisibility;
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
}

export const TestCaseList: React.FC<TestCaseListProps> = ({
  testCases,
  onEdit,
  visibleColumns,
  sortConfig,
  onSortChange,
}) => {
  const { projects } = useProject();
  const { definitions } = useCustomAttributes();

  const getProjectNames = useCallback(
    (tcId: string) => {
      if (!projects) return '';
      return projects
        .filter((p) => p.testCaseIds?.includes(tcId))
        .map((p) => p.name)
        .join(', ');
    },
    [projects]
  );

  const columns = useMemo<ColumnDef<TestCase>[]>(
    () => [
      {
        key: 'idTitle',
        label: 'ID / Title',
        width: '250px',
        render: (tc: TestCase) => (
          <>
            <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '2px' }}>
              {tc.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{tc.title}</div>
          </>
        ),
      },
      {
        key: 'projects',
        label: 'Project(s)',
        width: '150px',
        visible: visibleColumns.projects,
        sortable: false,
        render: (tc) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {getProjectNames(tc.id)
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
        key: 'requirements',
        label: 'Requirements',
        width: '150px',
        visible: visibleColumns.requirements,
        render: (tc) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {tc.requirementIds?.map((id) => (
              <span
                key={id}
                style={{
                  fontSize: 'var(--font-size-xs)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: 'var(--color-info)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                {id}
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        minWidth: '200px',
        visible: visibleColumns.description,
        render: (tc) => <MarkdownCell content={tc.description || '-'} />,
      },
      {
        key: 'priority',
        label: 'Priority',
        width: '100px',
        visible: visibleColumns.priority,
        render: (tc) => (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                tc.priority === 'high'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : tc.priority === 'medium'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(16, 185, 129, 0.1)',
              color:
                tc.priority === 'high'
                  ? 'var(--color-error)'
                  : tc.priority === 'medium'
                    ? 'var(--color-warning)'
                    : 'var(--color-success)',
            }}
          >
            {(tc.priority || 'medium').charAt(0).toUpperCase() + (tc.priority || 'medium').slice(1)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '100px',
        visible: visibleColumns.status,
        render: (tc) => (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                tc.status === 'approved' || tc.status === 'passed'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : tc.status === 'draft'
                    ? 'rgba(107, 114, 128, 0.1)'
                    : tc.status === 'failed'
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(59, 130, 246, 0.1)',
              color:
                tc.status === 'approved' || tc.status === 'passed'
                  ? 'var(--color-success)'
                  : tc.status === 'draft'
                    ? 'var(--color-text-muted)'
                    : tc.status === 'failed'
                      ? 'var(--color-error)'
                      : 'var(--color-info)',
            }}
          >
            {(tc.status || 'draft').charAt(0).toUpperCase() + (tc.status || 'draft').slice(1)}
          </span>
        ),
      },
      {
        key: 'author',
        label: 'Author',
        width: '120px',
        visible: visibleColumns.author,
        render: (tc) => (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {tc.author || 'Unassigned'}
          </span>
        ),
      },
      {
        key: 'lastRun',
        label: 'Last Run',
        width: '150px',
        visible: visibleColumns.lastRun,
        render: (tc) => (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {tc.lastRun ? formatDateTime(tc.lastRun) : 'Never'}
          </span>
        ),
      },
      {
        key: 'created',
        label: 'Created',
        width: '120px',
        visible: visibleColumns.created,
        render: (tc) => (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {tc.dateCreated ? formatDateTime(tc.dateCreated) : '-'}
          </span>
        ),
      },
      // Dynamic Custom Attributes
      ...Object.keys(visibleColumns)
        .filter(
          (key) =>
            ![
              'idTitle',
              'description',
              'requirements',
              'priority',
              'status',
              'lastRun',
              'created',
              'projects',
            ].includes(key) && visibleColumns[key]
        )
        .map((key) => {
          const definition = definitions.find((def) => def.id === key);
          return {
            key,
            label: definition?.name || key,
            render: (tc: TestCase) => {
              const val = tc.customAttributes?.find((ca) => ca.attributeId === key)?.value;
              return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val?.toString() || '-';
            },
          };
        }),
    ],
    [visibleColumns, getProjectNames, definitions]
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
