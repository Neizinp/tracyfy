import React, { useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Requirement, ColumnVisibility, Project } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { SortableHeader, sortItems, type SortConfig } from './SortableHeader';

interface DetailedRequirementViewProps {
  requirements: Requirement[];
  onEdit: (requirement: Requirement) => void;
  visibleColumns: ColumnVisibility;
  onColumnVisibilityChange?: (columns: ColumnVisibility) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
  sortConfig?: SortConfig;
  onSortChange?: (key: string) => void;
}

// Memoized Markdown renderer for table cells
const MarkdownCell = React.memo<{ content: string }>(({ content }) => {
  if (!content) return <span>-</span>;

  return (
    <div className="markdown-cell" style={{ fontSize: 'var(--font-size-sm)' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ ...props }) => (
            <h1
              style={{
                fontSize: 'var(--font-size-lg)',
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
                fontSize: 'var(--font-size-base)',
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
                fontSize: 'var(--font-size-sm)',
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
                fontSize: 'var(--font-size-sm)',
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
                  fontSize: 'var(--font-size-sm)',
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
                  fontSize: 'var(--font-size-sm)',
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
                  fontSize: 'var(--font-size-sm)',
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
});
MarkdownCell.displayName = 'MarkdownCell';

// Memoized row component for better performance
const RequirementRow = React.memo<{
  req: Requirement;
  visibleColumns: ColumnVisibility;
  showProjectColumn?: boolean;
  getProjectNames: (reqId: string) => string;
}>(({ req, visibleColumns, showProjectColumn, getProjectNames }) => {
  const tdStyle: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'top' };

  return (
    <>
      <td style={tdStyle}>
        <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '4px' }}>
          {req.id}
        </div>
        <div style={{ color: 'var(--color-text-primary)' }}>{req.title}</div>
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
          {req.revision || '01'}
        </span>
      </td>
      {showProjectColumn && (
        <td style={tdStyle}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {getProjectNames(req.id)
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
        <td style={tdStyle}>
          <MarkdownCell content={req.description} />
        </td>
      )}
      {visibleColumns.text && (
        <td style={tdStyle}>
          <MarkdownCell content={req.text || '-'} />
        </td>
      )}
      {visibleColumns.rationale && (
        <td style={tdStyle}>
          <MarkdownCell content={req.rationale || '-'} />
        </td>
      )}
      {visibleColumns.author && (
        <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{req.author || '-'}</td>
      )}
      {visibleColumns.verification && (
        <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>
          {req.verificationMethod || '-'}
        </td>
      )}
      {visibleColumns.priority && (
        <td style={tdStyle}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                req.priority === 'high'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : req.priority === 'medium'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(16, 185, 129, 0.1)',
              color:
                req.priority === 'high'
                  ? 'var(--color-error)'
                  : req.priority === 'medium'
                    ? 'var(--color-warning)'
                    : 'var(--color-success)',
            }}
          >
            {req.priority.charAt(0).toUpperCase() + req.priority.slice(1)}
          </span>
        </td>
      )}
      {visibleColumns.status && (
        <td style={tdStyle}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              background:
                req.status === 'approved'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : req.status === 'draft'
                    ? 'rgba(107, 114, 128, 0.1)'
                    : 'rgba(59, 130, 246, 0.1)',
              color:
                req.status === 'approved'
                  ? 'var(--color-success)'
                  : req.status === 'draft'
                    ? 'var(--color-text-muted)'
                    : 'var(--color-info)',
            }}
          >
            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
          </span>
        </td>
      )}
      {visibleColumns.comments && (
        <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{req.comments || '-'}</td>
      )}
      {visibleColumns.created && (
        <td style={{ ...tdStyle, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
          {formatDateTime(req.dateCreated)}
        </td>
      )}
      {visibleColumns.approved && (
        <td style={{ ...tdStyle, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
          {req.approvalDate ? formatDateTime(req.approvalDate) : '-'}
        </td>
      )}
    </>
  );
});
RequirementRow.displayName = 'RequirementRow';

export const DetailedRequirementView: React.FC<DetailedRequirementViewProps> = ({
  requirements,
  onEdit,
  visibleColumns,
  showProjectColumn,
  projects,
  sortConfig,
  onSortChange,
}) => {
  // Memoize sorted requirements to avoid re-sorting on every render
  const sortedRequirements = useMemo(
    () => sortItems(requirements, sortConfig),
    [requirements, sortConfig]
  );

  const getProjectNames = (reqId: string) => {
    if (!projects) return '';
    return projects
      .filter((p) => p.requirementIds.includes(reqId))
      .map((p) => p.name)
      .join(', ');
  };

  // Empty state
  if (requirements.length === 0) {
    return (
      <div
        style={{
          background: 'var(--color-bg-primary)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          padding: '32px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        No requirements found.
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
        data={sortedRequirements}
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
            <SortableHeader
              label="Rev"
              sortKey="revision"
              currentSort={sortConfig}
              onSort={onSortChange || (() => {})}
              style={{ width: '60px' }}
            />
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
        )}
        itemContent={(_index, req) => (
          <RequirementRow
            req={req}
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
          TableRow: ({ item: req, ...props }) => (
            <tr
              {...props}
              onClick={() => onEdit(req)}
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
