import React from 'react';
import {
    NewRequirementModal,
    LinkModal,
    EditRequirementModal,
    UseCaseModal,
    NewTestCaseModal,
    EditTestCaseModal,
    InformationModal,
    VersionHistory,
    TrashModal,
    ProjectSettingsModal,
    CreateProjectModal,
    GlobalLibraryModal
} from './';
import {
    useUI,
    useProject,
    useGlobalState,
    useRequirements,
    useUseCases,
    useTestCases,
    useInformation,
    useFileSystem
} from '../app/providers';

export const ModalManager: React.FC = () => {
    // UI state
    const ui = useUI();

    // Project state
    const { projects, currentProjectId, updateProject, deleteProject, createProject, addToProject } = useProject();

    // Global state
    const { globalRequirements, globalUseCases, globalTestCases, globalInformation } = useGlobalState();

    // Artifact state and operations
    const { requirements, links, handleAddRequirement, handleUpdateRequirement, handleDeleteRequirement, handleRestoreRequirement, handlePermanentDeleteRequirement, handleAddLink } = useRequirements();
    const { useCases, handleAddUseCase, handleRestoreUseCase, handlePermanentDeleteUseCase } = useUseCases();
    const { testCases, handleAddTestCase, handleUpdateTestCase, handleDeleteTestCase } = useTestCases();
    const { information, handleAddInformation, handleRestoreInformation, handlePermanentDeleteInformation } = useInformation();

    // FileSystem state
    const { baselines, createBaseline } = useFileSystem();

    return (
        <>
            <NewRequirementModal
                isOpen={ui.isNewRequirementModalOpen}
                onClose={() => ui.setIsNewRequirementModalOpen(false)}
                onSubmit={handleAddRequirement}
            />

            <LinkModal
                isOpen={ui.isLinkModalOpen}
                sourceRequirementId={ui.selectedRequirementId}
                projects={projects}
                currentProjectId={currentProjectId}
                globalRequirements={globalRequirements}
                globalUseCases={globalUseCases}
                globalTestCases={globalTestCases}
                onClose={() => ui.setIsLinkModalOpen(false)}
                onSubmit={handleAddLink}
            />

            {ui.isEditRequirementModalOpen && ui.editingRequirement && (
                <EditRequirementModal
                    isOpen={ui.isEditRequirementModalOpen}
                    requirement={ui.editingRequirement}
                    allRequirements={requirements}
                    links={links}
                    projects={projects}
                    currentProjectId={currentProjectId}
                    onClose={() => {
                        ui.setIsEditRequirementModalOpen(false);
                        ui.setEditingRequirement(null);
                    }}
                    onSubmit={handleUpdateRequirement}
                    onDelete={handleDeleteRequirement}
                />
            )}

            <UseCaseModal
                isOpen={ui.isUseCaseModalOpen}
                useCase={ui.editingUseCase}
                onClose={() => {
                    ui.setIsUseCaseModalOpen(false);
                    ui.setEditingUseCase(null);
                }}
                onSubmit={handleAddUseCase}
            />

            <NewTestCaseModal
                isOpen={ui.isNewTestCaseModalOpen}
                requirements={requirements.filter(r => !r.isDeleted)}
                onClose={() => ui.setIsNewTestCaseModalOpen(false)}
                onSubmit={handleAddTestCase}
            />

            <EditTestCaseModal
                isOpen={ui.isEditTestCaseModalOpen}
                testCase={testCases.find(t => t.id === ui.selectedTestCaseId) || null}
                requirements={requirements.filter(r => !r.isDeleted)}
                onClose={() => {
                    ui.setIsEditTestCaseModalOpen(false);
                    ui.setSelectedTestCaseId(null);
                }}
                onSubmit={handleUpdateTestCase}
                onDelete={handleDeleteTestCase}
            />

            <InformationModal
                isOpen={ui.isInformationModalOpen}
                information={ui.selectedInformation}
                onClose={() => {
                    ui.setIsInformationModalOpen(false);
                    ui.setSelectedInformation(null);
                }}
                onSubmit={handleAddInformation}
            />

            <VersionHistory
                isOpen={ui.isVersionHistoryOpen}
                baselines={baselines}
                onClose={() => ui.setIsVersionHistoryOpen(false)}
                onCreateBaseline={createBaseline}
            />

            <TrashModal
                isOpen={ui.isTrashModalOpen}
                onClose={() => ui.setIsTrashModalOpen(false)}
                deletedRequirements={requirements.filter(r => r.isDeleted)}
                deletedUseCases={useCases.filter(u => u.isDeleted)}
                onRestoreRequirement={handleRestoreRequirement}
                onRestoreUseCase={handleRestoreUseCase}
                onPermanentDeleteRequirement={handlePermanentDeleteRequirement}
                onPermanentDeleteUseCase={handlePermanentDeleteUseCase}
                deletedInformation={information.filter(i => i.isDeleted)}
                onRestoreInformation={handleRestoreInformation}
                onPermanentDeleteInformation={handlePermanentDeleteInformation}
            />

            {ui.isProjectSettingsOpen && ui.projectToEdit && (
                <ProjectSettingsModal
                    isOpen={ui.isProjectSettingsOpen}
                    project={ui.projectToEdit}
                    onClose={() => {
                        ui.setIsProjectSettingsOpen(false);
                        ui.setProjectToEdit(null);
                    }}
                    onUpdate={updateProject}
                    onDelete={deleteProject}
                />
            )}

            {ui.isCreateProjectModalOpen && (
                <CreateProjectModal
                    isOpen={ui.isCreateProjectModalOpen}
                    onClose={() => ui.setIsCreateProjectModalOpen(false)}
                    onSubmit={createProject}
                />
            )}

            <GlobalLibraryModal
                isOpen={ui.isGlobalLibraryModalOpen}
                onClose={() => ui.setIsGlobalLibraryModalOpen(false)}
                projects={projects}
                currentProjectId={currentProjectId}
                globalRequirements={globalRequirements}
                globalUseCases={globalUseCases}
                globalTestCases={globalTestCases}
                globalInformation={globalInformation}
                onAddToProject={addToProject}
            />
        </>
    );
};
