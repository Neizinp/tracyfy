import { useCallback } from 'react';
import { ARTIFACT_KINDS } from '../domain/artifactKinds';
import { countImported, describeSkipped, type ImportBundle } from '../export/importBundle';
import { useAppStore, useAppStoreApi } from '../state';
import type { ArtifactByKind } from '../types';

/** Let the user pick a file; `onFile` gets it */
function pickFile(accept: string, onFile: (file: File) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) onFile(file);
  };
  input.click();
}

function readFile(file: File, as: 'text'): Promise<string>;
function readFile(file: File, as: 'bytes'): Promise<Uint8Array>;
function readFile(file: File, as: 'text' | 'bytes'): Promise<string | Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(
        as === 'text' ? (reader.result as string) : new Uint8Array(reader.result as ArrayBuffer)
      );
    reader.onerror = () => reject(reader.error);
    if (as === 'text') reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * Import a JSON export or an Excel workbook into the project. Artifacts are
 * merged by ID; existing ones are overwritten only after confirmation. The
 * imported files are ordinary pending changes.
 */
export function useProjectImport() {
  const store = useAppStoreApi();
  const showToast = useAppStore((s) => s.showToast);

  const apply = useCallback(
    async (bundle: ImportBundle) => {
      const skipped = describeSkipped(bundle.skipped);
      const total = countImported(bundle);
      if (total === 0) {
        showToast(skipped || 'No artifacts found in the file', 'warning');
        return;
      }
      if (skipped) showToast(skipped, 'warning');

      const { artifacts, links, saveArtifact, saveLink, startTask, endTask } = store.getState();
      const existing = new Set([
        ...Object.values(artifacts).flatMap((items) => items.map((a) => a.id)),
        ...links.map((l) => l.id),
      ]);
      const overwrites = [
        ...Object.values(bundle.artifacts).flatMap((items) => items.map((a) => a.id)),
        ...bundle.links.map((l) => l.id),
      ].filter((id) => existing.has(id));
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
        for (const k of ARTIFACT_KINDS) {
          for (const a of bundle.artifacts[k.id]) {
            await saveArtifact(k.id, a as ArtifactByKind[typeof k.id]);
          }
        }
        for (const l of bundle.links) await saveLink(l);
        showToast(`Imported ${total} artifact(s)`, 'success');
      } catch (err) {
        console.error('Import failed:', err);
        showToast(`Import failed: ${message(err)}`, 'error');
      } finally {
        endTask(taskId);
      }
    },
    [store, showToast]
  );

  const handleImport = useCallback(() => {
    pickFile('.json', async (file) => {
      let bundle: ImportBundle;
      try {
        const { parseJson } = await import('../export/json');
        bundle = parseJson(await readFile(file, 'text'));
      } catch (err) {
        showToast(`Could not read the JSON file: ${message(err)}`, 'error');
        return;
      }
      await apply(bundle);
    });
  }, [apply, showToast]);

  const handleImportExcel = useCallback(() => {
    pickFile('.xlsx,.xls', async (file) => {
      let bundle: ImportBundle;
      try {
        const [XLSX, { parseWorkbook }] = await Promise.all([
          import('xlsx'),
          import('../export/excel'),
        ]);
        const wb = XLSX.read(await readFile(file, 'bytes'), { type: 'array' });
        bundle = parseWorkbook(XLSX, wb, store.getState().attributeDefinitions);
      } catch (err) {
        showToast(`Could not read the Excel file: ${message(err)}`, 'error');
        return;
      }
      await apply(bundle);
    });
  }, [apply, showToast, store]);

  return { handleImport, handleImportExcel };
}
