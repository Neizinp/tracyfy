import React from 'react';
import { RiskList } from '../components/RiskList';
import { useFileSystem } from '../app/providers/FileSystemProvider';
import { useUI } from '../app/providers';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

export const RisksPage: React.FC = () => {
  const { risks } = useFileSystem();
  const { searchQuery, setIsRiskModalOpen, riskColumnVisibility } = useUI();

  const { sortedData, sortConfig, handleSortChange } = useArtifactFilteredData(risks, searchQuery, [
    'id',
    'title',
    'description',
    'category',
    'status',
  ]);

  const handleEditRisk = () => {
    // UI currently manages editing via a separate global state if needed,
    // but for now we just open the modal.
    setIsRiskModalOpen(true);
  };

  return (
    <RiskList
      risks={sortedData}
      onEdit={handleEditRisk}
      visibleColumns={riskColumnVisibility}
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
