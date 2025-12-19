import React from 'react';
import { InformationList } from '../components';
import { useInformation, useUI } from '../app/providers';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

export const InformationPage: React.FC = () => {
  const { information, handleEditInformation } = useInformation();
  const { searchQuery, informationColumnVisibility } = useUI();

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
