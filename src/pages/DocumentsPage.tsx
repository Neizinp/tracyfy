import React from 'react';
import { DocumentList } from '../components';
import { useDocuments, useUI } from '../app/providers';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';
import type { ArtifactDocument } from '../types';

export const DocumentsPage: React.FC = () => {
  const { documents, handleEdit } = useDocuments();
  const { searchQuery } = useUI();

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
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
