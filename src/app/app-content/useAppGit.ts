import { useMemo } from 'react';
import { useGit } from '../providers';
import { useAppProjects } from './useAppProjects';
import type { ProjectBaseline, Version } from '../../types';

export function useAppGit() {
    const git = useGit();
    const { currentProjectId } = useAppProjects();

    // Derived baselines
    const baselines = useMemo(() =>
        git.versions
            .filter((v: Version) => v.type === 'baseline')
            .map((v: Version) => ({
                id: v.id,
                projectId: currentProjectId,
                version: v.tag || '01',
                name: v.message,
                description: '',
                timestamp: v.timestamp,
                artifactCommits: {},
                addedArtifacts: [],
                removedArtifacts: []
            } as ProjectBaseline)),
        [git.versions, currentProjectId]
    );

    return {
        versions: git.versions,
        baselines,
        operations: {
            onPendingChangesChange: git.handlePendingChangesChange,
            onCommitArtifact: git.handleCommitArtifact,
            onCreateBaseline: git.handleCreateBaseline,
            onViewBaselineHistory: git.handleViewBaselineHistory,
            onRestoreVersion: git.handleRestoreVersion,
        },
        setVersions: git.setVersions,
    };
}
