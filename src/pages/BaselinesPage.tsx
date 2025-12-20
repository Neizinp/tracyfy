import React from 'react';
import { debug } from '../utils/debug';
import { BaselineManager } from '../components';
import { useBaselines, useUI } from '../app/providers';

export const BaselinesPage: React.FC = () => {
  const { baselines, deleteBaseline } = useBaselines();
  const { setIsVersionHistoryOpen } = useUI();

  const handleCreateBaseline = () => {
    setIsVersionHistoryOpen(true);
  };

  const handleViewBaselineHistory = (baselineId: string) => {
    debug.log('View baseline history', baselineId);
    // TODO: Implement navigation to baseline details or open modal
  };

  return (
    <BaselineManager
      baselines={baselines}
      onCreateBaseline={handleCreateBaseline}
      onViewBaseline={handleViewBaselineHistory}
      onDeleteBaseline={deleteBaseline}
    />
  );
};
