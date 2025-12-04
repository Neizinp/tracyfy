import { DndContext, DragOverlay } from '@dnd-kit/core';
import { AppRoutes } from '../routes/AppRoutes';
import { LoadingOverlay } from '../components';
import {
    useAppProjects,
    useAppUIState,
    useAppArtifacts,
    useAppGit,
    useAppDragDrop,
    useAppHandlers
} from './app-content';

export function AppContent() {
    const projectState = useAppProjects();
    const uiState = useAppUIState();
    const artifactState = useAppArtifacts();
    const gitState = useAppGit();
    const dnd = useAppDragDrop();
    const handlers = useAppHandlers();

    if (projectState.isLoading) {
        return <LoadingOverlay isLoading={true} />;
    }

    return (
        <DndContext {...dnd.contextProps}>
            <AppRoutes
                // Project
                projects={projectState.projects}
                currentProjectId={projectState.currentProjectId}
                currentProjectName={projectState.currentProject.name}

                // Artifacts
                requirements={artifactState.local.requirements}
                useCases={artifactState.local.useCases}
                testCases={artifactState.local.testCases}
                information={artifactState.local.information}
                links={artifactState.local.links}
                versions={gitState.versions}
                baselines={gitState.baselines}

                // Global
                globalRequirements={artifactState.global.requirements}
                globalUseCases={artifactState.global.useCases}
                globalTestCases={artifactState.global.testCases}
                globalInformation={artifactState.global.information}

                // UI State
                searchQuery=""
                setSearchQuery={() => { }}
                columnVisibility={uiState.columns.visibility[0]}
                setColumnVisibility={uiState.columns.visibility[1]}
                isLibraryPanelOpen={uiState.library.isOpen[0]}
                setIsLibraryPanelOpen={uiState.library.isOpen[1]}
                activeLibraryTab={uiState.library.activeTab[0]}
                setActiveLibraryTab={uiState.library.activeTab[1]}
                globalLibrarySelection={uiState.library.selection[0]}

                // Modals
                isNewRequirementModalOpen={uiState.modals.newRequirement[0]}
                setIsNewRequirementModalOpen={uiState.modals.newRequirement[1]}
                isLinkModalOpen={uiState.modals.link[0]}
                setIsLinkModalOpen={uiState.modals.link[1]}
                isEditRequirementModalOpen={uiState.modals.editRequirement[0]}
                setIsEditRequirementModalOpen={uiState.modals.editRequirement[1]}
                isUseCaseModalOpen={uiState.modals.useCase[0]}
                setIsUseCaseModalOpen={uiState.modals.useCase[1]}
                isNewTestCaseModalOpen={uiState.modals.newTestCase[0]}
                setIsNewTestCaseModalOpen={uiState.modals.newTestCase[1]}
                isEditTestCaseModalOpen={uiState.modals.editTestCase[0]}
                setIsEditTestCaseModalOpen={uiState.modals.editTestCase[1]}
                isInformationModalOpen={uiState.modals.information[0]}
                setIsInformationModalOpen={uiState.modals.information[1]}
                isVersionHistoryOpen={uiState.modals.versionHistory[0]}
                setIsVersionHistoryOpen={uiState.modals.versionHistory[1]}
                isTrashModalOpen={uiState.modals.trash[0]}
                setIsTrashModalOpen={uiState.modals.trash[1]}
                isProjectSettingsOpen={uiState.modals.projectSettings[0]}
                setIsProjectSettingsOpen={uiState.modals.projectSettings[1]}
                isCreateProjectModalOpen={uiState.modals.createProject[0]}
                setIsCreateProjectModalOpen={uiState.modals.createProject[1]}
                isGlobalLibraryModalOpen={uiState.modals.globalLibrary[0]}
                setIsGlobalLibraryModalOpen={uiState.modals.globalLibrary[1]}

                // Selections
                selectedRequirementId={uiState.selections.requirementId[0]}
                selectedTestCaseId={uiState.selections.testCaseId[0]}
                setSelectedTestCaseId={uiState.selections.testCaseId[1]}
                selectedInformation={uiState.selections.information[0]}
                setSelectedInformation={uiState.selections.information[1]}
                editingRequirement={uiState.selections.editingRequirement[0]}
                setEditingRequirement={uiState.selections.editingRequirement[1]}
                editingUseCase={uiState.selections.editingUseCase[0]}
                setEditingUseCase={uiState.selections.editingUseCase[1]}
                projectToEdit={uiState.selections.projectToEdit[0]}
                setProjectToEdit={uiState.selections.projectToEdit[1]}

                // Setters
                setRequirements={artifactState.setters.requirements}

                // Handlers
                onSwitchProject={projectState.switchProject}
                onCreateProject={handlers.onCreateProject}
                onOpenProjectSettings={handlers.onOpenProjectSettings}
                onExport={handlers.onExport}
                onImport={handlers.onImport}
                onImportExcel={handlers.onImportExcel}
                onResetToDemo={projectState.resetToDemo}
                onPendingChangesChange={gitState.operations.onPendingChangesChange}
                onCommitArtifact={gitState.operations.onCommitArtifact}
                handleGlobalLibrarySelect={handlers.handleGlobalLibrarySelect}
                handleOpenLibrary={handlers.handleOpenLibrary}
                handleLink={handlers.handleLink}
                handleEdit={handlers.handleEdit}
                handleEditUseCase={artifactState.operations.useCases.handleEditUseCase}
                handleDeleteUseCase={artifactState.operations.useCases.handleDeleteUseCase}
                handleBreakDownUseCase={handlers.handleBreakDownUseCase}
                handleDeleteTestCase={artifactState.operations.testCases.handleDeleteTestCase}
                handleEditInformation={artifactState.operations.information.handleEditInformation}
                handleDeleteInformation={artifactState.operations.information.handleDeleteInformation}
                handleCreateBaseline={gitState.operations.onCreateBaseline}
                handleViewBaselineHistory={gitState.operations.onViewBaselineHistory}
                onAddRequirement={artifactState.operations.requirements.handleAddRequirement}
                onUpdateRequirement={artifactState.operations.requirements.handleUpdateRequirement}
                onDeleteRequirement={artifactState.operations.requirements.handleDeleteRequirement}
                onAddLink={handlers.handleAddLink}
                onAddUseCase={artifactState.operations.useCases.handleAddUseCase}
                onAddTestCase={artifactState.operations.testCases.handleAddTestCase}
                onUpdateTestCase={artifactState.operations.testCases.handleUpdateTestCase}
                onDeleteTestCase={artifactState.operations.testCases.handleDeleteTestCase}
                onAddInformation={artifactState.operations.information.handleAddInformation}
                onRestoreVersion={gitState.operations.onRestoreVersion}
                onCreateBaseline={gitState.operations.onCreateBaseline}
                onRestoreRequirement={artifactState.operations.requirements.handleRestoreRequirement}
                onRestoreUseCase={artifactState.operations.useCases.handleRestoreUseCase}
                onPermanentDeleteRequirement={artifactState.operations.requirements.handlePermanentDeleteRequirement}
                onPermanentDeleteUseCase={artifactState.operations.useCases.handlePermanentDeleteUseCase}
                onRestoreInformation={artifactState.operations.information.handleRestoreInformation}
                onPermanentDeleteInformation={artifactState.operations.information.handlePermanentDeleteInformation}
                onUpdateProject={projectState.updateProject}
                onDeleteProject={projectState.deleteProject}
                onCreateProjectSubmit={projectState.createProject}
                onAddToProject={handlers.handleAddToProject}
            />

            <DragOverlay>{dnd.renderOverlay()}</DragOverlay>
        </DndContext>
    );
}
