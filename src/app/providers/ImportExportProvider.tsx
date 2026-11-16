import React, { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useImportExport as useImportExportHook } from '../../hooks/useImportExport';
import { useGlobalState } from './GlobalStateProvider';
import { useProject } from './ProjectProvider';
import { useBackgroundTaskActions } from './BackgroundTasksProvider';
import { useDocuments } from './ArtifactProviders';
import { useFileSystem } from './FileSystemProvider';
import { useToast } from './ToastProvider';
import { idService } from '../../services/idService';
import { ARTIFACT_CONFIG } from '../../constants/artifactConfig';
import {
  IMPORT_KINDS,
  maxIdNumber,
  countImported,
  type ImportBundle,
} from '../../utils/importUtils';
import { debug } from '../../utils/debug';

/** Maps import kinds to IdService counter types */
const COUNTER_TYPES = {
  requirements: 'requirements',
  useCases: 'usecases',
  testCases: 'testcases',
  information: 'information',
  risks: 'risks',
  documents: 'documents',
} as const;

interface ImportExportContextValue {
  handleExport: () => void;
  handleImport: () => void;
  handleImportExcel: () => void;
}

const ImportExportContext = createContext<ImportExportContextValue | undefined>(undefined);

export const ImportExportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { project } = useProject();
  const { requirements, useCases, testCases, information, risks } = useGlobalState();
  const { startTask, endTask } = useBackgroundTaskActions();
  const { showToast } = useToast();
  const fileSystem = useFileSystem();
  const { documents } = useDocuments();

  /**
   * Persist imported artifacts to disk, merging by ID.
   * Existing artifacts are only overwritten after explicit confirmation.
   */
  const applyImport = useCallback(
    async (bundle: ImportBundle) => {
      const existingIds = new Set<string>([
        ...fileSystem.requirements.map((a) => a.id),
        ...fileSystem.useCases.map((a) => a.id),
        ...fileSystem.testCases.map((a) => a.id),
        ...fileSystem.information.map((a) => a.id),
        ...fileSystem.risks.map((a) => a.id),
        ...fileSystem.documents.map((a) => a.id),
        ...fileSystem.links.map((a) => a.id),
      ]);
      const total = countImported(bundle);
      const overwrites = [
        ...IMPORT_KINDS.flatMap((kind) => bundle[kind].map((a) => a.id)),
        ...bundle.links.map((l) => l.id),
      ].filter((id) => existingIds.has(id));

      if (overwrites.length > 0) {
        const preview = overwrites.slice(0, 5).join(', ') + (overwrites.length > 5 ? ', …' : '');
        const confirmed = window.confirm(
          `Import ${total} artifact(s)?\n\n${overwrites.length} existing artifact(s) with the same ID ` +
            `will be overwritten: ${preview}`
        );
        if (!confirmed) {
          showToast('Import cancelled', 'info');
          return;
        }
      }

      const taskId = startTask(`Importing ${total} artifact(s)...`);
      try {
        for (const r of bundle.requirements) await fileSystem.saveRequirement(r);
        for (const u of bundle.useCases) await fileSystem.saveUseCase(u);
        for (const t of bundle.testCases) await fileSystem.saveTestCase(t);
        for (const i of bundle.information) await fileSystem.saveInformation(i);
        for (const r of bundle.risks) await fileSystem.saveRisk(r);
        for (const d of bundle.documents) await fileSystem.saveDocument(d);
        for (const l of bundle.links) await fileSystem.saveLink(l);

        // Bump ID counters past imported IDs so new artifacts don't collide with them
        for (const kind of IMPORT_KINDS) {
          const type = COUNTER_TYPES[kind];
          const highest = maxIdNumber(
            bundle[kind].map((a) => a.id),
            ARTIFACT_CONFIG[type].idPrefix
          );
          if (highest > 0) {
            try {
              await idService.ensureCounterAtLeast(type, highest);
            } catch (err) {
              debug.warn(`[import] Failed to bump ${type} counter:`, err);
            }
          }
        }

        const highestLink = maxIdNumber(
          bundle.links.map((l) => l.id),
          ARTIFACT_CONFIG.links.idPrefix
        );
        if (highestLink > 0) {
          try {
            await idService.ensureCounterAtLeast('links', highestLink);
          } catch (err) {
            debug.warn('[import] Failed to bump links counter:', err);
          }
        }

        showToast(`Imported ${total} artifact(s)`, 'success');
      } finally {
        endTask(taskId);
      }
    },
    [fileSystem, showToast, startTask, endTask]
  );

  const importExportHook = useImportExportHook({
    project,
    requirements,
    useCases,
    testCases,
    information,
    risks,
    documents,
    applyImport,
    notify: showToast,
  });

  // Wrap handleExport with progress status
  const handleExport = useCallback(async () => {
    const taskId = startTask('Exporting JSON...');
    try {
      await importExportHook.handleExport();
    } finally {
      endTask(taskId);
    }
  }, [importExportHook, startTask, endTask]);

  const value: ImportExportContextValue = {
    handleExport,
    handleImport: importExportHook.handleImport,
    handleImportExcel: importExportHook.handleImportExcel,
  };

  return <ImportExportContext.Provider value={value}>{children}</ImportExportContext.Provider>;
};

export const useImportExport = (): ImportExportContextValue => {
  const context = useContext(ImportExportContext);
  if (context === undefined) {
    throw new Error('useImportExport must be used within an ImportExportProvider');
  }
  return context;
};
