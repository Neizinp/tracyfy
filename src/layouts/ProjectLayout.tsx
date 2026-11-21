import React, { Suspense, useCallback, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Layout, ModalManager } from '../components';
import { ArtifactColumnSelector } from '../ui/generic/ArtifactColumnSelector';
import { kind, kindOfFolder } from '../domain/artifactKinds';
import { useProjectImport } from '../hooks/useProjectImport';
import { loadDemoData } from '../services/demoDataService';
import { useAppStore } from '../state';

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
  /** The kind whose list is shown, if any: /use-cases -> 'useCase' */
  const pageKind = kindOfFolder(location.pathname.split('/')[1] ?? '');
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);

  // Global state
  const artifacts = useAppStore((s) => s.artifacts);

  // FileSystem context
  const reloadData = useAppStore((s) => s.reload);
  const refreshStatus = useAppStore((s) => s.refreshStatus);
  const changeDirectory = useAppStore((s) => s.closeFolder);

  // Import/Export handlers
  const importExport = useProjectImport();

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
  const isEmptyProject = Object.values(artifacts).every((items) => items.length === 0);

  // Get page title from current route
  const getPageTitle = () => {
    if (pageKind) return kind(pageKind).label.plural;
    if (location.pathname.includes('/traceability')) return 'Traceability Dashboard';
    if (location.pathname.includes('/links')) return 'Links';
    if (location.pathname.includes('/review')) return 'Review';
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
      onNewLink={() => navigate('/links')}
      onNewCustomAttribute={() => openModal('custom-attribute')}
      onNewDocument={() => openModal('document')}
      onImport={importExport.handleImport}
      onImportExcel={importExport.handleImportExcel}
      onOpenExportModal={() => openModal('export')}
      onOpenAdvancedSearch={() => openModal('search')}
      onViewHistory={() => openModal('history')}
      onOpenUserSettings={() => openModal('user-settings')}
      onHelp={() => navigate('/help')}
      onChangeFolder={changeDirectory}
      currentUserName={currentUser?.name}
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
            {pageKind && (
              <>
                <button
                  onClick={() => {
                    setSelectedArtifact(null);
                    openModal(pageKind);
                  }}
                  className="tf-btn-primary tf-toolbar-button"
                >
                  <Plus size={16} />
                  Add
                </button>
                <ArtifactColumnSelector kindId={pageKind} />
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
