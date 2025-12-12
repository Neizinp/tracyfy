import React, { useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { FileText } from 'lucide-react';
import type { TestCase, Project, TestCaseColumnVisibility } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { getPriorityStyle, getStatusStyle, badgeStyle } from '../utils/artifactStyles';
import { SortableHeader, sortItems, type SortConfig } from './SortableHeader';

interface TestCaseListProps {
  testCases: TestCase[];
  onEdit: (testCase: TestCase) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
  visibleColumns: TestCaseColumnVisibility;
  sortConfig?: SortConfig;
  onSortChange?: (key: string) => void;
}

// Memoized row component
const TestCaseRow = React.memo<{
  tc: TestCase;
  visibleColumns: TestCaseColumnVisibility;
  showProjectColumn?: boolean;
  getProjectNames: (tcId: string) => string;
}>(({ tc, visibleColumns, showProjectColumn, getProjectNames }) => {
  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    verticalAlign: 'top',
    fontSize: 'var(--font-size-sm)',
  };

  return (
    <>
      <td style={tdStyle}>
        <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '4px' }}>
          {tc.id}
        </div>
        <div style={{ color: 'var(--color-text-primary)' }}>{tc.title}</div>
      </td>
      {visibleColumns.revision && (
        <td style={tdStyle}>
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
            {tc.revision || '01'}
          </span>
        </td>
      )}
      {showProjectColumn && (
        <td style={tdStyle}>
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
        </td>
      )}
      {visibleColumns.description && (
        <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>
          {tc.description || '-'}
        </td>
      )}
      {visibleColumns.requirements && (
        <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>
          {tc.requirementIds.length > 0 ? tc.requirementIds.join(', ') : '-'}
        </td>
      )}
      {visibleColumns.priority && (
        <td style={tdStyle}>
          <span
            style={{
              ...badgeStyle,
              backgroundColor: getPriorityStyle(tc.priority).bg,
              color: getPriorityStyle(tc.priority).text,
            }}
          >
            {tc.priority}
          </span>
        </td>
      )}
      {visibleColumns.status && (
        <td style={tdStyle}>
          <span
            style={{
              ...badgeStyle,
              backgroundColor: getStatusStyle(tc.status).bg,
              color: getStatusStyle(tc.status).text,
            }}
          >
            {tc.status}
          </span>
        </td>
      )}
      {visibleColumns.lastRun && (
        <td style={{ ...tdStyle, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {tc.lastRun ? formatDateTime(tc.lastRun) : '-'}
        </td>
      )}
    </>
  );
});
TestCaseRow.displayName = 'TestCaseRow';

export const TestCaseList: React.FC<TestCaseListProps> = ({
  testCases,
  onEdit,
  showProjectColumn,
  projects,
  visibleColumns,
  sortConfig,
  onSortChange,
}) => {
  // Memoize sorted test cases
  const sortedTestCases = useMemo(() => sortItems(testCases, sortConfig), [testCases, sortConfig]);

  const getProjectNames = (tcId: string) => {
    if (!projects) return '';
    return projects
      .filter((p) => p.testCaseIds.includes(tcId))
      .map((p) => p.name)
      .join(', ');
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
  };

  if (testCases.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-xl)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          gap: 'var(--spacing-md)',
        }}
      >
        <FileText size={48} />
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          No test cases found. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--color-bg-primary)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TableVirtuoso
        style={{ flex: 1 }}
        data={sortedTestCases}
        overscan={5}
        fixedHeaderContent={() => (
          <tr
            style={{
              background: 'var(--color-bg-secondary)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <SortableHeader
              label="ID / Title"
              sortKey="id"
              currentSort={sortConfig}
              onSort={onSortChange || (() => {})}
              style={{ width: '250px' }}
            />
            {visibleColumns.revision && (
              <SortableHeader
                label="Rev"
                sortKey="revision"
                currentSort={sortConfig}
                onSort={onSortChange || (() => {})}
                style={{ width: '60px' }}
              />
            )}
            {showProjectColumn && <th style={{ ...thStyle, width: '150px' }}>Project(s)</th>}
            {visibleColumns.description && (
              <th style={{ ...thStyle, minWidth: '200px' }}>Description</th>
            )}
            {visibleColumns.requirements && (
              <th style={{ ...thStyle, width: '150px' }}>Requirements</th>
            )}
            {visibleColumns.priority && (
              <SortableHeader
                label="Priority"
                sortKey="priority"
                currentSort={sortConfig}
                onSort={onSortChange || (() => {})}
                style={{ width: '100px' }}
              />
            )}
            {visibleColumns.status && (
              <SortableHeader
                label="Status"
                sortKey="status"
                currentSort={sortConfig}
                onSort={onSortChange || (() => {})}
                style={{ width: '100px' }}
              />
            )}
            {visibleColumns.lastRun && <th style={{ ...thStyle, width: '140px' }}>Last Run</th>}
          </tr>
        )}
        itemContent={(_index, tc) => (
          <TestCaseRow
            tc={tc}
            visibleColumns={visibleColumns}
            showProjectColumn={showProjectColumn}
            getProjectNames={getProjectNames}
          />
        )}
        components={{
          Table: ({ style, ...props }) => (
            <table
              {...props}
              style={{
                ...style,
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--font-size-sm)',
              }}
            />
          ),
          TableHead: React.forwardRef(({ style, ...props }, ref) => (
            <thead
              ref={ref}
              {...props}
              style={{ ...style, position: 'sticky', top: 0, zIndex: 1 }}
            />
          )),
          TableRow: ({ item: tc, ...props }) => (
            <tr
              {...props}
              onClick={() => onEdit(tc)}
              style={{
                borderBottom: '1px solid var(--color-border)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                backgroundColor: 'var(--color-bg-card)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-card)')}
            />
          ),
        }}
      />
    </div>
  );
};
