import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { TestCase, Project } from '../types';
import { formatDateTime } from '../utils/dateUtils';

interface TestCaseListProps {
  testCases: TestCase[];
  onEdit: (testCase: TestCase) => void;
  onDelete: (id: string) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
}

export const TestCaseList: React.FC<TestCaseListProps> = ({
  testCases,
  onEdit,
  onDelete,
  showProjectColumn,
  projects,
}) => {
  const getStatusColor = (status: TestCase['status']) => {
    switch (status) {
      case 'passed':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#6ee7b7' };
      case 'failed':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' };
      case 'blocked':
        return { bg: 'rgba(251, 191, 36, 0.2)', text: '#fcd34d' };
      case 'approved':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#93c5fd' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.2)', text: 'var(--color-text-secondary)' };
    }
  };

  const getProjectNames = (tcId: string) => {
    if (!projects) return '';
    return projects
      .filter((p) => p.testCaseIds.includes(tcId))
      .map((p) => p.name)
      .join(', ');
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  width: '180px',
                }}
              >
                ID / Title
              </th>
              {showProjectColumn && (
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    width: '150px',
                  }}
                >
                  Project(s)
                </th>
              )}
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  width: '250px',
                }}
              >
                Description
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  width: '150px',
                }}
              >
                Requirements
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  width: '100px',
                }}
              >
                Priority
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  width: '100px',
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  width: '140px',
                }}
              >
                Last Run
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  width: '80px',
                }}
              ></th>
            </tr>
          </thead>
          <tbody>
            {testCases.length === 0 ? (
              <tr>
                <td
                  colSpan={showProjectColumn ? 8 : 7}
                  style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}
                >
                  No test cases found.
                </td>
              </tr>
            ) : (
              testCases.map((tc) => (
                <tr
                  key={tc.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-card)')
                  }
                >
                  <td style={{ padding: '12px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            color: 'var(--color-accent-light)',
                            fontWeight: 500,
                          }}
                        >
                          {tc.id}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0 4px',
                            borderRadius: '3px',
                            backgroundColor: 'var(--color-bg-tertiary)',
                            color: 'var(--color-text-muted)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          v{tc.revision || '01'}
                        </span>
                      </div>
                      <span style={{ fontWeight: 500 }}>{tc.title}</span>
                    </div>
                  </td>
                  {showProjectColumn && (
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {getProjectNames(tc.id)
                          .split(', ')
                          .map(
                            (name, i) =>
                              name && (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-secondary)',
                                  }}
                                >
                                  {name}
                                </span>
                              )
                          )}
                      </div>
                    </td>
                  )}
                  <td
                    style={{
                      padding: '12px',
                      verticalAlign: 'top',
                      fontSize: '0.875rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {tc.description}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      verticalAlign: 'top',
                      fontSize: '0.875rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {tc.requirementIds.length > 0 ? tc.requirementIds.join(', ') : '-'}
                  </td>
                  <td style={{ padding: '12px', verticalAlign: 'top' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor:
                          tc.priority === 'high'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(148, 163, 184, 0.2)',
                        color: tc.priority === 'high' ? '#fca5a5' : 'var(--color-text-secondary)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tc.priority}
                    </span>
                  </td>
                  <td style={{ padding: '12px', verticalAlign: 'top' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: getStatusColor(tc.status).bg,
                        color: getStatusColor(tc.status).text,
                        textTransform: 'capitalize',
                      }}
                    >
                      {tc.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      verticalAlign: 'top',
                      fontSize: '0.875rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {tc.lastRun ? formatDateTime(tc.lastRun) : '-'}
                  </td>
                  <td style={{ padding: '12px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => onEdit(tc)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(tc.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
