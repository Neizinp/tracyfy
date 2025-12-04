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
import type { Requirement, Link, UseCase, TestCase, Information, Version, Project } from '../types';

interface ModalManagerProps {
    // UI State
    isNewRequirementModalOpen: boolean;
    setIsNewRequirementModalOpen: (isOpen: boolean) => void;
    isLinkModalOpen: boolean;
    setIsLinkModalOpen: (isOpen: boolean) => void;
    isEditRequirementModalOpen: boolean;
    setIsEditRequirementModalOpen: (isOpen: boolean) => void;
    isUseCaseModalOpen: boolean;
    setIsUseCaseModalOpen: (isOpen: boolean) => void;
    isNewTestCaseModalOpen: boolean;
    setIsNewTestCaseModalOpen: (isOpen: boolean) => void;
    isEditTestCaseModalOpen: boolean;
    setIsEditTestCaseModalOpen: (isOpen: boolean) => void;
    isInformationModalOpen: boolean;
    setIsInformationModalOpen: (isOpen: boolean) => void;
    isVersionHistoryOpen: boolean;
    setIsVersionHistoryOpen: (isOpen: boolean) => void;
    isTrashModalOpen: boolean;
    setIsTrashModalOpen: (isOpen: boolean) => void;
    isProjectSettingsOpen: boolean;
    setIsProjectSettingsOpen: (isOpen: boolean) => void;
    isCreateProjectModalOpen: boolean;
    setIsCreateProjectModalOpen: (isOpen: boolean) => void;
    isGlobalLibraryModalOpen: boolean;
    setIsGlobalLibraryModalOpen: (isOpen: boolean) => void;

    // Selections & Editing
    selectedRequirementId: string | null;
    selectedTestCaseId: string | null;
    setSelectedTestCaseId: (id: string | null) => void;
    selectedInformation: Information | null;
    setSelectedInformation: (info: Information | null) => void;
    editingRequirement: Requirement | null;
    setEditingRequirement: (req: Requirement | null) => void;
    editingUseCase: UseCase | null;
    setEditingUseCase: (uc: UseCase | null) => void;
    projectToEdit: Project | null;
    setProjectToEdit: (project: Project | null) => void;

    // Data
    projects: Project[];
    currentProjectId: string;
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
    links: Link[];
    versions: Version[];
    globalRequirements: Requirement[];
    globalUseCases: UseCase[];
    globalTestCases: TestCase[];
    globalInformation: Information[];

