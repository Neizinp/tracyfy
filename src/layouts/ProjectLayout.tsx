import React, { useCallback, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Layout, ColumnSelector, GlobalLibraryPanel, ModalManager } from '../components';
import { GenericColumnSelector } from '../components/GenericColumnSelector';
import {
  useProject,
  useUI,
  useGlobalState,
  useImportExport,
  useFileSystem,
  useUser,
  useBackgroundTasks,
  useToast,
} from '../app/providers';
import { exportProjectToPDF } from '../utils/pdfExportUtils';
import { exportProjectToExcel } from '../utils/excelExportUtils';
import { createDemoProject } from '../services/demoDataService';
import type {
  Project,
  UseCaseColumnVisibility,
  TestCaseColumnVisibility,
  InformationColumnVisibility,
  RiskColumnVisibility,
} from '../types';
import type { ExportOptions } from '../components/ExportModal';

// Column configurations for each artifact type
const useCaseColumns: {
  key: keyof UseCaseColumnVisibility;
  label: string;
  alwaysVisible?: boolean;
}[] = [
  { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
  { key: 'revision', label: 'Rev' },
  { key: 'description', label: 'Description' },
  { key: 'actor', label: 'Actor' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'preconditions', label: 'Preconditions' },
  { key: 'mainFlow', label: 'Main Flow' },
];

const testCaseColumns: {
  key: keyof TestCaseColumnVisibility;
  label: string;
  alwaysVisible?: boolean;
}[] = [
  { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
  { key: 'revision', label: 'Rev' },
  { key: 'description', label: 'Description' },
  { key: 'requirements', label: 'Requirements' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'lastRun', label: 'Last Run' },
];

const informationColumns: {
  key: keyof InformationColumnVisibility;
  label: string;
  alwaysVisible?: boolean;
}[] = [
  { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
  { key: 'revision', label: 'Rev' },
  { key: 'type', label: 'Type' },
  { key: 'content', label: 'Content' },
  { key: 'created', label: 'Created' },
];

const riskColumns: {
  key: keyof RiskColumnVisibility;
  label: string;
  alwaysVisible?: boolean;
}[] = [
  { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
  { key: 'revision', label: 'Rev' },
  { key: 'category', label: 'Category' },
  { key: 'probability', label: 'Probability' },
  { key: 'impact', label: 'Impact' },
  { key: 'status', label: 'Status' },
  { key: 'owner', label: 'Owner' },
  { key: 'description', label: 'Description' },
  { key: 'mitigation', label: 'Mitigation' },
  { key: 'contingency', label: 'Contingency' },
  { key: 'created', label: 'Created' },
];

export const ProjectLayout: React.FC = () => {
  const { projects, currentProjectId, currentProject, switchProject, addToProject } = useProject();
  const location = useLocation();
  const navigate = useNavigate();

  // UI context
  const ui = useUI();

  // Global state
  const { globalRequirements, globalUseCases, globalTestCases, globalInformation } =
    useGlobalState();

  // FileSystem context
  const { baselines, reloadData, refreshStatus, risks } = useFileSystem();

  // Import/Export handlers
  const importExport = useImportExport();

  // User context
  const { currentUser } = useUser();

  // Background tasks
  const { startTask, endTask } = useBackgroundTasks();

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
  // Demo project creation with double-click confirmation
  const { showToast } = useToast();
  const demoConfirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoConfirmedRef = useRef(false);

  const handleCreateDemoProject = useCallback(async () => {
    // If not confirmed yet, show toast and wait for second click
    if (!demoConfirmedRef.current) {
      demoConfirmedRef.current = true;
      showToast('Click again to confirm creating a demo project.', 'info');

      // Reset after 3 seconds
      if (demoConfirmTimeoutRef.current) {
        clearTimeout(demoConfirmTimeoutRef.current);
      }
      demoConfirmTimeoutRef.current = setTimeout(() => {
        demoConfirmedRef.current = false;
      }, 3000);
      return;
    }

    // Clear the timeout and reset
    if (demoConfirmTimeoutRef.current) {
      clearTimeout(demoConfirmTimeoutRef.current);
    }
    demoConfirmedRef.current = false;

    const taskId = startTask('Creating demo project...');
    try {
      const demoProject = await createDemoProject();
      await reloadData();
      await refreshStatus(); // Refresh git status so pending changes show up
      switchProject(demoProject.id);
      showToast('Demo project created successfully!', 'success');
    } catch (error) {
      console.error('Failed to create demo project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to create demo project: ${errorMessage}`, 'error');
    } finally {
      endTask(taskId);
    }
  }, [reloadData, refreshStatus, switchProject, startTask, endTask, showToast]);

  // Get page title from current route
  const getPageTitle = () => {
    if (location.pathname === '/requirements') return 'Requirements';
    if (location.pathname.includes('/traceability')) return 'Traceability Dashboard';
    if (location.pathname.includes('/links')) return 'Links';
    if (location.pathname.includes('/use-cases')) return 'Use Cases';
    if (location.pathname.includes('/test-cases')) return 'Test Cases';
    if (location.pathname.includes('/information')) return 'Information';
    if (location.pathname.includes('/risks')) return 'Risks';
    if (location.pathname.includes('/workflows')) return 'Workflows';
    if (location.pathname.includes('/custom-attributes')) return 'Custom Attributes';
    if (location.pathname.includes('/library/requirements')) return 'Requirements';
    if (location.pathname.includes('/library/use-cases')) return 'Use Cases';
    if (location.pathname.includes('/library/test-cases')) return 'Test Cases';
    if (location.pathname.includes('/library/information')) return 'Information';
    return '';
  };

  // Handle adding selected items from library to project
  const handleAddFromLibrary = async (ids: string[]) => {
    // Categorize selected IDs by type
    const reqIds = ids.filter((id) => globalRequirements.some((r) => r.id === id));
    const ucIds = ids.filter((id) => globalUseCases.some((u) => u.id === id));
    const tcIds = ids.filter((id) => globalTestCases.some((t) => t.id === id));
    const infoIds = ids.filter((id) => globalInformation.some((i) => i.id === id));
    const riskIds = ids.filter((id) => risks.some((r) => r.id === id));

    await addToProject({
      requirements: reqIds,
      useCases: ucIds,
      testCases: tcIds,
      information: infoIds,
      risks: riskIds,
    });
  };

  return (
    <Layout
      projects={projects}
      currentProjectId={currentProjectId}
      onSwitchProject={switchProject}
      onCreateProject={handleCreateProject}
      onCreateDemoProject={handleCreateDemoProject}
      onOpenProjectSettings={handleOpenProjectSettings}
      onNewRequirement={() => ui.setIsNewRequirementModalOpen(true)}
      onNewUseCase={() => ui.setIsUseCaseModalOpen(true)}
      onNewTestCase={() => ui.setIsNewTestCaseModalOpen(true)}
      onNewInformation={() => ui.setIsInformationModalOpen(true)}
      onNewRisk={() => ui.setIsRiskModalOpen(true)}
      onNewWorkflow={() => ui.setIsWorkflowModalOpen(true)}
      onNewLink={() => navigate('/links')}
      onNewCustomAttribute={() => ui.setIsCustomAttributeModalOpen(true)}
      onExport={importExport.handleExport}
      onImport={importExport.handleImport}
      onImportExcel={importExport.handleImportExcel}
      onOpenGlobalLibrary={() => ui.setIsLibraryPanelOpen(true)}
      onOpenLibraryTab={ui.handleOpenLibrary}
      onOpenExportModal={() => ui.setIsExportModalOpen(true)}
      onOpenAdvancedSearch={() => ui.setIsAdvancedSearchOpen(true)}
      onViewHistory={() => ui.setIsVersionHistoryOpen(true)}
      onOpenUserSettings={() => ui.setIsUserSettingsModalOpen(true)}
      onHelp={() => navigate('/help')}
      currentUserName={currentUser?.name}
      baselines={baselines}
      onExportPDF={async (selectedBaseline) => {
        if (!currentProject) {
          alert('No project selected');
          return;
        }

        const taskId = startTask('Exporting PDF...');
        try {
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
            baselines,
            selectedBaseline, // selectedBaseline: ProjectBaseline | null
            currentUser?.name
          );
        } finally {
          endTask(taskId);
        }
      }}
      onExportExcel={async () => {
        if (!currentProject) {
          alert('No project selected');
          return;
        }

        const taskId = startTask('Exporting Excel...');
        try {
          await exportProjectToExcel(
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
            baselines,
            {
              format: 'excel',
              baseline: null,
              includeRequirements: true,
              includeUseCases: true,
              includeTestCases: true,
              includeInformation: true,
              includeRisks: true,
              includeLinks: true,
              includeTitlePage: true,
              includeRevisionHistory: true,
              includeTraceability: true,
              includeVerificationMatrix: true,
            } as ExportOptions
          );
        } finally {
          endTask(taskId);
        }
      }}
      onSearch={ui.setSearchQuery}
      rightPanel={
        ui.isLibraryPanelOpen ? (
          <GlobalLibraryPanel
            isOpen={true}
            onClose={() => {
              ui.setGlobalLibrarySelection(new Set());
              ui.setIsLibraryPanelOpen(false);
            }}
            requirements={globalRequirements}
            useCases={globalUseCases}
            testCases={globalTestCases}
            information={globalInformation}
            risks={risks}
            projects={projects}
            selectedItems={ui.globalLibrarySelection}
            onToggleSelect={ui.handleGlobalLibrarySelect}
            onSelectAll={(ids) => ui.setGlobalLibrarySelection(new Set(ids))}
            onDeselectAll={() => ui.setGlobalLibrarySelection(new Set())}
            activeTab={ui.activeLibraryTab}
            onTabChange={(tab) =>
              ui.setActiveLibraryTab(
                tab as 'requirements' | 'usecases' | 'testcases' | 'information' | 'risks'
              )
            }
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
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}>{getPageTitle()}</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(location.pathname === '/requirements' ||
              location.pathname.includes('/requirements/detailed')) && (
              <>
                <button
                  onClick={() => ui.setIsNewRequirementModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
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
              </>
            )}
            {location.pathname.includes('/use-cases') && (
              <>
                <button
                  onClick={() => {
                    ui.setEditingUseCase(null);
                    ui.setIsUseCaseModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
                <GenericColumnSelector
                  columns={useCaseColumns}
                  visibleColumns={ui.useCaseColumnVisibility}
                  onColumnVisibilityChange={ui.setUseCaseColumnVisibility}
                />
              </>
            )}
            {location.pathname.includes('/test-cases') && (
              <>
                <button
                  onClick={() => ui.setIsNewTestCaseModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
                <GenericColumnSelector
                  columns={testCaseColumns}
                  visibleColumns={ui.testCaseColumnVisibility}
                  onColumnVisibilityChange={ui.setTestCaseColumnVisibility}
                />
              </>
            )}
            {location.pathname.includes('/information') && (
              <>
                <button
                  onClick={() => {
                    ui.setSelectedInformation(null);
                    ui.setIsInformationModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
                <GenericColumnSelector
                  columns={informationColumns}
                  visibleColumns={ui.informationColumnVisibility}
                  onColumnVisibilityChange={ui.setInformationColumnVisibility}
                />
              </>
            )}
            {location.pathname.includes('/risks') && (
              <>
                <button
                  onClick={() => ui.setIsRiskModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
                <GenericColumnSelector
                  columns={riskColumns}
                  visibleColumns={ui.riskColumnVisibility}
                  onColumnVisibilityChange={ui.setRiskColumnVisibility}
                />
              </>
            )}
            {location.pathname.includes('/links') && (
              <button
                onClick={() => ui.setIsLinkModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                }}
              >
                <Plus size={16} />
                Add
              </button>
            )}
            {location.pathname.includes('/custom-attributes') && (
              <button
                onClick={() => ui.setIsCustomAttributeModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                }}
              >
                <Plus size={16} />
                Add
              </button>
            )}
            {location.pathname.includes('/workflows') && (
              <button
                onClick={() => ui.setIsWorkflowModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                }}
              >
                <Plus size={16} />
                Add
              </button>
            )}
          </div>
        </div>
      </div>

      <Outlet />

      <ModalManager />
    </Layout>
  );
};
