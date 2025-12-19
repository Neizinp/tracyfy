import { debug } from '../../utils/debug';
import { fileSystemService } from '../fileSystemService';
import { gitCoreService } from './gitCoreService';
import { gitHistoryService } from './gitHistoryService';
import { gitSyncService } from './gitSyncService';
import { gitRemoteService } from './gitRemoteService';
import { gitBaselineService } from './gitBaselineService';
import { type FileStatus, type CommitInfo, type SyncStatus, type ArtifactFolder } from './types';
import type { Requirement, UseCase, TestCase, Information } from '../../types';

class CompositeGitService {
  private _initialized = false;

  public get initialized() {
    return this._initialized;
  }

  public set initialized(value: boolean) {
    this._initialized = value;
    gitCoreService.setInitialized(value);
    gitHistoryService.setInitialized(value);
    gitSyncService.setInitialized(value);
    gitRemoteService.setInitialized(value);
    gitBaselineService.setInitialized(value);
  }
  private commitFilesCache = new Map<string, string[]>();
  private readonly CACHE_FILE = '.tracyfy/commit-cache.json';
  private cacheLoadedFromDisk = false;

  constructor() {
    // Wire up dependencies between services
    gitCoreService.setAddToCacheFn((hash, files) => this.addToCache(hash, files));
    gitCoreService.setEnsureTokenLoadedFn(() => this.ensureTokenLoaded());

    gitSyncService.setFetchFn((remote, branch) => this.fetch(remote, branch));
    gitSyncService.setPushFn((remote, branch) => this.push(remote, branch));
    gitSyncService.setHasRemoteFn((name) => this.hasRemote(name));
    gitSyncService.setReadFileAtCommitFn((path, hash) => this.readFileAtCommit(path, hash));
    gitSyncService.setGetHistoryFn((path, depth, ref) => this.getHistory(path, depth, ref));
  }

  private addToCache(commitHash: string, files: string[]) {
    this.commitFilesCache.set(commitHash, files);
    void this.saveCacheToDisk();
  }

  private async loadCacheFromDisk(): Promise<void> {
    if (this.cacheLoadedFromDisk) return;
    try {
      const content = await fileSystemService.readFile(this.CACHE_FILE);
      if (!content) return;
      const data = JSON.parse(content) as Record<string, string[]>;
      for (const [hash, files] of Object.entries(data)) {
        this.commitFilesCache.set(hash, files);
      }
      debug.log(`[GitService] Loaded ${Object.keys(data).length} cached commit files from disk`);
    } catch {
      // Fine if it doesn't exist
    }
    this.cacheLoadedFromDisk = true;
  }

  private async saveCacheToDisk(): Promise<void> {
    try {
      const data: Record<string, string[]> = {};
      for (const [hash, files] of this.commitFilesCache.entries()) {
        data[hash] = files;
      }
      await fileSystemService.writeFile(this.CACHE_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.warn('[GitService] Failed to save commit cache to disk:', err);
    }
  }

  // Facade Methods (Core)

  async init(directoryHandle?: FileSystemDirectoryHandle): Promise<boolean> {
    const success = await gitCoreService.init(directoryHandle);
    if (success) {
      this.initialized = true;
    }
    return success;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async saveArtifact(type: string, id: string, artifact: object): Promise<void> {
    return gitCoreService.saveArtifact(
      type as ArtifactFolder,
      id,
      artifact as Requirement | UseCase | TestCase | Information
    );
  }

  async deleteArtifact(type: string, id: string): Promise<void> {
    return gitCoreService.deleteArtifact(type as ArtifactFolder, id);
  }

  async renameFile(oldP: string, newP: string, cont: string, msg?: string): Promise<void> {
    return gitCoreService.renameFile(oldP, newP, cont, msg);
  }

  async getStatus(): Promise<FileStatus[]> {
    return gitCoreService.getStatus();
  }

  async commitFile(path: string, msg: string, author?: string): Promise<void> {
    return gitCoreService.commitFile(path, msg, author);
  }

  async loadAllArtifacts(): Promise<object> {
    return gitCoreService.loadAllArtifacts();
  }

  // Facade Methods (History)

  async listFilesAtCommit(hash: string): Promise<string[]> {
    return gitHistoryService.listFilesAtCommit(hash);
  }

  async loadProjectSnapshot(hash: string): Promise<object> {
    return gitHistoryService.loadProjectSnapshot(hash);
  }

  async getHistory(path?: string, depth?: number, ref?: string): Promise<CommitInfo[]> {
    return gitHistoryService.getHistory(path, depth, ref);
  }

  async getCommitFiles(hash: string): Promise<string[]> {
    await this.loadCacheFromDisk();
    const cached = this.commitFilesCache.get(hash);
    if (cached) return cached;

    const files = await gitHistoryService.getCommitFiles(hash);
    if (files.length > 0) {
      this.addToCache(hash, files);
    }
    return files;
  }

  async readFileAtCommit(path: string, hash: string): Promise<string | null> {
    return gitHistoryService.readFileAtCommit(path, hash);
  }

  // Facade Methods (Baseline/Tags)

  async createTag(name: string, msg: string): Promise<void> {
    return gitBaselineService.createTag(name, msg);
  }

  async listTags(): Promise<string[]> {
    return gitBaselineService.listTags();
  }

  async getTagsWithDetails(): Promise<object[]> {
    return gitBaselineService.getTagsWithDetails();
  }

  // Facade Methods (Remote/Auth)

  async addRemote(name: string, url: string): Promise<void> {
    return gitRemoteService.addRemote(name, url);
  }

  async removeRemote(name: string): Promise<void> {
    return gitRemoteService.removeRemote(name);
  }

  async getRemotes(): Promise<{ name: string; url: string }[]> {
    return gitRemoteService.getRemotes();
  }

  async hasRemote(name: string = 'origin'): Promise<boolean> {
    return gitRemoteService.hasRemote(name);
  }

  async ensureTokenLoaded(): Promise<void> {
    return gitRemoteService.ensureTokenLoaded();
  }

  getAuthToken(): string | null {
    return gitRemoteService.getAuthToken();
  }

  async setAuthToken(token: string): Promise<void> {
    return gitRemoteService.setAuthToken(token);
  }

  async clearAuthToken(): Promise<void> {
    return gitRemoteService.clearAuthToken();
  }

  // Facade Methods (Sync)

  async fetch(remote: string = 'origin', branch?: string): Promise<void> {
    return gitRemoteService.fetch(remote, branch);
  }

  async push(remote: string = 'origin', branch: string = 'main'): Promise<void> {
    return gitRemoteService.push(remote, branch);
  }

  async pull(remote: string = 'origin', branch: string = 'main'): Promise<object> {
    return gitRemoteService.pull(remote, branch);
  }

  async pullCounters(remote: string = 'origin', branch: string = 'main'): Promise<boolean> {
    return gitSyncService.pullCounters(remote, branch);
  }

  async pushCounters(remote: string = 'origin', branch: string = 'main'): Promise<boolean> {
    return gitSyncService.pushCounters(remote, branch);
  }

  async getCurrentBranch(): Promise<string> {
    return gitSyncService.getCurrentBranch();
  }

  async getSyncStatus(remote: string = 'origin', branch?: string): Promise<SyncStatus> {
    return gitSyncService.getSyncStatus(remote, branch);
  }
}

export const compositeGitService = new CompositeGitService();
