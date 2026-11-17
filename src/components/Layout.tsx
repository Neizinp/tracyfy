import type { ProjectBaseline } from '../types';
import { FileProblemsNotice } from './FileProblemsNotice';
import { Sidebar } from './layout/Sidebar';
import { HeaderBar } from './layout/HeaderBar';

export interface LayoutProps {
  children: React.ReactNode;
  projectName: string;
  onOpenProjectSettings: () => void;
  onLoadDemoData?: () => void;
  onNewRequirement: () => void;
  onNewUseCase?: () => void;
  onNewTestCase?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onViewHistory?: () => void;
  onExportPDF?: (selectedBaseline: ProjectBaseline | null) => void;
  onExportExcel?: () => void;
  onImportExcel?: () => void;
  onOpenExportModal?: () => void;
  onSearch?: (query: string) => void;
  onNewInformation?: () => void;
  onNewRisk?: () => void;
  onNewWorkflow?: () => void;
  onNewLink?: () => void;
  onNewCustomAttribute?: () => void;
  onNewDocument?: () => void;
  baselines?: ProjectBaseline[];
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
  projectName,
  onOpenProjectSettings,
  onLoadDemoData,
  onNewRequirement,
  onNewUseCase,
  onNewTestCase,
  onExport,
  onImport,
  onViewHistory,
  onExportPDF,
  onExportExcel,
  onImportExcel,
  onOpenExportModal,
  onSearch,
  onNewInformation,
  onNewRisk,
  onNewWorkflow,
  onNewLink,
  onNewCustomAttribute,
  onNewDocument,
  baselines = [],
  onOpenUserSettings,
  currentUserName,
  onOpenAdvancedSearch,
  onHelp,
  onChangeFolder,
}) => {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        projectName={projectName}
        onOpenProjectSettings={onOpenProjectSettings}
        onLoadDemoData={onLoadDemoData}
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

        <FileProblemsNotice />

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
        </div>
      </main>
    </div>
  );
};
