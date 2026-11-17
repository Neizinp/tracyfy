import React, { Suspense, useCallback, useRef, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Layout, ModalManager } from '../components';
import { GenericColumnSelector } from '../components/GenericColumnSelector';
import { useCustomAttributes } from '../hooks/useCustomAttributes';
import { useProjectImportExport } from '../hooks/useProjectImportExport';
import { loadDemoData } from '../services/demoDataService';
import { activeIds } from '../utils/activeArtifacts';
import type { ExportOptions } from '../types';
import { useAppStore } from '../state';
import type { ColumnsByKind } from '../state';

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
  const project = useAppStore((s) => s.project);
  const location = useLocation();
  const navigate = useNavigate();

  // UI state
  const openModal = useAppStore((s) => s.openModal);
  const openLinkDialog = useAppStore((s) => s.openLinkDialog);
  const setSelectedArtifact = useAppStore((s) => s.setSelectedArtifact);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const columnVisibility = useAppStore((s) => s.columnVisibility);
  const setColumnVisibility = useAppStore((s) => s.setColumnVisibility);

  // Global state
  const requirements = useAppStore((s) => s.artifacts.requirement);
  const useCases = useAppStore((s) => s.artifacts.useCase);
  const testCases = useAppStore((s) => s.artifacts.testCase);
  const information = useAppStore((s) => s.artifacts.information);
  const documents = useAppStore((s) => s.artifacts.document);

  // FileSystem context
  const reloadData = useAppStore((s) => s.reload);
  const refreshStatus = useAppStore((s) => s.refreshStatus);
  const changeDirectory = useAppStore((s) => s.closeFolder);

  // Baselines context
  const baselines = useAppStore((s) => s.baselines);

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
  const importExport = useProjectImportExport();

  // User context
  const currentUser = useAppStore((s) => s.currentUser);

  // Background tasks
  const startTask = useAppStore((s) => s.startTask);
  const endTask = useAppStore((s) => s.endTask);

  const handleOpenProjectSettings = useCallback(() => openModal('project-settings'), [openModal]);
  // Demo data (empty folders only), with double-click confirmation
  const showToast = useAppStore((s) => s.showToast);
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
      onNewRequirement={() => openModal('requirement')}
      onNewUseCase={() => openModal('useCase')}
      onNewTestCase={() => openModal('testCase')}
      onNewInformation={() => openModal('information')}
      onNewRisk={() => openModal('risk')}
      onNewWorkflow={() => openModal('workflow')}
      onNewLink={() => navigate('/links')}
      onNewCustomAttribute={() => openModal('custom-attribute')}
      onNewDocument={() => openModal('document')}
      onExport={importExport.handleExport}
      onImport={importExport.handleImport}
      onImportExcel={importExport.handleImportExcel}
      onOpenExportModal={() => openModal('export')}
      onOpenAdvancedSearch={() => openModal('search')}
      onViewHistory={() => openModal('history')}
      onOpenUserSettings={() => openModal('user-settings')}
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
      onSearch={setSearchQuery}
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
                  onClick={() => openModal('requirement')}
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
                  visibleColumns={columnVisibility.requirement as Record<string, boolean>}
                  onColumnVisibilityChange={(columns) => {
                    setColumnVisibility('requirement', columns as ColumnsByKind['requirement']);
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
                    setSelectedArtifact(null);
                    openModal('useCase');
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
                  visibleColumns={columnVisibility.useCase as Record<string, boolean>}
                  onColumnVisibilityChange={(cols) =>
                    setColumnVisibility('useCase', cols as ColumnsByKind['useCase'])
                  }
                />
              </>
            )}
            {location.pathname.includes('/test-cases') && (
              <>
                <button
                  onClick={() => openModal('testCase')}
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
                  visibleColumns={columnVisibility.testCase as Record<string, boolean>}
                  onColumnVisibilityChange={(cols) =>
                    setColumnVisibility('testCase', cols as ColumnsByKind['testCase'])
                  }
                />
              </>
            )}
            {location.pathname.includes('/information') && (
              <>
                <button
                  onClick={() => {
                    setSelectedArtifact(null);
                    openModal('information');
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
                  visibleColumns={columnVisibility.information as Record<string, boolean>}
                  onColumnVisibilityChange={(cols) =>
                    setColumnVisibility('information', cols as ColumnsByKind['information'])
                  }
                />
              </>
            )}
            {location.pathname.includes('/risks') && (
              <>
                <button
                  onClick={() => openModal('risk')}
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
                  visibleColumns={columnVisibility.risk as Record<string, boolean>}
                  onColumnVisibilityChange={(cols) =>
                    setColumnVisibility('risk', cols as ColumnsByKind['risk'])
                  }
                />
              </>
            )}
            {location.pathname.includes('/documents') && (
              <>
                <button
                  onClick={() => {
                    setSelectedArtifact(null);
                    openModal('document', true);
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
                  visibleColumns={columnVisibility.document as Record<string, boolean>}
                  onColumnVisibilityChange={(cols) =>
                    setColumnVisibility('document', cols as ColumnsByKind['document'])
                  }
                />
              </>
            )}
            {location.pathname.includes('/links') && (
              <button
                onClick={() => {
                  // No preset source: the user picks one in the modal
                  openLinkDialog(null);
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
                onClick={() => openModal('custom-attribute')}
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
                onClick={() => openModal('workflow')}
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
