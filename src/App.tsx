import { AppRoutes } from './routes/AppRoutes';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';

import type { ProjectBaseline, Version, Project } from './types';

import { ProjectProvider, useProject } from './app/providers';
import { useRequirements } from './hooks/useRequirements';
import { useUseCases } from './hooks/useUseCases';
import { useTestCases } from './hooks/useTestCases';
import { useInformation } from './hooks/useInformation';
import { useGitOperations } from './hooks/useGitOperations';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useImportExport } from './hooks/useImportExport';
import { useUIState } from './hooks/useUIState';
import { useGlobalState } from './hooks/useGlobalState';
import { useAppHandlers } from './hooks/useAppHandlers';
import { LoadingOverlay } from './components';

function AppContent() {
  const {
    projects,
    currentProjectId,
    isLoading,
    currentProject,
    switchProject: handleSwitchProject,
    createProject: handleCreateProjectSubmit,
    updateProject: handleUpdateProject,
    deleteProject: handleDeleteProject,
    resetToDemo: handleResetToDemo,
    addToProject: handleAddToProjectInternal,
    setProjects,
    initialGlobalState,
    setHasInitializedProjects
  } = useProject();

  // UI State
  const {
    isNewRequirementModalOpen, setIsNewRequirementModalOpen,
    isLinkModalOpen, setIsLinkModalOpen,
    isEditRequirementModalOpen, setIsEditRequirementModalOpen,
    isUseCaseModalOpen, setIsUseCaseModalOpen,
    isTrashModalOpen, setIsTrashModalOpen,
    isVersionHistoryOpen, setIsVersionHistoryOpen,
    isProjectSettingsOpen, setIsProjectSettingsOpen,
    isCreateProjectModalOpen, setIsCreateProjectModalOpen,
    isNewTestCaseModalOpen, setIsNewTestCaseModalOpen,
    isEditTestCaseModalOpen, setIsEditTestCaseModalOpen,
    isInformationModalOpen, setIsInformationModalOpen,
    isLibraryPanelOpen, setIsLibraryPanelOpen,
    isGlobalLibraryModalOpen, setIsGlobalLibraryModalOpen,
    selectedRequirementId, setSelectedRequirementId,
    selectedTestCaseId, setSelectedTestCaseId,
    selectedInformation, setSelectedInformation,
    editingRequirement, setEditingRequirement,
    editingUseCase, setEditingUseCase,
    projectToEdit, setProjectToEdit,
    activeLibraryTab, setActiveLibraryTab,
    globalLibrarySelection, setGlobalLibrarySelection,
    columnVisibility, setColumnVisibility,
    getDefaultColumnVisibility
  } = useUIState();

  // Global & Local State Management
  const {
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    links, setLinks,
    requirements, setRequirements,
    useCases, setUseCases,
    testCases, setTestCases,
    information, setInformation,
    usedReqNumbers, setUsedReqNumbers,
    usedUcNumbers, setUsedUcNumbers,
    usedTestNumbers, setUsedTestNumbers,
    usedInfoNumbers, setUsedInfoNumbers
  } = useGlobalState({
    projects,
    currentProjectId,
    initialGlobalState,
    setProjects,
    setHasInitializedProjects,
    getDefaultColumnVisibility,
    setColumnVisibility
  });

  // Git Operations
  const {
    handlePendingChangesChange,
    handleCommitArtifact,
    handleCreateBaseline,
    handleViewBaselineHistory,
    handleRestoreVersion,
    versions,
    setVersions
  } = useGitOperations({
    currentProjectId,
    projects,
    requirements,
    useCases,
    testCases,
    information,
    links,
    setRequirements,
    setUseCases,
    setTestCases,
    setInformation,
    setLinks
  });

  // App Handlers
  const {
    handleAddToProject,
    handleGlobalLibrarySelect,
    handleOpenLibrary,
    handleBreakDownUseCase,
    handleLink,
    handleAddLink,
    handleEdit
  } = useAppHandlers({
    projects,
    currentProjectId,
    requirements,
    useCases,
    testCases,
    information,
    links,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    setRequirements,
    setUseCases,
    setTestCases,
    setInformation,
    setLinks,
    setVersions,
    handleAddToProjectInternal,
    setGlobalLibrarySelection,
    setActiveLibraryTab,
    setIsLibraryPanelOpen,
    setIsNewRequirementModalOpen,
    setSelectedRequirementId,
    setIsLinkModalOpen,
    setEditingRequirement,
    setIsEditRequirementModalOpen
  });

  // Artifact Hooks
  const {
    handleAddRequirement,
    handleUpdateRequirement,
    handleDeleteRequirement,
    handleRestoreRequirement,
    handlePermanentDeleteRequirement
  } = useRequirements({
    requirements,
    setRequirements,
    usedReqNumbers,
    setUsedReqNumbers,
    links,
    setLinks,
    projects,
    currentProjectId,
    setIsEditModalOpen: setIsEditRequirementModalOpen,
    setEditingRequirement
  });

  const {
    handleAddUseCase,
    handleEditUseCase,
    handleDeleteUseCase,
    handleRestoreUseCase,
    handlePermanentDeleteUseCase
  } = useUseCases({
    useCases,
    setUseCases,
    usedUcNumbers,
    setUsedUcNumbers,
    requirements,
    setRequirements,
    projects,
    currentProjectId,
    setIsUseCaseModalOpen,
    setEditingUseCase
  });

  const {
    handleAddTestCase,
    handleUpdateTestCase,
    handleDeleteTestCase
  } = useTestCases({
    testCases,
    setTestCases,
    usedTestNumbers,
    setUsedTestNumbers,
    projects,
    currentProjectId
  });

  const {
    handleAddInformation,
    handleEditInformation,
    handleDeleteInformation,
    handleRestoreInformation,
    handlePermanentDeleteInformation
  } = useInformation({
    information,
    setInformation,
    usedInfoNumbers,
    setUsedInfoNumbers,
    projects,
    currentProjectId,
    setIsInformationModalOpen,
    setSelectedInformation
  });

  const {
    sensors,
    activeDragItem,
    handleDragStart,
    handleDragEnd
  } = useDragAndDrop({
    requirements,
    setRequirements,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    globalLibrarySelection,
    useCases,
    testCases,
    information,
    links,
    currentProjectId,
    projects,
    setProjects,
    setVersions: setVersions as any,
    handleAddToProject: handleAddToProjectInternal
  });

  const {
    handleExport,
    handleImport,
    handleImportExcel
  } = useImportExport({
    currentProjectId,
    projects,
    requirements,
    useCases,
    testCases,
    information,
    links,
    setRequirements,
    setUseCases,
    setTestCases,
    setInformation,
    setLinks
  });

  // Derived State
  const baselines = versions.filter((v: Version) => v.type === 'baseline').map((v: Version) => ({
    id: v.id,
    projectId: currentProjectId,
    version: v.tag || '01',
    name: v.message,
    description: '',
    timestamp: v.timestamp,
    artifactCommits: {},
    addedArtifacts: [],
    removedArtifacts: []
  } as ProjectBaseline));

  const handleCreateProject = () => {
    setIsCreateProjectModalOpen(true);
  };

  const handleOpenProjectSettings = (project: Project) => {
    setProjectToEdit(project);
    setIsProjectSettingsOpen(true);
  };

  if (isLoading) {
    return <LoadingOverlay isLoading={isLoading} />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <AppRoutes
        // Project Data
        projects={projects}
        currentProjectId={currentProjectId}
        currentProjectName={currentProject.name}

        // Artifacts
        requirements={requirements}
        useCases={useCases}
        testCases={testCases}
        information={information}
        links={links}
        versions={versions}
        baselines={baselines}

        // Global Data
        globalRequirements={globalRequirements}
        globalUseCases={globalUseCases}
        globalTestCases={globalTestCases}
        globalInformation={globalInformation}

        // UI State
        searchQuery=""
        setSearchQuery={() => { }} // Search is handled in pages now? Or needs to be added to useUIState?
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        isLibraryPanelOpen={isLibraryPanelOpen}
        setIsLibraryPanelOpen={setIsLibraryPanelOpen}
        activeLibraryTab={activeLibraryTab}
        setActiveLibraryTab={setActiveLibraryTab}
        globalLibrarySelection={globalLibrarySelection}

        // Modals
        isNewRequirementModalOpen={isNewRequirementModalOpen}
        setIsNewRequirementModalOpen={setIsNewRequirementModalOpen}
        isLinkModalOpen={isLinkModalOpen}
        setIsLinkModalOpen={setIsLinkModalOpen}
        isEditRequirementModalOpen={isEditRequirementModalOpen}
        setIsEditRequirementModalOpen={setIsEditRequirementModalOpen}
        isUseCaseModalOpen={isUseCaseModalOpen}
        setIsUseCaseModalOpen={setIsUseCaseModalOpen}
        isNewTestCaseModalOpen={isNewTestCaseModalOpen}
        setIsNewTestCaseModalOpen={setIsNewTestCaseModalOpen}
        isEditTestCaseModalOpen={isEditTestCaseModalOpen}
        setIsEditTestCaseModalOpen={setIsEditTestCaseModalOpen}
        isInformationModalOpen={isInformationModalOpen}
        setIsInformationModalOpen={setIsInformationModalOpen}
        isVersionHistoryOpen={isVersionHistoryOpen}
        setIsVersionHistoryOpen={setIsVersionHistoryOpen}
        isTrashModalOpen={isTrashModalOpen}
        setIsTrashModalOpen={setIsTrashModalOpen}
        isProjectSettingsOpen={isProjectSettingsOpen}
        setIsProjectSettingsOpen={setIsProjectSettingsOpen}
        isCreateProjectModalOpen={isCreateProjectModalOpen}
        setIsCreateProjectModalOpen={setIsCreateProjectModalOpen}
        isGlobalLibraryModalOpen={isGlobalLibraryModalOpen}
        setIsGlobalLibraryModalOpen={setIsGlobalLibraryModalOpen}

        // Selections
        selectedRequirementId={selectedRequirementId}
        selectedTestCaseId={selectedTestCaseId}
        setSelectedTestCaseId={setSelectedTestCaseId}
        selectedInformation={selectedInformation}
        setSelectedInformation={setSelectedInformation}
        editingRequirement={editingRequirement}
        setEditingRequirement={setEditingRequirement}
        editingUseCase={editingUseCase}
        setEditingUseCase={setEditingUseCase}
        projectToEdit={projectToEdit}
        setProjectToEdit={setProjectToEdit}

        // Setters
        setRequirements={setRequirements}

        // Handlers
        onSwitchProject={handleSwitchProject}
        onCreateProject={handleCreateProject}
        onOpenProjectSettings={handleOpenProjectSettings}
        onExport={handleExport}
        onImport={handleImport}
        onImportExcel={handleImportExcel}
        onResetToDemo={handleResetToDemo}
        onPendingChangesChange={handlePendingChangesChange}
        onCommitArtifact={handleCommitArtifact}
        handleGlobalLibrarySelect={handleGlobalLibrarySelect}
        handleOpenLibrary={handleOpenLibrary}
        handleLink={handleLink}
        handleEdit={handleEdit}
        handleEditUseCase={handleEditUseCase}
        handleDeleteUseCase={handleDeleteUseCase}
        handleBreakDownUseCase={handleBreakDownUseCase}
        handleDeleteTestCase={handleDeleteTestCase}
        handleEditInformation={handleEditInformation}
        handleDeleteInformation={handleDeleteInformation}
        handleCreateBaseline={handleCreateBaseline}
        handleViewBaselineHistory={handleViewBaselineHistory}
        onAddRequirement={handleAddRequirement}
        onUpdateRequirement={handleUpdateRequirement}
        onDeleteRequirement={handleDeleteRequirement}
        onAddLink={handleAddLink}
        onAddUseCase={handleAddUseCase}
        onAddTestCase={handleAddTestCase}
        onUpdateTestCase={handleUpdateTestCase}
        onDeleteTestCase={handleDeleteTestCase}
        onAddInformation={handleAddInformation}
        onRestoreVersion={handleRestoreVersion}
        onCreateBaseline={handleCreateBaseline}
        onRestoreRequirement={handleRestoreRequirement}
        onRestoreUseCase={handleRestoreUseCase}
        onPermanentDeleteRequirement={handlePermanentDeleteRequirement}
        onPermanentDeleteUseCase={handlePermanentDeleteUseCase}
        onRestoreInformation={handleRestoreInformation}
        onPermanentDeleteInformation={handlePermanentDeleteInformation}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        onCreateProjectSubmit={handleCreateProjectSubmit}
        onAddToProject={handleAddToProject}
      />

      <DragOverlay>
        {activeDragItem ? (
          <div style={{
            padding: '12px',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-accent)',
            borderRadius: '6px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            width: '300px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {globalLibrarySelection.has(activeDragItem.id) && globalLibrarySelection.size > 1 && (
              <div style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                {globalLibrarySelection.size}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 500 }}>{activeDragItem.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{activeDragItem.id}</div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default function App() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}
