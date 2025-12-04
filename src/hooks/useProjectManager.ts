import { useState, useEffect, useRef } from 'react';
import type { Project } from '../types';
import { gitService } from '../services/gitService';
import { loadProjects, PROJECTS_KEY, CURRENT_PROJECT_KEY } from '../utils/appInitialization';

export const useProjectManager = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const hasInitializedProjects = useRef(false); // Track if projects have been synced with App

    const [initialGlobalState, setInitialGlobalState] = useState<any>(null);

    // Initial data loading
    useEffect(() => {
        const initializeApp = async () => {
            setIsLoading(true);
            try {
                // Run migration to global artifacts storage
                await gitService.migrateToGlobalArtifacts();

                await gitService.init();
                console.log('Git service initialized');

                const { projects: initialProjects, currentProjectId: initialCurrentId, globalState } = loadProjects();
                setProjects(initialProjects);
                setCurrentProjectId(initialCurrentId);
                setInitialGlobalState(globalState);
            } catch (e) {
                console.error("Initialization failed", e);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();
    }, []);

    // Persist projects to localStorage whenever they change
    // BUT skip during initial loading to let App.tsx initialize properly
    useEffect(() => {
        if (isLoading || !hasInitializedProjects.current) {
            return; // Don't save until fully initialized
        }
        if (projects.length > 0) {
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        }
    }, [projects, isLoading]);

    // Persist current project ID whenever it changes
    useEffect(() => {
        if (currentProjectId) {
            localStorage.setItem(CURRENT_PROJECT_KEY, currentProjectId);
        }
    }, [currentProjectId]);

    const handleSwitchProject = (projectId: string) => {
        setCurrentProjectId(projectId);
    };

    const handleCreateProjectSubmit = async (name: string, description: string) => {
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name,
            description,
            requirementIds: [],
            useCaseIds: [],
            testCaseIds: [],
            informationIds: [],
            lastModified: Date.now()
        };

        // Initialize git repository for the new project
        try {
            await gitService.initProject(newProject.name);
            console.log(`Initialized git repository for project: ${newProject.name}`);
        } catch (error) {
            console.error('Failed to initialize git repository:', error);
        }

        setProjects(prev => [...prev, newProject]);
        handleSwitchProject(newProject.id);
        return newProject;
    };

    const handleUpdateProject = (projectId: string, name: string, description: string) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId ? { ...p, name, description, lastModified: Date.now() } : p
        ));
    };

    const handleDeleteProject = (projectId: string) => {
        // Allow deleting the last project - user requested this.
        // if (projects.length <= 1) {
        //     alert("Cannot delete the last project.");
        //     return;
        // }

        const newProjects = projects.filter(p => p.id !== projectId);
        setProjects(newProjects);

        if (newProjects.length > 0) {
            if (currentProjectId === projectId) {
                handleSwitchProject(newProjects[0].id);
            }
        } else {
            // No projects left
            setCurrentProjectId('');
            // Maybe trigger a create project modal or something?
            // For now, just let it be empty, App.tsx might handle it or show empty state.
        }
    };

    const handleResetToDemo = async () => {
        if (!confirm('This will replace all current projects with the Demo Project containing sample data and reload the page. Continue?')) {
            return;
        }

        // Clear Git/FileSystem data
        await gitService.clearData();

        // Clear all storage
        localStorage.clear();

        // Reload the page to trigger demo project creation
        window.location.reload();
    };

    const handleAddToProject = async (
        artifacts: { requirements: string[], useCases: string[], testCases: string[], information: string[] },
        targetProjectId: string = currentProjectId
    ) => {
        setProjects(prev => prev.map(p => {
            if (p.id !== targetProjectId) return p;

            // Add IDs if not already present
            const newReqIds = Array.from(new Set([...p.requirementIds, ...artifacts.requirements]));
            const newUcIds = Array.from(new Set([...p.useCaseIds, ...artifacts.useCases]));
            const newTcIds = Array.from(new Set([...p.testCaseIds, ...artifacts.testCases]));
            const newInfoIds = Array.from(new Set([...p.informationIds, ...artifacts.information]));

            return {
                ...p,
                requirementIds: newReqIds,
                useCaseIds: newUcIds,
                testCaseIds: newTcIds,
                informationIds: newInfoIds,
                lastModified: Date.now()
            };
        }));
    };

    return {
        projects,
        currentProjectId,
        isLoading,
        initialGlobalState,
        handleSwitchProject,
        handleCreateProjectSubmit,
        handleUpdateProject,
        handleDeleteProject,
        handleResetToDemo,
        handleAddToProject,
        setProjects, // Expose for complex updates in App.tsx
        setHasInitializedProjects: (value: boolean) => { hasInitializedProjects.current = value; }
    };
};
