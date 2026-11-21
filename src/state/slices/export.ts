/**
 * Export: the project (or a baseline of it) as PDF, Excel or JSON, and one
 * document as PDF. The builders in src/export are loaded on demand, since
 * jsPDF and xlsx are large.
 */
import type { StateCreator } from 'zustand';
import type { AppState } from '../store';
import type { ArtifactDocument, ProjectBaseline } from '../../types';
import { repository } from '../../storage/repository';
import { PROJECT_CONFIG_FILE, parseProjectConfig, projectOf } from '../../domain/projectConfig';
import {
  safeFileName,
  stateLabel,
  type ExportOptions,
  type ExportSource,
} from '../../export/exportData';
import { chooseSaveTarget, FILE_KINDS } from '../../export/saveFile';
import { withTask } from './tasks';

export interface ExportSlice {
  /** Ask where to save, then build and write the export; errors become a toast */
  exportProject: (options: ExportOptions) => Promise<void>;
  /** One document, with the artifacts it includes, as PDF */
  exportDocument: (document: ArtifactDocument) => Promise<void>;
}

const FORMAT_LABEL = { pdf: 'PDF', excel: 'Excel', json: 'JSON' } as const;

export const createExportSlice: StateCreator<AppState, [], [], ExportSlice> = (_set, get) => {
  /** The project now, or as it was at a baseline */
  const sourceFor = async (baseline: ProjectBaseline | null): Promise<ExportSource> => {
    const s = get();
    const common = {
      baseline,
      baselines: s.baselines,
      exportedBy: s.currentUser?.name,
      history: (kindId: Parameters<typeof repository.history>[0], id: string) =>
        repository.history(kindId, id),
      readAsset: (path: string) => repository.readAsset(path, baseline?.commit),
    };
    if (!baseline) {
      return {
        ...common,
        project: s.project,
        artifacts: s.artifacts as ExportSource['artifacts'],
        links: s.links,
        attributeDefinitions: s.attributeDefinitions,
      };
    }
    const snapshot = await repository.snapshot(baseline.commit);
    let project = s.project;
    let attributeDefinitions = s.attributeDefinitions;
    const configText = await repository.readAt(PROJECT_CONFIG_FILE, baseline.commit);
    if (configText) {
      try {
        const config = parseProjectConfig(configText);
        project = projectOf(config);
        attributeDefinitions = config.customAttributes;
      } catch (err) {
        console.error(`${PROJECT_CONFIG_FILE} at ${baseline.name} could not be read`, err);
      }
    }
    return {
      ...common,
      project,
      artifacts: snapshot.artifacts,
      links: snapshot.links,
      attributeDefinitions,
    };
  };

  const fail = (what: string, err: unknown) => {
    console.error(`${what} failed:`, err);
    get().showToast(`${what} failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
  };

  return {
    exportProject: async (options) => {
      const s = get();
      const file = FILE_KINDS[options.format];
      const name = `${safeFileName(s.project.name)} - ${safeFileName(stateLabel(options.baseline))}${file.extension}`;
      const what = `${FORMAT_LABEL[options.format]} export`;
      try {
        // First, while the click that started the export still counts
        const target = await chooseSaveTarget(name, file);
        if (!target) return;
        await withTask(s, `Exporting ${FORMAT_LABEL[options.format]}...`, async () => {
          const source = await sourceFor(options.baseline);
          let blob: Blob;
          if (options.format === 'json') {
            const { buildJson } = await import('../../export/json');
            blob = new Blob([JSON.stringify(buildJson(source), null, 2)], { type: file.mime });
          } else {
            const { collectChanges } = await import('../../export/revisionHistory');
            const changes = options.revisionHistory
              ? await collectChanges(source, options.kinds)
              : null;
            if (options.format === 'excel') {
              const [XLSX, { buildWorkbook }] = await Promise.all([
                import('xlsx'),
                import('../../export/excel'),
              ]);
              const wb = buildWorkbook(XLSX, source, options, changes);
              blob = new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], {
                type: file.mime,
              });
            } else {
              const { buildProjectPdf } = await import('../../export/pdf/project');
              blob = (await buildProjectPdf(source, options, changes)).output('blob');
            }
          }
          await target.save(blob);
        });
      } catch (err) {
        fail(what, err);
      }
    },

    exportDocument: async (document) => {
      const s = get();
      const name = `${safeFileName(document.id)}_${safeFileName(document.title)}.pdf`;
      try {
        const target = await chooseSaveTarget(name, FILE_KINDS.pdf);
        if (!target) return;
        await withTask(s, 'Exporting PDF...', async () => {
          const { buildDocumentPdf } = await import('../../export/pdf/project');
          const doc = await buildDocumentPdf(await sourceFor(null), document);
          await target.save(doc.output('blob'));
        });
      } catch (err) {
        fail('PDF export', err);
      }
    },
  };
};
