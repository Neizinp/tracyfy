import type { Project, ProjectBaseline } from '../types';
import { Sidebar } from './layout/Sidebar';
import { HeaderBar } from './layout/HeaderBar';

export interface LayoutProps {
  children: React.ReactNode;
  projects: Project[];
  currentProjectId: string;
  onSwitchProject: (projectId: string) => void;
  onCreateProject: () => void;
  onCreateDemoProject?: () => void;
  onOpenProjectSettings: (project: Project) => void;
  onNewRequirement: () => void;
  onNewUseCase?: () => void;
  onNewTestCase?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onViewHistory?: () => void;
  onExportPDF?: (selectedBaseline: ProjectBaseline | null) => void;
  onExportExcel?: () => void;
  onImportExcel?: () => void;
  onOpenGlobalLibrary?: () => void;
  onOpenLibraryTab?: (
    tab: 'requirements' | 'usecases' | 'testcases' | 'information' | 'risks'
  ) => void;
  onOpenExportModal?: () => void;
  onSearch?: (query: string) => void;
  onNewInformation?: () => void;
  onNewRisk?: () => void;
  onNewWorkflow?: () => void;
  onNewLink?: () => void;
  onNewCustomAttribute?: () => void;
  onNewDocument?: () => void;
  baselines?: ProjectBaseline[];
  rightPanel?: React.ReactNode;
  onOpenUserSettings?: () => void;
  currentUserName?: string;
  onOpenAdvancedSearch?: () => void;
  onHelp?: () => void;
  onChangeFolder?: () => void;
}

/**
 * Main layout component that composes Sidebar and HeaderBar.
 * Reduced from ~1187 lines to ~60 lines through component extraction.
 */
export const Layout: React.FC<LayoutProps> = ({
  children,
  projects,
  currentProjectId,
  onSwitchProject,
  onCreateProject,
  onCreateDemoProject,
  onOpenProjectSettings,
  onNewRequirement,
  onNewUseCase,
  onNewTestCase,
  onExport,
  onImport,
  onViewHistory,
  onExportPDF,
  onExportExcel,
  onImportExcel,
  onOpenGlobalLibrary,
  onOpenLibraryTab,
  onOpenExportModal,
  onSearch,
  onNewInformation,
  onNewRisk,
  onNewWorkflow,
  onNewLink,
  onNewCustomAttribute,
  onNewDocument,
  baselines = [],
  rightPanel,
  onOpenUserSettings,
  currentUserName,
  onOpenAdvancedSearch,
  onHelp,
  onChangeFolder,
}) => {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        projects={projects}
        currentProjectId={currentProjectId}
        onSwitchProject={onSwitchProject}
        onCreateProject={onCreateProject}
        onCreateDemoProject={onCreateDemoProject}
        onOpenProjectSettings={onOpenProjectSettings}
        onOpenLibraryTab={onOpenLibraryTab}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <HeaderBar
          onSearch={onSearch}
          onViewHistory={onViewHistory}
          onNewRequirement={onNewRequirement}
          onNewUseCase={onNewUseCase}
          onNewTestCase={onNewTestCase}
          onNewInformation={onNewInformation}
          onNewRisk={onNewRisk}
          onNewWorkflow={onNewWorkflow}
          onNewLink={onNewLink}
          onNewCustomAttribute={onNewCustomAttribute}
          onNewDocument={onNewDocument}
          onImport={onImport}
          onImportExcel={onImportExcel}
          onOpenGlobalLibrary={onOpenGlobalLibrary}
          onOpenExportModal={onOpenExportModal}
          onExport={onExport}
          onExportPDF={onExportPDF}
          onExportExcel={onExportExcel}
          baselines={baselines}
          onOpenUserSettings={onOpenUserSettings}
          currentUserName={currentUserName}
          onOpenAdvancedSearch={onOpenAdvancedSearch}
          onHelp={onHelp}
          onChangeFolder={onChangeFolder}
        />

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              padding: 'var(--spacing-lg)',
            }}
          >
            {children}
          </div>
          {rightPanel && (
            <div
              style={{
                width: '350px',
                borderLeft: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {rightPanel}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
