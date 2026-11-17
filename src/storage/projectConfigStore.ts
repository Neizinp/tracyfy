/**
 * Reads and writes tracyfy.yaml. Changes are serialized (read-modify-write
 * under one lock) and show up in Pending Changes like any other file.
 */
import { fileSystemService } from '../services/fileSystemService';
import {
  PROJECT_CONFIG_FILE,
  defaultProjectConfig,
  parseProjectConfig,
  serializeProjectConfig,
  type ProjectConfig,
} from '../domain/projectConfig';
import { KeyedLock } from '../utils/keyedLock';

class ProjectConfigStore {
  private lock = new KeyedLock();
  private listeners = new Set<() => void>();

  /** The settings; a folder without tracyfy.yaml gets defaults named after the folder */
  async load(): Promise<ProjectConfig> {
    const text = await fileSystemService.readFile(PROJECT_CONFIG_FILE);
    if (text === null) {
      return defaultProjectConfig(fileSystemService.getDirectoryName() || 'Untitled project');
    }
    return parseProjectConfig(text);
  }

  /** Apply a change to the current settings and write them */
  async update(change: (config: ProjectConfig) => ProjectConfig): Promise<ProjectConfig> {
    const updated = await this.lock.run(PROJECT_CONFIG_FILE, async () => {
      const next = change(await this.load());
      await fileSystemService.writeFile(PROJECT_CONFIG_FILE, serializeProjectConfig(next));
      return next;
    });
    this.listeners.forEach((listener) => listener());
    return updated;
  }

  /** Called after every update */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const projectConfigStore = new ProjectConfigStore();
