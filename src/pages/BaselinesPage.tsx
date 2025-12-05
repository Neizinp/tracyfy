import React from 'react';
import { BaselineManager } from '../components';
import { useFileSystem, useUI } from '../app/providers';

export const BaselinesPage: React.FC = () => {
  const { baselines } = useFileSystem();
  const { setIsVersionHistoryOpen } = useUI();

  const handleCreateBaseline = () => {
    setIsVersionHistoryOpen(true);
  };

  const handleViewBaselineHistory = (baselineId: string) => {
    console.log('View baseline history', baselineId);
    // TODO: Implement navigation to baseline details or open modal
  };

  return (
    <BaselineManager
      baselines={baselines}
      onCreateBaseline={handleCreateBaseline}
      onViewBaseline={handleViewBaselineHistory}
    />
  );
};
