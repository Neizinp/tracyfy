import { useAppHandlers as useAppHandlersHook } from '../../hooks/useAppHandlers';
import { useImportExport, useUI } from '../providers';
import { useAppProjects } from './useAppProjects';
import { useAppArtifacts } from './useAppArtifacts';
import { useAppGit } from './useAppGit';
import type { Project } from '../../types';

export function useAppHandlers() {
    const ui = useUI();
    const { projects, currentProjectId, addToProject: handleAddToProjectInternal } = useAppProjects();
    const artifacts = useAppArtifacts();
    const git = useAppGit();
    const importExport = useImportExport();

    // Get base handlers from existing hook
    const appHandlers = useAppHandlersHook({
        projects,
        currentProjectId,
        requirements: artifacts.local.requirements,
        useCases: artifacts.local.useCases,
        testCases: artifacts.local.testCases,
        information: artifacts.local.information,
        links: artifacts.local.links,
        globalRequirements: artifacts.global.requirements,
        globalUseCases: artifacts.global.useCases,
        globalTestCases: artifacts.global.testCases,
        globalInformation: artifacts.global.information,
        setRequirements: artifacts.setters.requirements,
        setUseCases: artifacts.setters.useCases,
        setTestCases: artifacts.setters.testCases,
        setInformation: artifacts.setters.information,
        setLinks: artifacts.setters.links,
        setVersions: git.setVersions,
        handleAddToProjectInternal,
        setGlobalLibrarySelection: ui.setGlobalLibrarySelection,
        setActiveLibraryTab: ui.setActiveLibraryTab,
        setIsLibraryPanelOpen: ui.setIsLibraryPanelOpen,
        setIsNewRequirementModalOpen: ui.setIsNewRequirementModalOpen,
        setSelectedRequirementId: ui.setSelectedRequirementId,
        setIsLinkModalOpen: ui.setIsLinkModalOpen,
        setEditingRequirement: ui.setEditingRequirement,
        setIsEditRequirementModalOpen: ui.setIsEditRequirementModalOpen,
    });

    return {
        // Base handlers
        ...appHandlers,

        // Import/Export
        onExport: importExport.handleExport,
        onImport: importExport.handleImport,
        onImportExcel: importExport.handleImportExcel,

        // Project actions
        onCreateProject: () => ui.setIsCreateProjectModalOpen(true),
        onOpenProjectSettings: (project: Project) => {
            ui.setProjectToEdit(project);
            ui.setIsProjectSettingsOpen(true);
        },
        onAddToProject: async (ids: string[]) => {
            const reqIds = ids.filter(id => artifacts.global.requirements.some(r => r.id === id));
            const ucIds = ids.filter(id => artifacts.global.useCases.some(u => u.id === id));
            const tcIds = ids.filter(id => artifacts.global.testCases.some(t => t.id === id));
            const infoIds = ids.filter(id => artifacts.global.information.some(i => i.id === id));

            await appHandlers.handleAddToProject({
                requirements: reqIds,
                useCases: ucIds,
                testCases: tcIds,
                information: infoIds
            });

            // Clear selection after adding
            ui.setGlobalLibrarySelection(new Set());
        },
    };
}
