import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { BaselineRevisionHistory } from '../components';
import { useGit, useProject } from '../app/providers';

export const BaselineHistoryPage: React.FC = () => {
    const { baselines } = useGit();
    const { projects } = useProject();
    const { baselineId } = useParams<{ baselineId: string }>();

    if (!baselineId) {
        return <Navigate to="/baselines" replace />;
    }

    const currentBaseline = baselines.find(b => b.id === baselineId);

    if (!currentBaseline) {
        return <Navigate to="/baselines" replace />;
    }

    const project = projects.find(p => p.id === currentBaseline.projectId);
    const previousBaseline = baselines.find(
        b => b.version === (parseInt(currentBaseline.version || '0') - 1).toString().padStart(2, '0')
    ) || null;

    return (
        <BaselineRevisionHistory
            projectName={project?.name || 'Unknown'}
            currentBaseline={currentBaseline}
            previousBaseline={previousBaseline}
            onViewArtifact={(artifactId, commitHash) => {
                console.log('View artifact', artifactId, commitHash);
                alert(`View artifact ${artifactId} at ${commitHash} - Not implemented yet`);
            }}
        />
    );
};
