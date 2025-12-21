import React, { useMemo, useCallback } from 'react';
import type { ArtifactDocument } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { BaseArtifactTable, type ColumnDef } from './BaseArtifactTable';
import type { SortConfig } from './SortableHeader';
import { useProject, useCustomAttributes } from '../app/providers';
import type { DocumentColumnVisibility } from '../types/ui';

interface DocumentListProps {
  documents: ArtifactDocument[];
  onEdit: (document: ArtifactDocument) => void;
  visibleColumns: DocumentColumnVisibility;
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onEdit,
  visibleColumns,
  sortConfig,
  onSortChange,
}) => {
  const { projects } = useProject();
  const { definitions } = useCustomAttributes();

  // NOTE: ArtifactDocument has projectId field directly.
  const getDocProjectName = useCallback(
    (projectId: string) => {
      return projects.find((p) => p.id === projectId)?.name || '-';
    },
    [projects]
  );

  const columns = useMemo<ColumnDef<ArtifactDocument>[]>(
    () => [
      {
        key: 'idTitle',
        label: 'ID / Title',
        width: '250px',
        render: (doc: ArtifactDocument) => (
          <>
            <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '2px' }}>
              {doc.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{doc.title}</div>
          </>
        ),
      },
      {
        key: 'projects',
        label: 'Project(s)',
        width: '150px',
        visible: visibleColumns.projects,
        render: (doc) => (
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {getDocProjectName(doc.projectId)}
          </span>
        ),
      },
      {
        key: 'revision',
        label: 'Rev',
        width: '60px',
        visible: visibleColumns.revision,
        render: (doc) => (
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
            {doc.revision || '01'}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '100px',
        visible: visibleColumns.status,
        render: (doc) => (
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor:
                doc.status === 'approved'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : doc.status === 'review'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(107, 114, 128, 0.1)',
              color:
                doc.status === 'approved'
                  ? 'var(--color-success)'
                  : doc.status === 'review'
                    ? 'var(--color-warning)'
                    : 'var(--color-text-secondary)',
              border: `1px solid ${
                doc.status === 'approved'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : doc.status === 'review'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(107, 114, 128, 0.2)'
              }`,
              textTransform: 'capitalize',
            }}
          >
            {doc.status || 'Draft'}
          </span>
        ),
      },
      {
        key: 'author',
        label: 'Author',
        width: '120px',
        visible: visibleColumns.author,
        render: (doc) => (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {doc.author || 'Not specified'}
          </span>
        ),
      },
      {
        key: 'structure',
        label: 'Items',
        width: '100px',
        visible: visibleColumns.structure,
        render: (doc) => (
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {doc.structure?.length || 0} items
          </span>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        minWidth: '200px',
        visible: visibleColumns.description,
        render: (doc) => (
          <div
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
              maxHeight: '3em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {doc.description || '-'}
          </div>
        ),
      },
      {
        key: 'created',
        label: 'Created',
        width: '150px',
        visible: visibleColumns.created,
        render: (doc) => (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {formatDateTime(doc.dateCreated)}
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
              'structure',
              'created',
              'revision',
              'projects',
              'status',
              'author',
            ].includes(key) && visibleColumns[key]
        )
        .map((key) => {
          const definition = definitions.find((def) => def.id === key);
          return {
            key,
            label: definition?.name || key,
            render: (doc: ArtifactDocument) => {
              const val = doc.customAttributes?.find((ca) => ca.attributeId === key)?.value;
              return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val?.toString() || '-';
            },
          };
        }),
    ],
    [visibleColumns, getDocProjectName, definitions]
  );

  return (
    <BaseArtifactTable
      data={documents}
      columns={columns}
      sortConfig={sortConfig}
      onSortChange={onSortChange}
      onRowClick={onEdit}
      emptyMessage="No documents found."
    />
  );
};
