import React, { useMemo } from 'react';
import type { TestCase, TestCaseColumnVisibility } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { useCustomAttributes } from '../app/providers';
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
  const { definitions } = useCustomAttributes();

  const columns = useMemo<ColumnDef<TestCase>[]>(
    () => [
      {
        key: 'idTitle',
        label: 'ID / Title',
        width: '280px',
        minWidth: '240px',
        render: (tc: TestCase) => (
          <>
            <div className="tf-mono" style={{ color: 'var(--color-accent)', marginBottom: '2px' }}>
              {tc.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{tc.title}</div>
          </>
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
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--color-info-bg)',
                  color: 'var(--color-info)',
                  border: '1px solid var(--color-info-bg)',
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
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                tc.priority === 'high'
                  ? 'var(--color-error-bg)'
                  : tc.priority === 'medium'
                    ? 'var(--color-warning-bg)'
                    : 'var(--color-success-bg)',
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
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                tc.status === 'approved' || tc.status === 'passed'
                  ? 'var(--color-success-bg)'
                  : tc.status === 'draft'
                    ? 'var(--color-bg-hover)'
                    : tc.status === 'failed'
                      ? 'var(--color-error-bg)'
                      : 'var(--color-info-bg)',
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
    [visibleColumns, definitions]
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
