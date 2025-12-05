import React from 'react';
import { BaselineManager } from '../components';
import { useGit } from '../app/providers';

export const BaselinesPage: React.FC = () => {
    const { baselines, handleCreateBaseline, handleViewBaselineHistory } = useGit();

    return (
        <BaselineManager
            baselines={baselines}
            onCreateBaseline={handleCreateBaseline}
            onViewBaseline={handleViewBaselineHistory}
        />
    );
};
