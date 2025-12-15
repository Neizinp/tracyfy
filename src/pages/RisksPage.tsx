import React, { useState, useMemo, useCallback } from 'react';
import { RiskList } from '../components/RiskList';
import { useFileSystem } from '../app/providers/FileSystemProvider';
import { useUI } from '../app/providers';
import { type SortConfig, toggleSort } from '../components/SortableHeader';
import type { Risk } from '../types';

export const RisksPage: React.FC = () => {
  const { risks } = useFileSystem();
  const { searchQuery, setIsRiskModalOpen, riskColumnVisibility } = useUI();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });
  const [, setEditingRisk] = useState<Risk | null>(null);

  const handleSortChange = useCallback((key: string) => {
    setSortConfig((prev) => toggleSort(prev, key));
  }, []);

  // Filter risks based on search query
  const filteredRisks = useMemo(() => {
    return risks.filter((risk) => {
      if (risk.isDeleted) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        risk.id.toLowerCase().includes(query) ||
        risk.title.toLowerCase().includes(query) ||
        risk.description.toLowerCase().includes(query) ||
        risk.category.toLowerCase().includes(query) ||
        risk.status.toLowerCase().includes(query)
      );
    });
  }, [risks, searchQuery]);

  const handleEditRisk = useCallback(
    (risk: Risk) => {
      setEditingRisk(risk);
      // For now, open the modal - we'll need to pass the risk to a global state
      // This will be handled by a useRisks hook similar to useInformation
      setIsRiskModalOpen(true);
    },
    [setIsRiskModalOpen]
  );

  return (
    <RiskList
      risks={filteredRisks}
      onEdit={handleEditRisk}
      visibleColumns={riskColumnVisibility}
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
    />
  );
};
