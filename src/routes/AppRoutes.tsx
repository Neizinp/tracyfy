import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProjectLayout } from '../layouts/ProjectLayout';
import {
    RequirementsTreePage,
    RequirementsDetailedPage,
    TraceabilityMatrixPage,
    UseCasesPage,
    TestCasesPage,
    InformationPage,
    BaselinesPage,
    BaselineHistoryPage,
    GlobalLibraryPage
} from '../pages';
import type {
    Project, Requirement, UseCase, TestCase, Information, Link, Version,
    ProjectBaseline, ColumnVisibility
} from '../types';

interface AppRoutesProps {
    // All the same props as ProjectLayout
    projects: Project[];
    currentProjectId: string;
    currentProjectName: string;
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
    links: Link[];
    versions: Version[];
    baselines: ProjectBaseline[];
    globalRequirements: Requirement[];
    globalUseCases: UseCase[];
    globalTestCases: TestCase[];
    globalInformation: Information[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    columnVisibility: ColumnVisibility;
    setColumnVisibility: (cols: ColumnVisibility) => void;
    isLibraryPanelOpen: boolean;
    setIsLibraryPanelOpen: (isOpen: boolean) => void;
    activeLibraryTab: 'requirements' | 'usecases' | 'testcases' | 'information';
    setActiveLibraryTab: (tab: 'requirements' | 'usecases' | 'testcases' | 'information') => void;
    globalLibrarySelection: Set<string>;
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
    setRequirements: (reqs: Requirement[]) => void;
    onSwitchProject: (projectId: string) => void;
    onCreateProject: () => void;
    onOpenProjectSettings: (project: Project) => void;
    onExport: () => void;
    onImport: () => void;
    onImportExcel: () => void;
    onResetToDemo: () => void;
    onPendingChangesChange: (changes: any[]) => void;
    onCommitArtifact: (artifactId: string, type: string, message: string) => Promise<void>;
    handleGlobalLibrarySelect: (id: string) => void;
    handleOpenLibrary: (tab: 'requirements' | 'usecases' | 'testcases' | 'information') => void;
    handleLink: (sourceId: string) => void;
    handleEdit: (req: Requirement) => void;
    handleEditUseCase: (uc: UseCase) => void;
    handleDeleteUseCase: (id: string) => void;
    handleBreakDownUseCase: (uc: UseCase) => void;
    handleDeleteTestCase: (id: string) => void;
    handleEditInformation: (info: Information) => void;
    handleDeleteInformation: (id: string) => void;
    handleCreateBaseline: (name: string) => Promise<void>;
    handleViewBaselineHistory: (baselineId: string) => void;


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

export const AppRoutes: React.FC<AppRoutesProps> = (props) => {
    return (
        <Routes>
            <Route path="/" element={<ProjectLayout {...props} />}>
                <Route index element={<Navigate to="/requirements/tree" replace />} />

                <Route
                    path="requirements/tree"
                    element={
                        <RequirementsTreePage
                            requirements={props.requirements}
                            links={props.links}
                            searchQuery={props.searchQuery}
                            setRequirements={props.setRequirements}
                            onLink={props.handleLink}
                            onEdit={props.handleEdit}
                        />
                    }
                />

                <Route
                    path="requirements/detailed"
                    element={
                        <RequirementsDetailedPage
                            requirements={props.requirements}
                            searchQuery={props.searchQuery}
                            columnVisibility={props.columnVisibility}
                            onEdit={props.handleEdit}
                        />
                    }
                />

                <Route
                    path="requirements/matrix"
                    element={
                        <TraceabilityMatrixPage
                            requirements={props.requirements}
                            links={props.links}
                            searchQuery={props.searchQuery}
                        />
                    }
                />

                <Route
                    path="use-cases"
                    element={
                        <UseCasesPage
                            useCases={props.useCases}
                            requirements={props.requirements}
                            searchQuery={props.searchQuery}
                            onEdit={props.handleEditUseCase}
                            onDelete={props.handleDeleteUseCase}
                            onBreakDown={props.handleBreakDownUseCase}
                        />
                    }
                />

                <Route
                    path="test-cases"
                    element={
                        <TestCasesPage
                            testCases={props.testCases}
                            onEdit={(tc) => {
                                props.setSelectedTestCaseId(tc.id);
                                props.setIsEditTestCaseModalOpen(true);
                            }}
                            onDelete={props.handleDeleteTestCase}
                        />
                    }
                />

                <Route
                    path="information"
                    element={
                        <InformationPage
                            information={props.information}
                            onEdit={props.handleEditInformation}
                            onDelete={props.handleDeleteInformation}
                        />
                    }
                />

                <Route
                    path="baselines"
                    element={
                        <BaselinesPage
                            baselines={props.baselines}
                            onCreateBaseline={() => props.handleCreateBaseline('')}
                            onViewBaseline={props.handleViewBaselineHistory}
                        />
                    }
                />

                <Route
                    path="baselines/:baselineId"
                    element={
                        <BaselineHistoryPage
                            baselines={props.baselines}
                            projects={props.projects}
                        />
                    }
                />

                <Route
                    path="library/:type"
                    element={
                        <GlobalLibraryPage
                            globalRequirements={props.globalRequirements}
                            globalUseCases={props.globalUseCases}
                            globalTestCases={props.globalTestCases}
                            globalInformation={props.globalInformation}
                            projects={props.projects}
                            columnVisibility={props.columnVisibility}
                            onEditRequirement={props.handleEdit}
                            onEditUseCase={props.handleEditUseCase}
                            onDeleteUseCase={props.handleDeleteUseCase}
                            onBreakDownUseCase={props.handleBreakDownUseCase}
                            onEditTestCase={(tc) => {
                                props.setSelectedTestCaseId(tc.id);
                                props.setIsEditTestCaseModalOpen(true);
                            }}
                            onDeleteTestCase={props.handleDeleteTestCase}
                            onEditInformation={props.handleEditInformation}
                            onDeleteInformation={props.handleDeleteInformation}
                        />
                    }
                />
            </Route>
        </Routes>
    );
};
