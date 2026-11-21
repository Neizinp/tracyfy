import { useCallback } from 'react';
import { useImportExport } from './useImportExport';
import { IMPORT_KINDS, countImported, type ImportBundle } from '../utils/importUtils';
import { useAppStore, useAppStoreApi } from '../state';

/**
 * Export the project to JSON and import JSON or Excel into it: the import
 * merges by ID and overwrites existing artifacts only after confirmation.
 */
export function useProjectImportExport() {
  const project = useAppStore((s) => s.project);
  const artifacts = useAppStore((s) => s.artifacts);
  const store = useAppStoreApi();
  const startTask = useAppStore((s) => s.startTask);
  const endTask = useAppStore((s) => s.endTask);
  const showToast = useAppStore((s) => s.showToast);

  /**
   * Persist imported artifacts to disk, merging by ID.
   * Existing artifacts are only overwritten after explicit confirmation.
   */
  const applyImport = useCallback(
    async (bundle: ImportBundle) => {
      const { artifacts: current, links, saveArtifact, saveLink } = store.getState();
      const existingIds = new Set<string>([
        ...Object.values(current).flatMap((items) => items.map((a) => a.id)),
        ...links.map((a) => a.id),
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
        for (const r of bundle.requirements) await saveArtifact('requirement', r);
        for (const u of bundle.useCases) await saveArtifact('useCase', u);
        for (const t of bundle.testCases) await saveArtifact('testCase', t);
        for (const i of bundle.information) await saveArtifact('information', i);
        for (const r of bundle.risks) await saveArtifact('risk', r);
        for (const d of bundle.documents) await saveArtifact('document', d);
        for (const l of bundle.links) await saveLink(l);

        showToast(`Imported ${total} artifact(s)`, 'success');
      } finally {
        endTask(taskId);
      }
    },
    [store, showToast, startTask, endTask]
  );

  const importExportHook = useImportExport({
    project,
    requirements: artifacts.requirement,
    useCases: artifacts.useCase,
    testCases: artifacts.testCase,
    information: artifacts.information,
    risks: artifacts.risk,
    documents: artifacts.document,
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

  return {
    handleExport,
    handleImport: importExportHook.handleImport,
    handleImportExcel: importExportHook.handleImportExcel,
  };
}
