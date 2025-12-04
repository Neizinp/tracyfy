import { useProject } from '../providers';

export function useAppProjects() {
    const {
        projects,
        currentProjectId,
        currentProject,
        isLoading,
        switchProject,
        createProject,
        updateProject,
        deleteProject,
        resetToDemo,
        addToProject
    } = useProject();

    return {
        // State
        projects,
        currentProjectId,
        currentProject,
        isLoading,

        // Operations
        switchProject,
        createProject,
        updateProject,
        deleteProject,
        resetToDemo,
        addToProject
    };
}
