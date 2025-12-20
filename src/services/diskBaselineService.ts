import { BaseDiskService } from './baseDiskService';
import type { ProjectBaseline } from '../types';
import { debug } from '../utils/debug';

const BASELINES_DIR = 'baselines';

export class DiskBaselineService extends BaseDiskService {
  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    await this.ensureDirectory(BASELINES_DIR);
  }

  /**
   * Load all baselines for a project or all projects
   */
  async loadBaselines(projectId?: string): Promise<ProjectBaseline[]> {
    try {
      const files = await this.listFiles(BASELINES_DIR);
      const baselines: ProjectBaseline[] = [];

      for (const file of files) {
        if (!file.endsWith('.json') && !file.endsWith('.md')) continue;

        const baseline = await this.readJsonFile<ProjectBaseline>(`${BASELINES_DIR}/${file}`);
        if (baseline) {
          if (!projectId || baseline.projectId === projectId) {
            baselines.push(baseline);
          }
        }
      }

      return baselines.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      debug.log('[DiskBaselineService] Failed to load baselines:', err);
      return [];
    }
  }

  /**
   * Save a baseline
   */
  async saveBaseline(baseline: ProjectBaseline): Promise<void> {
    const filename = `baseline-${baseline.id}.json`;
    await this.writeJsonFile(
      `${BASELINES_DIR}/${filename}`,
      baseline,
      `Baseline created: ${baseline.name} (${baseline.version})`
    );
  }

  /**
   * Delete a baseline
   */
  async deleteBaseline(id: string): Promise<void> {
    const filename = `baseline-${id}.json`;
    await this.deleteFile(`${BASELINES_DIR}/${filename}`, `Baseline deleted: ${id}`);
  }
}

export const diskBaselineService = new DiskBaselineService();
