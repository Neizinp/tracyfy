import React, { useMemo } from 'react';
import type { ArtifactDocument } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { BaseArtifactTable, type ColumnDef } from './BaseArtifactTable';
import type { SortConfig } from './SortableHeader';

interface DocumentListProps {
  documents: ArtifactDocument[];
  onEdit: (document: ArtifactDocument) => void;
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onEdit,
  sortConfig,
  onSortChange,
}) => {
  const columns = useMemo<ColumnDef<ArtifactDocument>[]>(
    () => [
      {
        key: 'id',
        label: 'ID / Title',
        width: '250px',
        render: (doc) => (
          <>
            <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '4px' }}>
              {doc.id}
            </div>
            <div style={{ color: 'var(--color-text-primary)' }}>{doc.title}</div>
          </>
        ),
      },
      {
        key: 'revision',
        label: 'Rev',
        width: '60px',
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
        key: 'structure',
        label: 'Items',
        width: '100px',
        render: (doc) => (
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {doc.structure?.length || 0} items
          </span>
        ),
      },
      {
        key: 'dateCreated',
        label: 'Created',
        width: '150px',
        render: (doc) => (
          <span style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            {formatDateTime(doc.dateCreated)}
          </span>
        ),
      },
    ],
    []
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
