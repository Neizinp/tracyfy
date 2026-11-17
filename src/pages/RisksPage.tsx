import React, { useCallback } from 'react';
import { RiskList } from '../components/RiskList';
import { useAppStore } from '../state';
import type { Risk } from '../types';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

export const RisksPage: React.FC = () => {
  const risks = useAppStore((s) => s.artifacts.risk);
  const editArtifact = useAppStore((s) => s.editArtifact);
  const handleEdit = useCallback((item: Risk) => editArtifact('risk', item), [editArtifact]);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const riskColumnVisibility = useAppStore((s) => s.columnVisibility.risk);

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
