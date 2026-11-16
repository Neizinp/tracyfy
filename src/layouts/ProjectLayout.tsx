import React, { Suspense, useCallback, useRef, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Layout, ModalManager } from '../components';
import { GenericColumnSelector } from '../components/GenericColumnSelector';
import {
  useProject,
  useUI,
  useGlobalState,
  useImportExport,
  useFileSystem,
  useUser,
  useBackgroundTaskActions,
  useToast,
  useBaselines,
  useCustomAttributes,
} from '../app/providers';
import { loadDemoData } from '../services/demoDataService';
import { activeIds } from '../utils/activeArtifacts';
import type {
  ColumnVisibility,
  UseCaseColumnVisibility,
  TestCaseColumnVisibility,
  InformationColumnVisibility,
  RiskColumnVisibility,
  DocumentColumnVisibility,
  ExportOptions,
} from '../types';

/** Shown while a lazily loaded page chunk is being fetched */
const PageLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    style={{ padding: 'var(--spacing-lg)', color: 'var(--color-text-muted)' }}
  >
    Loading…
  </div>
);

export const ProjectLayout: React.FC = () => {
  const { project } = useProject();
  const location = useLocation();
  const navigate = useNavigate();

  // UI context
  const ui = useUI();

  // Global state
  const { requirements, useCases, testCases, information, documents } = useGlobalState();

  // FileSystem context
  const { reloadData, refreshStatus, changeDirectory } = useFileSystem();

  // Baselines context
  const { baselines } = useBaselines();

  // Custom Attributes context
  const { getDefinitionsForType } = useCustomAttributes();

  // Dynamically generate column configurations
  const requirementColumns = useMemo(() => {
    const customDefs = getDefinitionsForType('requirement');
    const base: { key: string; label: string; alwaysVisible?: boolean }[] = [
      { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
      { key: 'description', label: 'Description' },
      { key: 'text', label: 'Requirement Text' },
      { key: 'rationale', label: 'Rationale' },
      { key: 'author', label: 'Author' },
      { key: 'verification', label: 'Verification' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'comments', label: 'Comments' },
      { key: 'created', label: 'Created' },
      { key: 'approved', label: 'Approved' },
    ];

    const custom = customDefs.map((def) => ({
      key: def.id,
      label: def.name,
    }));

    return [...base, ...custom];
  }, [getDefinitionsForType]);

  const useCaseColumnsDynamic = useMemo(() => {
    const customDefs = getDefinitionsForType('useCase');
    const base: { key: string; label: string; alwaysVisible?: boolean }[] = [
      { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
      { key: 'revision', label: 'Rev' },
      { key: 'description', label: 'Description' },
      { key: 'actor', label: 'Actor' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'preconditions', label: 'Preconditions' },
      { key: 'mainFlow', label: 'Main Flow' },
      { key: 'alternativeFlows', label: 'Alternative Flows' },
      { key: 'postconditions', label: 'Postconditions' },
    ];

    const custom = customDefs.map((def) => ({
      key: def.id,
      label: def.name,
    }));

    return [...base, ...custom];
  }, [getDefinitionsForType]);

  const testCaseColumnsDynamic = useMemo(() => {
    const customDefs = getDefinitionsForType('testCase');
    const base: { key: string; label: string; alwaysVisible?: boolean }[] = [
      { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
      { key: 'revision', label: 'Rev' },
      { key: 'description', label: 'Description' },
      { key: 'requirements', label: 'Requirements' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'lastRun', label: 'Last Run' },
      { key: 'created', label: 'Created' },
    ];

    const custom = customDefs.map((def) => ({
      key: def.id,
      label: def.name,
    }));

    return [...base, ...custom];
  }, [getDefinitionsForType]);

  const informationColumnsDynamic = useMemo(() => {
    const customDefs = getDefinitionsForType('information');
    const base: { key: string; label: string; alwaysVisible?: boolean }[] = [
      { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
      { key: 'revision', label: 'Rev' },
      { key: 'type', label: 'Type' },
      { key: 'text', label: 'Content' },
      { key: 'created', label: 'Created' },
    ];

    const custom = customDefs.map((def) => ({
      key: def.id,
      label: def.name,
    }));

    return [...base, ...custom];
  }, [getDefinitionsForType]);

  const riskColumnsDynamic = useMemo(() => {
    const customDefs = getDefinitionsForType('risk');
    const base: { key: string; label: string; alwaysVisible?: boolean }[] = [
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

    const custom = customDefs.map((def) => ({
      key: def.id,
      label: def.name,
    }));

    return [...base, ...custom];
  }, [getDefinitionsForType]);

  const documentColumnsDynamic = useMemo(() => {
    const customDefs = getDefinitionsForType('document');
    const base: { key: string; label: string; alwaysVisible?: boolean }[] = [
      { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
      { key: 'revision', label: 'Rev' },
      { key: 'status', label: 'Status' },
      { key: 'author', label: 'Author' },
      { key: 'structure', label: 'Items' },
      { key: 'created', label: 'Created' },
      { key: 'description', label: 'Description' },
    ];

    const custom = customDefs.map((def) => ({
      key: def.id,
      label: def.name,
    }));

    return [...base, ...custom];
  }, [getDefinitionsForType]);

  // Import/Export handlers
  const importExport = useImportExport();

  // User context
  const { currentUser } = useUser();

  // Background tasks
  const { startTask, endTask } = useBackgroundTaskActions();

  const handleOpenProjectSettings = useCallback(() => ui.setIsProjectSettingsOpen(true), [ui]);
  // Demo data (empty folders only), with double-click confirmation
  const { showToast } = useToast();
  const demoConfirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoConfirmedRef = useRef(false);

  const handleLoadDemoData = useCallback(async () => {
    // If not confirmed yet, show toast and wait for second click
    if (!demoConfirmedRef.current) {
      demoConfirmedRef.current = true;
      showToast('Click again to fill this project with demo data.', 'info');

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

    const taskId = startTask('Loading demo data...');
    try {
      await loadDemoData();
      await reloadData();
      await refreshStatus(); // Refresh git status so pending changes show up
      showToast('Demo data loaded', 'success');
    } catch (error) {
      console.error('Failed to load demo data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to load demo data: ${errorMessage}`, 'error');
    } finally {
      endTask(taskId);
    }
  }, [reloadData, refreshStatus, startTask, endTask, showToast]);

  // Demo data only goes into a project that has nothing in it yet
  const isEmptyProject = [requirements, useCases, testCases, information, documents].every(
    (items) => items.length === 0
  );

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
    return '';
  };

  return (
    <Layout
      projectName={project.name}
      onOpenProjectSettings={handleOpenProjectSettings}
      onLoadDemoData={isEmptyProject ? handleLoadDemoData : undefined}
      onNewRequirement={() => ui.setIsNewRequirementModalOpen(true)}
      onNewUseCase={() => ui.setIsUseCaseModalOpen(true)}
      onNewTestCase={() => ui.setIsNewTestCaseModalOpen(true)}
      onNewInformation={() => ui.setIsInformationModalOpen(true)}
      onNewRisk={() => ui.setIsRiskModalOpen(true)}
      onNewWorkflow={() => ui.setIsWorkflowModalOpen(true)}
      onNewLink={() => navigate('/links')}
      onNewCustomAttribute={() => ui.setIsCustomAttributeModalOpen(true)}
      onNewDocument={() => ui.openModal('document')}
      onExport={importExport.handleExport}
      onImport={importExport.handleImport}
      onImportExcel={importExport.handleImportExcel}
      onOpenExportModal={() => ui.setIsExportModalOpen(true)}
      onOpenAdvancedSearch={() => ui.setIsAdvancedSearchOpen(true)}
      onViewHistory={() => ui.setIsVersionHistoryOpen(true)}
      onOpenUserSettings={() => ui.setIsUserSettingsModalOpen(true)}
      onHelp={() => navigate('/help')}
      onChangeFolder={changeDirectory}
      currentUserName={currentUser?.name}
      baselines={baselines}
      onExportPDF={async (selectedBaseline) => {
        const taskId = startTask('Exporting PDF...');
        try {
          const { exportProjectToPDF } = await import('../utils/pdfExportUtils');
          await exportProjectToPDF(
            project,
            {
              requirements: requirements,
              useCases: useCases,
              testCases: testCases,
              information: information,
            },
            activeIds(requirements),
            activeIds(useCases),
            activeIds(testCases),
            activeIds(information),
            baselines,
            selectedBaseline, // selectedBaseline: ProjectBaseline | null
            currentUser?.name,
            true,
            documents
          );
        } finally {
          endTask(taskId);
        }
      }}
      onExportExcel={async () => {
        const taskId = startTask('Exporting Excel...');
        try {
          const { exportProjectToExcel } = await import('../utils/excelExportUtils');
          await exportProjectToExcel(
            project,
            {
              requirements: requirements,
              useCases: useCases,
              testCases: testCases,
              information: information,
            },
            activeIds(requirements),
            activeIds(useCases),
            activeIds(testCases),
            activeIds(information),
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
            <h2
              style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, letterSpacing: '-0.02em' }}
            >
              {getPageTitle()}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(location.pathname === '/requirements' ||
              location.pathname.includes('/requirements/detailed')) && (
              <>
                <button
                  onClick={() => ui.setIsNewRequirementModalOpen(true)}
                  className="tf-btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '32px',
                    padding: '0 12px',
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
                <GenericColumnSelector
                  columns={requirementColumns}
                  visibleColumns={ui.columnVisibility as Record<string, boolean>}
                  onColumnVisibilityChange={(columns) => {
                    ui.setColumnVisibility(columns as ColumnVisibility);
                    try {
                      localStorage.setItem('column-visibility', JSON.stringify(columns));
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
                  className="tf-btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '32px',
                    padding: '0 12px',
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
                <GenericColumnSelector
                  columns={useCaseColumnsDynamic}
                  visibleColumns={ui.useCaseColumnVisibility as Record<string, boolean>}
                  onColumnVisibilityChange={(cols) =>
                    ui.setUseCaseColumnVisibility(cols as UseCaseColumnVisibility)
                  }
                />
              </>
            )}
            {location.pathname.includes('/test-cases') && (
              <>
                <button
                  onClick={() => ui.setIsNewTestCaseModalOpen(true)}
                  className="tf-btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '32px',
                    padding: '0 12px',
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
                <GenericColumnSelector
                  columns={testCaseColumnsDynamic}
                  visibleColumns={ui.testCaseColumnVisibility as Record<string, boolean>}
                  onColumnVisibilityChange={(cols) =>
                    ui.setTestCaseColumnVisibility(cols as TestCaseColumnVisibility)
                  }
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
                  className="tf-btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '32px',
                    padding: '0 12px',
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
                <GenericColumnSelector
                  columns={informationColumnsDynamic}
                  visibleColumns={ui.informationColumnVisibility as Record<string, boolean>}
                  onColumnVisibilityChange={(cols) =>
                    ui.setInformationColumnVisibility(cols as InformationColumnVisibility)
                  }
                />
              </>
            )}
            {location.pathname.includes('/risks') && (
              <>
                <button
                  onClick={() => ui.setIsRiskModalOpen(true)}
                  className="tf-btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '32px',
                    padding: '0 12px',
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
                <GenericColumnSelector
                  columns={riskColumnsDynamic}
                  visibleColumns={ui.riskColumnVisibility as Record<string, boolean>}
                  onColumnVisibilityChange={(cols) =>
                    ui.setRiskColumnVisibility(cols as RiskColumnVisibility)
                  }
                />
              </>
            )}
            {location.pathname.includes('/documents') && (
              <>
                <button
                  onClick={() => {
                    ui.setEditingDocument(null);
                    ui.setIsEditDocumentModalOpen(true);
                  }}
                  className="tf-btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '32px',
                    padding: '0 12px',
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
                <GenericColumnSelector
                  columns={documentColumnsDynamic}
                  visibleColumns={ui.documentColumnVisibility as Record<string, boolean>}
                  onColumnVisibilityChange={(cols) =>
                    ui.setDocumentColumnVisibility(cols as DocumentColumnVisibility)
                  }
                />
              </>
            )}
            {location.pathname.includes('/links') && (
              <button
                onClick={() => {
                  // No preset source: the user picks one in the modal
                  ui.setLinkSourceId(null);
                  ui.setIsLinkModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '32px',
                  padding: '0 12px',
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-on-accent)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
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
                  height: '32px',
                  padding: '0 12px',
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-on-accent)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
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
                  height: '32px',
                  padding: '0 12px',
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-on-accent)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
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

      <Suspense fallback={<PageLoadingFallback />}>
        <Outlet />
      </Suspense>

      <ModalManager />
    </Layout>
  );
};
