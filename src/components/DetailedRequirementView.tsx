import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Requirement, ColumnVisibility, Project } from '../types';
import { formatDateTime } from '../utils/dateUtils';

interface DetailedRequirementViewProps {
  requirements: Requirement[];
  onEdit: (requirement: Requirement) => void;
  visibleColumns: ColumnVisibility;
  onColumnVisibilityChange?: (columns: ColumnVisibility) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
}

// Compact Markdown renderer for table cells
const MarkdownCell: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return <span>-</span>;

  return (
    <div className="markdown-cell" style={{ fontSize: '0.875rem' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Compact styling for table cells
          h1: ({ ...props }) => (
            <h1
              style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                margin: '4px 0',
                color: 'var(--color-text-primary)',
              }}
              {...props}
            />
          ),
          h2: ({ ...props }) => (
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                margin: '4px 0',
                color: 'var(--color-text-primary)',
              }}
              {...props}
            />
          ),
          h3: ({ ...props }) => (
            <h3
              style={{
                fontSize: '0.95rem',
                fontWeight: 'bold',
                margin: '3px 0',
                color: 'var(--color-text-primary)',
              }}
              {...props}
            />
          ),
          h4: ({ ...props }) => (
            <h4
              style={{
                fontSize: '0.9rem',
                fontWeight: 'bold',
                margin: '2px 0',
                color: 'var(--color-text-primary)',
              }}
              {...props}
            />
          ),
          p: ({ ...props }) => (
            <p style={{ margin: '2px 0', color: 'var(--color-text-secondary)' }} {...props} />
          ),
          ul: ({ ...props }) => (
            <ul
              style={{ margin: '4px 0', paddingLeft: '16px', color: 'var(--color-text-secondary)' }}
              {...props}
            />
          ),
          ol: ({ ...props }) => (
            <ol
              style={{ margin: '4px 0', paddingLeft: '16px', color: 'var(--color-text-secondary)' }}
              {...props}
            />
          ),
          li: ({ ...props }) => (
            <li style={{ margin: '1px 0', color: 'var(--color-text-secondary)' }} {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              style={{
                borderLeft: '2px solid var(--color-accent)',
                paddingLeft: '8px',
                margin: '4px 0',
                fontStyle: 'italic',
                color: 'var(--color-text-muted)',
              }}
              {...props}
            />
          ),
          code: ({ className, children, ...props }) => {
            const inline = !className;
            return inline ? (
              <code
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontSize: '0.85em',
                  color: 'var(--color-accent-light)',
                }}
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                style={{
                  display: 'block',
                  backgroundColor: 'var(--color-bg-secondary)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.85em',
                  overflowX: 'auto',
                  margin: '4px 0',
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ ...props }) => <pre style={{ margin: '4px 0', overflowX: 'auto' }} {...props} />,
          table: ({ ...props }) => (
            <div style={{ overflowX: 'auto', margin: '4px 0' }}>
              <table
                style={{
                  fontSize: '0.8rem',
                  borderCollapse: 'collapse',
                  border: '1px solid var(--color-border)',
                }}
                {...props}
              />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead style={{ backgroundColor: 'var(--color-bg-secondary)' }} {...props} />
          ),
          th: ({ ...props }) => (
            <th
              style={{
                border: '1px solid var(--color-border)',
                padding: '4px 8px',
                textAlign: 'left',
              }}
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td
              style={{ border: '1px solid var(--color-border)', padding: '4px 8px' }}
              {...props}
            />
          ),
          a: ({ ...props }) => (
            <a
              style={{ color: 'var(--color-accent-light)', textDecoration: 'underline' }}
              {...props}
            />
          ),
          strong: ({ ...props }) => (
            <strong style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }} {...props} />
          ),
          em: ({ ...props }) => <em style={{ fontStyle: 'italic' }} {...props} />,
          hr: ({ ...props }) => (
            <hr
              style={{
                margin: '8px 0',
                border: 'none',
                borderTop: '1px solid var(--color-border)',
              }}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const DetailedRequirementView: React.FC<DetailedRequirementViewProps> = ({
  requirements,
  onEdit,
  visibleColumns,
  showProjectColumn,
  projects,
}) => {
  const getVisibleColumnCount = () => {
    let count = 1; // ID/Title always visible
    if (visibleColumns.description) count++;
    if (visibleColumns.text) count++;
    if (visibleColumns.rationale) count++;
    if (visibleColumns.author) count++;
    if (visibleColumns.verification) count++;
    if (visibleColumns.priority) count++;
    if (visibleColumns.status) count++;
    if (visibleColumns.comments) count++;
    if (visibleColumns.created) count++;
    if (visibleColumns.approved) count++;
    if (showProjectColumn) count++;
    return count;
  };

  const getProjectNames = (reqId: string) => {
    if (!projects) return '';
    return projects
      .filter((p) => p.requirementIds.includes(reqId))
      .map((p) => p.name)
      .join(', ');
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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr
              style={{
                background: 'var(--color-bg-secondary)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  width: '250px',
                }}
              >
                ID / Title
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  width: '60px',
                }}
              >
                Rev
              </th>
              {showProjectColumn && (
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    width: '150px',
                  }}
                >
                  Project(s)
                </th>
              )}
              {visibleColumns.description && (
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    minWidth: '300px',
                  }}
                >
                  Description
                </th>
              )}
              {visibleColumns.text && (
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    minWidth: '300px',
                  }}
                >
                  Requirement Text
                </th>
              )}
              {visibleColumns.rationale && (
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    minWidth: '200px',
                  }}
                >
                  Rationale
                </th>
              )}
              {visibleColumns.author && (
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    width: '120px',
                  }}
                >
                  Author
                </th>
              )}
              {visibleColumns.verification && (
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    width: '150px',
                  }}
                >
                  Verification
                </th>
              )}
              {visibleColumns.priority && (
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    width: '100px',
                  }}
                >
                  Priority
                </th>
              )}
              {visibleColumns.status && (
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    width: '100px',
                  }}
                >
                  Status
                </th>
              )}
              {visibleColumns.comments && (
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    minWidth: '200px',
                  }}
                >
                  Comments
                </th>
              )}
              {visibleColumns.created && (
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    width: '120px',
                  }}
                >
                  Created
                </th>
              )}
              {visibleColumns.approved && (
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    width: '120px',
                  }}
                >
                  Approved
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {requirements.length === 0 ? (
              <tr>
                <td
                  colSpan={getVisibleColumnCount()}
                  style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}
                >
                  No requirements found.
                </td>
              </tr>
            ) : (
              requirements.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => onEdit(req)}
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
                  <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <div
                      style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '4px' }}
                    >
                      {req.id}
                    </div>
                    <div style={{ color: 'var(--color-text-primary)' }}>{req.title}</div>
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {req.revision || '01'}
                    </span>
                  </td>
                  {showProjectColumn && (
                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '4px',
                        }}
                      >
                        {getProjectNames(req.id)
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
                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                      <MarkdownCell content={req.description} />
                    </td>
                  )}
                  {visibleColumns.text && (
                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                      <MarkdownCell content={req.text || '-'} />
                    </td>
                  )}
                  {visibleColumns.rationale && (
                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                      <MarkdownCell content={req.rationale || '-'} />
                    </td>
                  )}
                  {visibleColumns.author && (
                    <td
                      style={{
                        padding: '12px 16px',
                        verticalAlign: 'top',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {req.author || '-'}
                    </td>
                  )}
                  {visibleColumns.verification && (
                    <td
                      style={{
                        padding: '12px 16px',
                        verticalAlign: 'top',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {req.verificationMethod || '-'}
                    </td>
                  )}
                  {visibleColumns.priority && (
                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background:
                            req.priority === 'high'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : req.priority === 'medium'
                                ? 'rgba(245, 158, 11, 0.1)'
                                : 'rgba(16, 185, 129, 0.1)',
                          color:
                            req.priority === 'high'
                              ? '#ef4444'
                              : req.priority === 'medium'
                                ? '#f59e0b'
                                : '#10b981',
                        }}
                      >
                        {req.priority.charAt(0).toUpperCase() + req.priority.slice(1)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background:
                            req.status === 'approved'
                              ? 'rgba(16, 185, 129, 0.1)'
                              : req.status === 'draft'
                                ? 'rgba(107, 114, 128, 0.1)'
                                : 'rgba(59, 130, 246, 0.1)',
                          color:
                            req.status === 'approved'
                              ? '#10b981'
                              : req.status === 'draft'
                                ? '#6b7280'
                                : '#3b82f6',
                        }}
                      >
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.comments && (
                    <td
                      style={{
                        padding: '12px 16px',
                        verticalAlign: 'top',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {req.comments || '-'}
                    </td>
                  )}
                  {visibleColumns.created && (
                    <td
                      style={{
                        padding: '12px 16px',
                        verticalAlign: 'top',
                        color: 'var(--color-text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatDateTime(req.dateCreated)}
                    </td>
                  )}
                  {visibleColumns.approved && (
                    <td
                      style={{
                        padding: '12px 16px',
                        verticalAlign: 'top',
                        color: 'var(--color-text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {req.approvalDate ? formatDateTime(req.approvalDate) : '-'}
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
