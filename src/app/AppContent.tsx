import { DndContext, DragOverlay } from '@dnd-kit/core';
import { AppRoutes } from '../routes/AppRoutes';
import { LoadingOverlay } from '../components';
import {
    useAppProjects,
    useAppArtifacts,
    useAppGit,
    useAppHandlers
} from './app-content';
import { useUI } from './providers';

export function AppContent() {
    const projectState = useAppProjects();
    const artifactState = useAppArtifacts();
    const gitState = useAppGit();
    const uiState = useUI();
    const handlers = useAppHandlers();

    if (projectState.isLoading) {
        return <LoadingOverlay isLoading={true} />;
    }

    return (
        <AppRoutes
            // Project state
            projects={projectState.projects}
            currentProjectId={projectState.currentProjectId}
            currentProjectName={projectState.currentProject.name}

            // Data state
            requirements={artifactState.local.requirements}
            useCases={artifactState.local.useCases}
            testCases={artifactState.local.testCases}
            information={artifactState.local.information}
            links={artifactState.local.links}
            versions={gitState.versions}
            baselines={gitState.baselines}
            globalRequirements={artifactState.global.requirements}
            globalUseCases={artifactState.global.useCases}
            globalTestCases={artifactState.global.testCases}
            globalInformation={artifactState.global.information}

            // UI state
            searchQuery={uiState.searchQuery}
            setSearchQuery={uiState.setSearchQuery}
            columnVisibility={uiState.columnVisibility}
            setColumnVisibility={uiState.setColumnVisibility}
            isLibraryPanelOpen={uiState.isLibraryPanelOpen}
            setIsLibraryPanelOpen={uiState.setIsLibraryPanelOpen}
            activeLibraryTab={uiState.activeLibraryTab}
            setActiveLibraryTab={uiState.setActiveLibraryTab}
            globalLibrarySelection={uiState.globalLibrarySelection}

            // Modal states
            isNewRequirementModalOpen={uiState.isNewRequirementModalOpen}
            setIsNewRequirementModalOpen={uiState.setIsNewRequirementModalOpen}
            isLinkModalOpen={uiState.isLinkModalOpen}
            setIsLinkModalOpen={uiState.setIsLinkModalOpen}
            isEditRequirementModalOpen={uiState.isEditRequirementModalOpen}
            setIsEditRequirementModalOpen={uiState.setIsEditRequirementModalOpen}
            isUseCaseModalOpen={uiState.isUseCaseModalOpen}
            setIsUseCaseModalOpen={uiState.setIsUseCaseModalOpen}
            isNewTestCaseModalOpen={uiState.isNewTestCaseModalOpen}
            setIsNewTestCaseModalOpen={uiState.setIsNewTestCaseModalOpen}
            isEditTestCaseModalOpen={uiState.isEditTestCaseModalOpen}
            setIsEditTestCaseModalOpen={uiState.setIsEditTestCaseModalOpen}
            isInformationModalOpen={uiState.isInformationModalOpen}
            setIsInformationModalOpen={uiState.setIsInformationModalOpen}
            isVersionHistoryOpen={uiState.isVersionHistoryOpen}
            setIsVersionHistoryOpen={uiState.setIsVersionHistoryOpen}
            isTrashModalOpen={uiState.isTrashModalOpen}
            setIsTrashModalOpen={uiState.setIsTrashModalOpen}
            isProjectSettingsOpen={uiState.isProjectSettingsOpen}
            setIsProjectSettingsOpen={uiState.setIsProjectSettingsOpen}
            isCreateProjectModalOpen={uiState.isCreateProjectModalOpen}
            setIsCreateProjectModalOpen={uiState.setIsCreateProjectModalOpen}
            isGlobalLibraryModalOpen={uiState.isGlobalLibraryModalOpen}
            setIsGlobalLibraryModalOpen={uiState.setIsGlobalLibraryModalOpen}

            // Selection states
            selectedRequirementId={uiState.selectedRequirementId}
            selectedTestCaseId={uiState.selectedTestCaseId}
            setSelectedTestCaseId={uiState.setSelectedTestCaseId}
            selectedInformation={uiState.selectedInformation}
            setSelectedInformation={uiState.setSelectedInformation}
            editingRequirement={uiState.editingRequirement}
            setEditingRequirement={uiState.setEditingRequirement}
            editingUseCase={uiState.editingUseCase}
            setEditingUseCase={uiState.setEditingUseCase}
            projectToEdit={uiState.projectToEdit}
            setProjectToEdit={uiState.setProjectToEdit}
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
            handleEditUseCase={uiState.setEditingUseCase}
            handleDeleteUseCase={artifactState.operations.useCases.handleDeleteUseCase}
            handleBreakDownUseCase={handlers.handleBreakDownUseCase}
            handleDeleteTestCase={artifactState.operations.testCases.handleDeleteTestCase}
            handleEditInformation={uiState.setSelectedInformation}
            handleDeleteInformation={artifactState.operations.information.handleDeleteInformation}
            handleCreateBaseline={gitState.operations.onCreateBaseline}
            handleViewBaselineHistory={gitState.operations.onViewBaselineHistory}

            // CRUD handlers
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
            onAddFromLibrary={handlers.onAddToProject}
        />
    );
}
