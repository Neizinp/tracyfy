import React from 'react';
import { FileText } from 'lucide-react';
import type { TestCase, Project, TestCaseColumnVisibility } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { getPriorityStyle, getStatusStyle, badgeStyle } from '../utils/artifactStyles';

interface TestCaseListProps {
  testCases: TestCase[];
  onEdit: (testCase: TestCase) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
  visibleColumns: TestCaseColumnVisibility;
}

export const TestCaseList: React.FC<TestCaseListProps> = ({
  testCases,
  onEdit,
  showProjectColumn,
  projects,
  visibleColumns,
}) => {
  const getProjectNames = (tcId: string) => {
    if (!projects) return '';
    return projects
      .filter((p) => p.testCaseIds.includes(tcId))
      .map((p) => p.name)
      .join(', ');
  };

  const getVisibleColumnCount = () => {
    let count = 2; // ID/Title + Rev always visible
    if (showProjectColumn) count++;
    if (visibleColumns.description) count++;
    if (visibleColumns.requirements) count++;
    if (visibleColumns.priority) count++;
    if (visibleColumns.status) count++;
    if (visibleColumns.lastRun) count++;
    return count;
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

  const thStyle = {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
  };

  const tdStyle = {
    padding: '12px 16px',
    verticalAlign: 'top' as const,
    fontSize: 'var(--font-size-sm)',
  };

  return (
    <div
      style={{
        background: 'var(--color-bg-primary)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}
        >
          <thead>
            <tr
              style={{
                background: 'var(--color-bg-secondary)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <th style={{ ...thStyle, width: '250px' }}>ID / Title</th>
              <th style={{ ...thStyle, width: '60px' }}>Rev</th>
              {showProjectColumn && <th style={{ ...thStyle, width: '150px' }}>Project(s)</th>}
              {visibleColumns.description && (
                <th style={{ ...thStyle, minWidth: '200px' }}>Description</th>
              )}
              {visibleColumns.requirements && (
                <th style={{ ...thStyle, width: '150px' }}>Requirements</th>
              )}
              {visibleColumns.priority && <th style={{ ...thStyle, width: '100px' }}>Priority</th>}
              {visibleColumns.status && <th style={{ ...thStyle, width: '100px' }}>Status</th>}
              {visibleColumns.lastRun && <th style={{ ...thStyle, width: '140px' }}>Last Run</th>}
            </tr>
          </thead>
          <tbody>
            {testCases.length === 0 ? (
              <tr>
                <td
                  colSpan={getVisibleColumnCount()}
                  style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}
                >
                  No test cases found.
                </td>
              </tr>
            ) : (
              testCases.map((tc) => (
                <tr
                  key={tc.id}
                  onClick={() => onEdit(tc)}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-card)')
                  }
                >
                  <td style={tdStyle}>
                    <div
                      style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '4px' }}
                    >
                      {tc.id}
                    </div>
                    <div style={{ color: 'var(--color-text-primary)' }}>{tc.title}</div>
                  </td>
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
                    <td
                      style={{ ...tdStyle, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}
                    >
                      {tc.lastRun ? formatDateTime(tc.lastRun) : '-'}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
