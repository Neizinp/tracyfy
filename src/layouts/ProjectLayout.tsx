import React, { useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Layout, ColumnSelector, GlobalLibraryPanel, ModalManager } from '../components';
import {
  useProject,
  useUI,
  useGlobalState,
  useImportExport,
  useFileSystem,
} from '../app/providers';
import { exportProjectToPDF } from '../utils/pdfExportUtils';
import { exportProjectToExcel } from '../utils/excelExportUtils';
import type { Project } from '../types';

export const ProjectLayout: React.FC = () => {
  const { projects, currentProjectId, currentProject, switchProject, addToProject } = useProject();
  const location = useLocation();

  // UI context
  const ui = useUI();

  // Global state
  const { globalRequirements, globalUseCases, globalTestCases, globalInformation, links } =
    useGlobalState();

  // FileSystem context
  const { baselines } = useFileSystem();

  // Import/Export handlers
  const importExport = useImportExport();

  // Project action handlers
  const handleCreateProject = useCallback(() => {
    ui.setIsCreateProjectModalOpen(true);
  }, [ui]);

  const handleOpenProjectSettings = useCallback(
    (project: Project) => {
      ui.setProjectToEdit(project);
      ui.setIsProjectSettingsOpen(true);
    },
    [ui]
  );

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

  // Handle adding selected items from library to project
  const handleAddFromLibrary = async (ids: string[]) => {
    // Categorize selected IDs by type
    const reqIds = ids.filter((id) => globalRequirements.some((r) => r.id === id));
    const ucIds = ids.filter((id) => globalUseCases.some((u) => u.id === id));
    const tcIds = ids.filter((id) => globalTestCases.some((t) => t.id === id));
    const infoIds = ids.filter((id) => globalInformation.some((i) => i.id === id));

    await addToProject({
      requirements: reqIds,
      useCases: ucIds,
      testCases: tcIds,
      information: infoIds,
    });
  };

  return (
    <Layout
      currentProjectName={currentProject?.name || 'No Project'}
      projects={projects}
      currentProjectId={currentProjectId}
      onSwitchProject={switchProject}
      onCreateProject={handleCreateProject}
      onOpenProjectSettings={handleOpenProjectSettings}
      onNewRequirement={() => ui.setIsNewRequirementModalOpen(true)}
      onNewUseCase={() => ui.setIsUseCaseModalOpen(true)}
      onNewTestCase={() => ui.setIsNewTestCaseModalOpen(true)}
      onNewInformation={() => ui.setIsInformationModalOpen(true)}
      onExport={importExport.handleExport}
      onImport={importExport.handleImport}
      onImportExcel={importExport.handleImportExcel}
      onOpenGlobalLibrary={() => ui.setIsLibraryPanelOpen(true)}
      onOpenLibraryTab={ui.handleOpenLibrary}
      onViewHistory={() => ui.setIsVersionHistoryOpen(true)}
      onExportPDF={async () => {
        if (!currentProject) {
          alert('No project selected');
          return;
        }

        await exportProjectToPDF(
          currentProject,
          {
            requirements: globalRequirements,
            useCases: globalUseCases,
            testCases: globalTestCases,
            information: globalInformation,
          },
          currentProject.requirementIds,
          currentProject.useCaseIds,
          currentProject.testCaseIds,
          currentProject.informationIds,
          baselines
        );
      }}
      onExportExcel={async () => {
        if (!currentProject) {
          alert('No project selected');
          return;
        }

        await exportProjectToExcel(
          currentProject,
          {
            requirements: globalRequirements,
            useCases: globalUseCases,
            testCases: globalTestCases,
            information: globalInformation,
            links: links,
          },
          currentProject.requirementIds,
          currentProject.useCaseIds,
          currentProject.testCaseIds,
          currentProject.informationIds,
          baselines
        );
      }}
      onSearch={ui.setSearchQuery}
      onTrashOpen={() => ui.setIsTrashModalOpen(true)}
      rightPanel={
        ui.isLibraryPanelOpen ? (
          <GlobalLibraryPanel
            isOpen={true}
            onClose={() => ui.setIsLibraryPanelOpen(false)}
            requirements={globalRequirements}
            useCases={globalUseCases}
            testCases={globalTestCases}
            information={globalInformation}
            projects={projects}
            selectedItems={ui.globalLibrarySelection}
            onToggleSelect={ui.handleGlobalLibrarySelect}
            activeTab={ui.activeLibraryTab}
            onTabChange={(tab) => ui.setActiveLibraryTab(tab as any)}
            onAddToProject={handleAddFromLibrary}
          />
        ) : undefined
      }
    >
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{getPageTitle()}</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {location.pathname.includes('/requirements/detailed') && (
              <ColumnSelector
                visibleColumns={ui.columnVisibility}
                onColumnVisibilityChange={(columns) => {
                  ui.setColumnVisibility(columns);
                  try {
                    localStorage.setItem(
                      `column-visibility-${currentProjectId}`,
                      JSON.stringify(columns)
                    );
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

      <ModalManager />
    </Layout>
  );
};
