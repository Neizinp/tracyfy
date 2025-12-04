import { useState, useEffect } from 'react';
import type { Requirement, UseCase, TestCase, Information, Link, Project, Version } from '../types';
import { gitService } from '../services/gitService';
import { createVersionSnapshot as createVersion, loadVersions } from '../utils/versionManagement';
import { formatDateTime } from '../utils/dateUtils';

import { useNavigate } from 'react-router-dom';

interface UseGitOperationsProps {
    currentProjectId: string;
    projects: Project[];
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
    links: Link[];
    setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;
    setUseCases: (ucs: UseCase[] | ((prev: UseCase[]) => UseCase[])) => void;
    setTestCases: (tcs: TestCase[] | ((prev: TestCase[]) => TestCase[])) => void;
    setInformation: (info: Information[] | ((prev: Information[]) => Information[])) => void;
    setLinks: (links: Link[] | ((prev: Link[]) => Link[])) => void;
}

export function useGitOperations({
    currentProjectId,
    projects,
    requirements,
    useCases,
    testCases,
    information,
    links,
    setRequirements,
    setUseCases,
    setTestCases,
    setInformation,
    setLinks
}: UseGitOperationsProps) {
    const navigate = useNavigate();
    const [versions, setVersions] = useState<Version[]>([]);

    // Load versions for current project
    useEffect(() => {
        setVersions(loadVersions(currentProjectId));
    }, [currentProjectId]);

    // Create version snapshot whenever data changes (debounced)
    useEffect(() => {
        const timer = setTimeout(async () => {
            const newVersion = await createVersion(
                currentProjectId,
                projects.find(p => p.id === currentProjectId)?.name || 'Unknown Project',
                'Auto-save',
                'auto-save',
                requirements,
                useCases,
                testCases,
                information,
                links,
                gitService
            );
            setVersions(prev => [newVersion, ...prev].slice(0, 50));
        }, 2000); // Wait 2 seconds after last change

        return () => clearTimeout(timer);
    }, [requirements, useCases, testCases, information, links, currentProjectId, projects]);

    const handlePendingChangesChange = (_changes: any[]) => {
        // PendingChangesPanel manages its own state, this is just a callback for notifications
    };

    const handleCommitArtifact = async (artifactId: string, type: string, message: string) => {
        try {
            const project = projects.find(p => p.id === currentProjectId);
            if (!project) return;

            // Map singular type to plural folder name
            let folderType: 'requirements' | 'usecases' | 'testcases' | 'information';
            if (type === 'requirement') folderType = 'requirements';
            else if (type === 'usecase') folderType = 'usecases';
            else if (type === 'testcase') folderType = 'testcases';
            else if (type === 'information') folderType = 'information';
            else folderType = type as any;

            await gitService.commitArtifact(folderType, artifactId, message);

            // Refresh pending changes - PendingChangesPanel will auto-refresh via its own polling
        } catch (error) {
            console.error('Failed to commit artifact:', error);
            alert('Failed to commit artifact: ' + error);
        }
    };

    const createBaselineSnapshot = async (message: string, tag: string) => {
        const newVersion = await createVersion(
            currentProjectId,
            projects.find(p => p.id === currentProjectId)?.name || 'Unknown Project',
            message,
            'baseline',
            requirements,
            useCases,
            testCases,
            information,
            links,
            gitService,
            tag
        );
        setVersions(prev => [newVersion, ...prev].slice(0, 50));
    };

    const handleCreateBaseline = async (name?: string) => {
        // If name is not provided (e.g., from BaselineManager), prompt for it
        const baselineName = name || prompt("Enter baseline name:");
        if (!baselineName) return;

        // Create the baseline using the version snapshot mechanism
        await createBaselineSnapshot(baselineName, baselineName);
    };

    const handleViewBaselineHistory = (baselineId: string) => {
        navigate(`/baselines/${baselineId}`);
    };

    const handleRestoreVersion = async (versionId: string) => {
        const version = versions.find(v => v.id === versionId);
        if (version) {
            setRequirements(version.data.requirements);
            setUseCases(version.data.useCases);
            setTestCases(version.data.testCases || []);
            setInformation(version.data.information || []);
            setLinks(version.data.links);
            const newVersion = await createVersion(
                currentProjectId,
                projects.find(p => p.id === currentProjectId)?.name || 'Unknown Project',
                `Restored from ${formatDateTime(version.timestamp)}`,
                'auto-save',
                requirements,
                useCases,
                testCases,
                information,
                links,
                gitService
            );
            setVersions(prev => [newVersion, ...prev].slice(0, 50));
        }
    };

    return {
        handlePendingChangesChange,
        handleCommitArtifact,
        handleCreateBaseline,
        handleViewBaselineHistory,
        handleRestoreVersion,
        createBaselineSnapshot,
        versions,
        setVersions
    };
}
