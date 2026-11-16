import { activeIds } from '../utils/activeArtifacts';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Risk,
  Project,
  ArtifactDocument,
} from '../types';
import { exportProjectToJSON } from '../utils/jsonExportUtils';
import {
  parseJsonImport,
  parseExcelFile,
  countImported,
  describeSkipped,
  type ImportBundle,
} from '../utils/importUtils';

export type ImportNotify = (
  message: string,
  type: 'info' | 'warning' | 'error' | 'success'
) => void;

interface UseImportExportProps {
  project: Project;
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  risks: Risk[];
  documents: ArtifactDocument[];
  /** Persist validated imported artifacts (merge by ID, never wipe existing data) */
  applyImport: (bundle: ImportBundle) => Promise<void>;
  /** Show a user-facing message (toast) */
  notify: ImportNotify;
}

export function useImportExport({
  project,
  requirements,
  useCases,
  testCases,
  information,
  risks,
  documents,
  applyImport,
  notify,
}: UseImportExportProps) {
  const handleExport = async () => {
    try {
      await exportProjectToJSON(
        project,
        {
          requirements,
          useCases,
          testCases,
          information,
          documents,
        },
        activeIds(requirements),
        activeIds(useCases),
        activeIds(testCases),
        activeIds(information),
        activeIds(risks),
        activeIds(documents)
      );
    } catch (error) {
      console.error('Failed to export project:', error);
      notify('Failed to export project: ' + error, 'error');
    }
  };

  /**
   * Validate the parsed bundle and hand it to the persistence callback.
   */
  const importBundle = async (bundle: ImportBundle) => {
    const skippedMessage = describeSkipped(bundle.skipped);
    if (countImported(bundle) === 0) {
      notify(skippedMessage || 'No artifacts found in file', 'warning');
      return;
    }
    if (skippedMessage) {
      notify(skippedMessage, 'warning');
    }
    try {
      await applyImport(bundle);
    } catch (error) {
      console.error('Failed to import artifacts:', error);
      notify(`Import failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  const pickFile = (accept: string, onFile: (file: File) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFile(file);
    };
    input.click();
  };

  const handleImport = () => {
    pickFile('.json', (file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        let bundle: ImportBundle;
        try {
          bundle = parseJsonImport(event.target?.result as string);
        } catch (error) {
          notify(
            `Failed to parse JSON file: ${error instanceof Error ? error.message : String(error)}`,
            'error'
          );
          return;
        }
        void importBundle(bundle);
      };
      reader.readAsText(file);
    });
  };

  const handleImportExcel = () => {
    pickFile('.xlsx,.xls', (file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        let bundle: ImportBundle;
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          bundle = await parseExcelFile(data);
        } catch (error) {
          console.error('Failed to parse Excel file:', error);
          notify(
            `Failed to parse Excel file: ${error instanceof Error ? error.message : String(error)}`,
            'error'
          );
          return;
        }
        void importBundle(bundle);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  return {
    handleExport,
    handleImport,
    handleImportExcel,
  };
}
