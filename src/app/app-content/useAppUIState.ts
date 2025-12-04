import { useUI } from '../providers';

export function useAppUIState() {
    const ui = useUI();

    return {
        modals: {
            newRequirement: [ui.isNewRequirementModalOpen, ui.setIsNewRequirementModalOpen] as const,
            editRequirement: [ui.isEditRequirementModalOpen, ui.setIsEditRequirementModalOpen] as const,
            link: [ui.isLinkModalOpen, ui.setIsLinkModalOpen] as const,
            useCase: [ui.isUseCaseModalOpen, ui.setIsUseCaseModalOpen] as const,
            trash: [ui.isTrashModalOpen, ui.setIsTrashModalOpen] as const,
            versionHistory: [ui.isVersionHistoryOpen, ui.setIsVersionHistoryOpen] as const,
            projectSettings: [ui.isProjectSettingsOpen, ui.setIsProjectSettingsOpen] as const,
            createProject: [ui.isCreateProjectModalOpen, ui.setIsCreateProjectModalOpen] as const,
            newTestCase: [ui.isNewTestCaseModalOpen, ui.setIsNewTestCaseModalOpen] as const,
            editTestCase: [ui.isEditTestCaseModalOpen, ui.setIsEditTestCaseModalOpen] as const,
            information: [ui.isInformationModalOpen, ui.setIsInformationModalOpen] as const,
            globalLibrary: [ui.isGlobalLibraryModalOpen, ui.setIsGlobalLibraryModalOpen] as const,
        },

        selections: {
            requirementId: [ui.selectedRequirementId, ui.setSelectedRequirementId] as const,
            testCaseId: [ui.selectedTestCaseId, ui.setSelectedTestCaseId] as const,
            information: [ui.selectedInformation, ui.setSelectedInformation] as const,
            editingRequirement: [ui.editingRequirement, ui.setEditingRequirement] as const,
            editingUseCase: [ui.editingUseCase, ui.setEditingUseCase] as const,
            projectToEdit: [ui.projectToEdit, ui.setProjectToEdit] as const,
        },

        library: {
            isOpen: [ui.isLibraryPanelOpen, ui.setIsLibraryPanelOpen] as const,
            activeTab: [ui.activeLibraryTab, ui.setActiveLibraryTab] as const,
            selection: [ui.globalLibrarySelection, ui.setGlobalLibrarySelection] as const,
        },

        columns: {
            visibility: [ui.columnVisibility, ui.setColumnVisibility] as const,
        }
    };
}
