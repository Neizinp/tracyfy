import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Layout, ColumnSelector, GlobalLibraryPanel, ModalManager } from '../components';
import type {
    Project, Requirement, UseCase, TestCase, Information, Link, Version,
    ProjectBaseline, ColumnVisibility
} from '../types';
import { exportProjectToPDF } from '../utils/pdfExportUtils';
import { exportProjectToExcel } from '../utils/excelExportUtils';

interface ProjectLayoutProps {
    // Project state
    projects: Project[];
    currentProjectId: string;
    currentProjectName: string;

    // Data state
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

    // UI state
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    columnVisibility: ColumnVisibility;
    setColumnVisibility: (cols: ColumnVisibility) => void;
    isLibraryPanelOpen: boolean;
    setIsLibraryPanelOpen: (isOpen: boolean) => void;
    activeLibraryTab: 'requirements' | 'usecases' | 'testcases' | 'information';
    setActiveLibraryTab: (tab: 'requirements' | 'usecases' | 'testcases' | 'information') => void;
    globalLibrarySelection: Set<string>;

    // Modal states
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

    // Selection state
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

    onAddFromLibrary: (ids: string[]) => void;

    // Handlers
    handleSwitchProject: (projectId: string) => void;
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

    // CRUD handlers
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

export const ProjectLayout: React.FC<ProjectLayoutProps> = (props) => {
    const location = useLocation();








    // Get page title from current route
    const getPageTitle = () => {
        if (location.pathname.includes('/requirements/tree')) return 'Requirements Tree';
        if (location.pathname.includes('/requirements/detailed')) return 'Detailed View';
        if (location.pathname.includes('/requirements/matrix')) return 'Traceability Matrix';
        if (location.pathname.includes('/use-cases')) return 'Use Cases';
        if (location.pathname.includes('/test-cases')) return 'Test Cases';
        if (location.pathname.includes('/information')) return 'Information';
        if (location.pathname.includes('/baselines')) return 'Baselines';
        if (location.pathname.includes('/library/requirements')) return 'Requirements';
        if (location.pathname.includes('/library/use-cases')) return 'Use Cases';
        if (location.pathname.includes('/library/test-cases')) return 'Test Cases';
        if (location.pathname.includes('/library/information')) return 'Information';
        return 'Requirements Tree';
    };

    return (
        <Layout
            currentProjectName={props.currentProjectName}
            projects={props.projects}
            currentProjectId={props.currentProjectId}
            onSwitchProject={props.handleSwitchProject}
            onCreateProject={props.onCreateProject}
            onOpenProjectSettings={props.onOpenProjectSettings}
            onNewRequirement={() => props.setIsNewRequirementModalOpen(true)}
            onNewUseCase={() => props.setIsUseCaseModalOpen(true)}
            onNewTestCase={() => props.setIsNewTestCaseModalOpen(true)}
            onNewInformation={() => props.setIsInformationModalOpen(true)}
            onExport={props.onExport}
            onImport={props.onImport}
            onImportExcel={props.onImportExcel}
            onOpenGlobalLibrary={() => props.setIsLibraryPanelOpen(true)}
            onOpenLibraryTab={props.handleOpenLibrary}
            onResetToDemo={props.onResetToDemo}
            onViewHistory={() => props.setIsVersionHistoryOpen(true)}
            onPendingChangesChange={props.onPendingChangesChange}
            onCommitArtifact={props.onCommitArtifact}
            onExportPDF={async () => {
                const currentProject = props.projects.find(p => p.id === props.currentProjectId);
                if (!currentProject) {
                    alert('No project selected');
                    return;
                }

                await exportProjectToPDF(
                    currentProject,
                    {
                        requirements: props.globalRequirements,
                        useCases: props.globalUseCases,
                        testCases: props.globalTestCases,
                        information: props.globalInformation
                    },
                    currentProject.requirementIds,
                    currentProject.useCaseIds,
                    currentProject.testCaseIds,
                    currentProject.informationIds,
                    props.baselines
                );
            }}
            onExportExcel={async () => {
                const currentProject = props.projects.find(p => p.id === props.currentProjectId);
                if (!currentProject) {
                    alert('No project selected');
                    return;
                }

                await exportProjectToExcel(
                    currentProject,
                    {
                        requirements: props.globalRequirements,
                        useCases: props.globalUseCases,
                        testCases: props.globalTestCases,
                        information: props.globalInformation,
                        links: props.links
                    },
                    currentProject.requirementIds,
                    currentProject.useCaseIds,
                    currentProject.testCaseIds,
                    currentProject.informationIds,
                    props.baselines
                );
            }}
            onSearch={props.setSearchQuery}
            onTrashOpen={() => props.setIsTrashModalOpen(true)}

            rightPanel={props.isLibraryPanelOpen ? (
                <GlobalLibraryPanel
                    isOpen={true}
                    onClose={() => props.setIsLibraryPanelOpen(false)}
                    requirements={props.globalRequirements}
                    useCases={props.globalUseCases}
                    testCases={props.globalTestCases}
                    information={props.globalInformation}
                    projects={props.projects}
                    selectedItems={props.globalLibrarySelection}
                    onToggleSelect={props.handleGlobalLibrarySelect}
                    activeTab={props.activeLibraryTab}
                    onTabChange={(tab) => props.setActiveLibraryTab(tab as any)}
                    onAddToProject={props.onAddFromLibrary}
                />
            ) : undefined}
        >
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                            {getPageTitle()}
                        </h2>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {location.pathname.includes('/requirements/detailed') && (
                            <ColumnSelector
                                visibleColumns={props.columnVisibility}
                                onColumnVisibilityChange={(columns) => {
                                    props.setColumnVisibility(columns);
                                    try {
                                        localStorage.setItem(`column-visibility-${props.currentProjectId}`, JSON.stringify(columns));
                                    } catch (error) {
                                        console.error('Failed to save column visibility:', error);
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            <Outlet />

            <ModalManager
                {...props}
            />
        </Layout>
    );
};
