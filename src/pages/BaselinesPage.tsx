import React from 'react';
import { BaselineManager } from '../components';
import type { ProjectBaseline } from '../types';

interface BaselinesPageProps {
    baselines: ProjectBaseline[];
    onCreateBaseline: () => void;
    onViewBaseline: (baselineId: string) => void;
}

export const BaselinesPage: React.FC<BaselinesPageProps> = ({
    baselines,
    onCreateBaseline,
    onViewBaseline
}) => {
    return (
        <BaselineManager
            baselines={baselines}
            onCreateBaseline={onCreateBaseline}
            onViewBaseline={onViewBaseline}
        />
    );
};