    // Handlers
    onAddRequirement: (req: Omit<Requirement, 'id' | 'lastModified'>) => Promise<void>;
    onUpdateRequirement: (id: string, data: Partial<Requirement>) => Promise<void>;
    onDeleteRequirement: (id: string) => void;
    onAddLink: (link: Omit<Link, 'id'>) => void;
    onAddUseCase: (useCase: Omit<UseCase, 'id' | 'lastModified'> | { id: string; updates: Partial<UseCase> }) => void;
    onAddTestCase: (testCase: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => void;
    onUpdateTestCase: (id: string, data: Partial<TestCase>) => Promise<void>;
    onDeleteTestCase: (id: string) => void;
    onAddInformation: (data: Omit<Information, 'id' | 'lastModified' | 'dateCreated'> | { id: string; updates: Partial<Information> }) => void;
    onRestoreVersion: (versionId: string) => Promise<void>;
    onCreateBaseline: (name: string) => Promise<void>;
    onRestoreRequirement: (id: string) => void;
    onRestoreUseCase: (id: string) => void;
    onPermanentDeleteRequirement: (id: string) => void;
    onPermanentDeleteUseCase: (id: string) => void;
    onRestoreInformation: (id: string) => void;
    onPermanentDeleteInformation: (id: string) => void;
    onUpdateProject: (projectId: string, name: string, description: string) => void;
    onDeleteProject: (id: string) => void;
    onCreateProjectSubmit: (name: string, description: string) => void;
    onAddToProject: (artifacts: { requirements: string[], useCases: string[], testCases: string[], information: string[] }, targetProjectId?: string) => Promise<void>;
}

export const ModalManager: React.FC<ModalManagerProps> = ({
    isNewRequirementModalOpen, setIsNewRequirementModalOpen,
    isLinkModalOpen, setIsLinkModalOpen,
    isEditRequirementModalOpen, setIsEditRequirementModalOpen,
    isUseCaseModalOpen, setIsUseCaseModalOpen,
    isNewTestCaseModalOpen, setIsNewTestCaseModalOpen,
    isEditTestCaseModalOpen, setIsEditTestCaseModalOpen,
    isInformationModalOpen, setIsInformationModalOpen,
    isVersionHistoryOpen, setIsVersionHistoryOpen,
    isTrashModalOpen, setIsTrashModalOpen,
    isProjectSettingsOpen, setIsProjectSettingsOpen,
    isCreateProjectModalOpen, setIsCreateProjectModalOpen,
    isGlobalLibraryModalOpen, setIsGlobalLibraryModalOpen,
    selectedRequirementId,
    selectedTestCaseId, setSelectedTestCaseId,
    selectedInformation, setSelectedInformation,
    editingRequirement, setEditingRequirement,
    editingUseCase, setEditingUseCase,
    projectToEdit, setProjectToEdit,
    projects, currentProjectId,
    requirements, useCases, testCases, information, links, versions,
    globalRequirements, globalUseCases, globalTestCases, globalInformation,
    onAddRequirement, onUpdateRequirement, onDeleteRequirement,
    onAddLink, onAddUseCase, onAddTestCase, onUpdateTestCase, onDeleteTestCase,
    onAddInformation, onRestoreVersion, onCreateBaseline,
    onRestoreRequirement, onRestoreUseCase, onPermanentDeleteRequirement, onPermanentDeleteUseCase,
    onRestoreInformation, onPermanentDeleteInformation,
    onUpdateProject, onDeleteProject, onCreateProjectSubmit, onAddToProject
}) => {
    return (
        <>
            <NewRequirementModal
                isOpen={isNewRequirementModalOpen}
                onClose={() => setIsNewRequirementModalOpen(false)}
                onSubmit={onAddRequirement}
            />

            <LinkModal
                isOpen={isLinkModalOpen}
                sourceRequirementId={selectedRequirementId}
                projects={projects}
                currentProjectId={currentProjectId}
                globalRequirements={globalRequirements}
                globalUseCases={globalUseCases}
                globalTestCases={globalTestCases}
                onClose={() => setIsLinkModalOpen(false)}
                onSubmit={onAddLink}
            />

            {isEditRequirementModalOpen && editingRequirement && (
                <EditRequirementModal
                    isOpen={isEditRequirementModalOpen}
                    requirement={editingRequirement}
                    allRequirements={requirements}
                    links={links}
                    projects={projects}
                    currentProjectId={currentProjectId}
                    onClose={() => {
                        setIsEditRequirementModalOpen(false);
                        setEditingRequirement(null);
                    }}
                    onSubmit={onUpdateRequirement}
                    onDelete={onDeleteRequirement}
                />
            )}

            <UseCaseModal
                isOpen={isUseCaseModalOpen}
                useCase={editingUseCase}
                onClose={() => {
                    setIsUseCaseModalOpen(false);
                    setEditingUseCase(null);
                }}
                onSubmit={onAddUseCase}
            />

            <NewTestCaseModal
                isOpen={isNewTestCaseModalOpen}
                requirements={requirements.filter(r => !r.isDeleted)}
                onClose={() => setIsNewTestCaseModalOpen(false)}
                onSubmit={onAddTestCase}
            />

            <EditTestCaseModal
                isOpen={isEditTestCaseModalOpen}
                testCase={testCases.find(t => t.id === selectedTestCaseId) || null}
                requirements={requirements.filter(r => !r.isDeleted)}
                onClose={() => {
                    setIsEditTestCaseModalOpen(false);
                    setSelectedTestCaseId(null);
                }}
                onSubmit={onUpdateTestCase}
                onDelete={onDeleteTestCase}
            />

            <InformationModal
                isOpen={isInformationModalOpen}
                information={selectedInformation}
                onClose={() => {
                    setIsInformationModalOpen(false);
                    setSelectedInformation(null);
                }}
                onSubmit={onAddInformation}
            />

            <VersionHistory
                isOpen={isVersionHistoryOpen}
                versions={versions}
                onClose={() => setIsVersionHistoryOpen(false)}
                onRestore={onRestoreVersion}
                onCreateBaseline={onCreateBaseline}
            />

            <TrashModal
                isOpen={isTrashModalOpen}
                onClose={() => setIsTrashModalOpen(false)}
                deletedRequirements={requirements.filter(r => r.isDeleted)}
                deletedUseCases={useCases.filter(u => u.isDeleted)}
                onRestoreRequirement={onRestoreRequirement}
                onRestoreUseCase={onRestoreUseCase}
                onPermanentDeleteRequirement={onPermanentDeleteRequirement}
                onPermanentDeleteUseCase={onPermanentDeleteUseCase}
                deletedInformation={information.filter(i => i.isDeleted)}
                onRestoreInformation={onRestoreInformation}
                onPermanentDeleteInformation={onPermanentDeleteInformation}
            />

            {isProjectSettingsOpen && projectToEdit && (
                <ProjectSettingsModal
                    isOpen={isProjectSettingsOpen}
                    project={projectToEdit}
                    onClose={() => {
                        setIsProjectSettingsOpen(false);
                        setProjectToEdit(null);
                    }}
                    onUpdate={onUpdateProject}
                    onDelete={onDeleteProject}
                />
            )}

            {isCreateProjectModalOpen && (
                <CreateProjectModal
                    isOpen={isCreateProjectModalOpen}
                    onClose={() => setIsCreateProjectModalOpen(false)}
                    onSubmit={onCreateProjectSubmit}
                />
            )}

            <GlobalLibraryModal
                isOpen={isGlobalLibraryModalOpen}
                onClose={() => setIsGlobalLibraryModalOpen(false)}
                projects={projects}
                currentProjectId={currentProjectId}
                globalRequirements={globalRequirements}
                globalUseCases={globalUseCases}
                globalTestCases={globalTestCases}
                globalInformation={globalInformation}
                onAddToProject={onAddToProject}
            />
        </>
    );
};
