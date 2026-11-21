import React, { useCallback } from 'react';
import { InformationList } from '../components';
import { useAppStore } from '../state';
import type { Information } from '../types';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

export const InformationPage: React.FC = () => {
  const information = useAppStore((s) => s.artifacts.information);
  const editArtifact = useAppStore((s) => s.editArtifact);
  const handleEditInformation = useCallback(
    (item: Information) => editArtifact('information', item),
    [editArtifact]
  );
  const searchQuery = useAppStore((s) => s.searchQuery);
  const informationColumnVisibility = useAppStore((s) => s.columnVisibility.information);

  const { sortedData, sortConfig, handleSortChange } = useArtifactFilteredData(information, {
    searchQuery,
    searchFields: ['id', 'title', 'text'],
  });

  return (
    <InformationList
      information={sortedData}
      onEdit={handleEditInformation}
      visibleColumns={informationColumnVisibility}
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
