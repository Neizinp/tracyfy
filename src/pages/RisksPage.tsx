import React from 'react';
import { RiskList } from '../components/RiskList';
import { useRisks, useUI } from '../app/providers';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

export const RisksPage: React.FC = () => {
  const { risks, handleEdit } = useRisks();
  const { searchQuery, riskColumnVisibility } = useUI();

  const { sortedData, sortConfig, handleSortChange } = useArtifactFilteredData(risks, {
    searchQuery,
    searchFields: ['id', 'title', 'description', 'category'],
  });

  return (
    <RiskList
      risks={sortedData}
      onEdit={handleEdit}
      visibleColumns={riskColumnVisibility}
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
