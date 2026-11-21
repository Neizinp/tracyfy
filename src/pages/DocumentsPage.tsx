import React, { useCallback } from 'react';
import { DocumentList } from '../components';
import { useAppStore } from '../state';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';
import type { ArtifactDocument } from '../types';

export const DocumentsPage: React.FC = () => {
  const documents = useAppStore((s) => s.artifacts.document);
  const editArtifact = useAppStore((s) => s.editArtifact);
  const handleEdit = useCallback(
    (item: ArtifactDocument) => editArtifact('document', item),
    [editArtifact]
  );
  const searchQuery = useAppStore((s) => s.searchQuery);
  const documentColumnVisibility = useAppStore((s) => s.columnVisibility.document);

  const { sortedData, sortConfig, handleSortChange } = useArtifactFilteredData<ArtifactDocument>(
    documents,
    {
      searchQuery,
      searchFields: ['id', 'title', 'description'],
    }
  );

  return (
    <DocumentList
      documents={sortedData}
      onEdit={handleEdit}
      visibleColumns={documentColumnVisibility}
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
