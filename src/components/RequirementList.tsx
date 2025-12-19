import React, { useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Requirement, ColumnVisibility, Project } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { BaseArtifactTable, type ColumnDef } from './BaseArtifactTable';
import type { SortConfig } from './SortableHeader';

interface RequirementListProps {
  requirements: Requirement[];
  onEdit: (requirement: Requirement) => void;
  visibleColumns: ColumnVisibility;
  showProjectColumn?: boolean;
  projects?: Project[];
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
}

const MarkdownCell = React.memo<{ content: string }>(({ content }) => {
  if (!content) return <span>-</span>;
  return (
    <div className="markdown-cell" style={{ fontSize: 'var(--font-size-sm)' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  );
});

export const RequirementList: React.FC<RequirementListProps> = ({
  requirements,
  onEdit,
  visibleColumns,
  showProjectColumn,
  projects,
  sortConfig,
  onSortChange,
}) => {
  const getProjectNames = useCallback(
    (reqId: string) => {
      if (!projects) return '';
      return projects
        .filter((p) => p.requirementIds.includes(reqId))
        .map((p) => p.name)
        .join(', ');
    },
    [projects]
  );

  const columns = useMemo<ColumnDef<Requirement>[]>(
    () => [
      {
        key: 'id',
        label: 'ID / Title',
        width: '250px',
        render: (req) => (
          <>
            <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '4px' }}>
              {req.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{req.title}</div>
          </>
        ),
      },
      {
        key: 'revision',
        label: 'Rev',
        width: '60px',
        render: (req) => (
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
        ),
      },
      {
        key: 'projects',
        label: 'Project(s)',
        width: '150px',
        visible: showProjectColumn,
        sortable: false,
        render: (req) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {getProjectNames(req.id)
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
        key: 'description',
        label: 'Description',
        minWidth: '300px',
        visible: visibleColumns.description,
        render: (req) => <MarkdownCell content={req.description} />,
      },
      {
        key: 'text',
        label: 'Requirement Text',
        minWidth: '300px',
        visible: visibleColumns.text,
        render: (req) => <MarkdownCell content={req.text || '-'} />,
      },
      {
        key: 'rationale',
        label: 'Rationale',
        minWidth: '200px',
        visible: visibleColumns.rationale,
        render: (req) => <MarkdownCell content={req.rationale || '-'} />,
      },
      {
        key: 'author',
        label: 'Author',
        width: '120px',
        visible: visibleColumns.author,
        render: (req) => (
          <span style={{ color: 'var(--color-text-secondary)' }}>{req.author || '-'}</span>
        ),
      },
      {
        key: 'priority',
        label: 'Priority',
        width: '100px',
        visible: visibleColumns.priority,
        render: (req) => (
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
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '100px',
        visible: visibleColumns.status,
        render: (req) => (
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
        ),
      },
      {
        key: 'dateCreated',
        label: 'Created',
        width: '120px',
        visible: visibleColumns.created,
        render: (req) => (
          <span style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            {formatDateTime(req.dateCreated)}
          </span>
        ),
      },
    ],
    [visibleColumns, showProjectColumn, getProjectNames]
  );

  return (
    <BaseArtifactTable
      data={requirements}
      columns={columns}
      sortConfig={sortConfig}
      onSortChange={onSortChange}
      onRowClick={onEdit}
      emptyMessage="No requirements found."
    />
  );
};
