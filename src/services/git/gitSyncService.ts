/**
 * Git Sync Service
 *
 * Handles counter synchronization and sync status between local and remote.
 */

import { debug } from '../../utils/debug';
import { fileSystemService } from '../fileSystemService';
import { gitBackend, getRootDir } from './gitBackend';
import type { SyncStatus, CommitInfo } from './types';

// Counter files to sync
const COUNTER_FILES = [
  'counters/requirements.md',
  'counters/usecases.md',
  'counters/testcases.md',
  'counters/information.md',
  'counters/risks.md',
  'counters/users.md',
  'counters/links.md',
  'counters/custom-attributes.md',
  'counters/workflows.md',
  'counters/documents.md',
  'counters/saved-filters.md',
];

class GitSyncService {
  private initialized = false;
  // These will be injected from the main service
  private fetchFn: (remote: string, branch?: string) => Promise<void> = async () => {};
  private pushFn: (remote: string, branch: string) => Promise<void> = async () => {};
  private hasRemoteFn: (name: string) => Promise<boolean> = async () => false;
  private readFileAtCommitFn: (filepath: string, commitHash: string) => Promise<string | null> =
    async () => null;
  private getHistoryFn: (filepath?: string, depth?: number, ref?: string) => Promise<CommitInfo[]> =
    async () => [];

  setInitialized(value: boolean): void {
    this.initialized = value;
  }

  // Dependency injection methods
  setFetchFn(fn: (remote: string, branch?: string) => Promise<void>): void {
    this.fetchFn = fn;
  }

  setPushFn(fn: (remote: string, branch: string) => Promise<void>): void {
    this.pushFn = fn;
  }

  setHasRemoteFn(fn: (name: string) => Promise<boolean>): void {
    this.hasRemoteFn = fn;
  }

  setReadFileAtCommitFn(
    fn: (filepath: string, commitHash: string) => Promise<string | null>
  ): void {
    this.readFileAtCommitFn = fn;
  }

  setGetHistoryFn(
    fn: (filepath?: string, depth?: number, ref?: string) => Promise<CommitInfo[]>
  ): void {
    this.getHistoryFn = fn;
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    if (!this.initialized) return 'main';
    try {
      return await gitBackend().currentBranch(getRootDir());
    } catch {
      return 'main';
    }
  }

  /**
   * Pull only the counters folder (for ID synchronization)
   * This is a lightweight operation for artifact creation
   */
  async pullCounters(remote: string = 'origin', branch: string = 'main'): Promise<boolean> {
    if (!this.initialized || !(await this.hasRemoteFn(remote))) {
      return false; // No remote configured, skip sync
    }

    try {
      // Fetch latest from remote
      await this.fetchFn(remote, branch);

      // Check if counters have changed
      const remoteRef = `${remote}/${branch}`;
      const backend = gitBackend();
      const localHead = await backend.resolveRef(getRootDir(), 'HEAD');
      let remoteHead: string;
      try {
        remoteHead = await backend.resolveRef(getRootDir(), remoteRef);
      } catch {
        return false; // Remote ref doesn't exist yet
      }

      if (localHead === remoteHead) {
        return true; // Already up to date
      }

      // Get counter files from remote
      for (const file of COUNTER_FILES) {
        try {
          const content = await this.readFileAtCommitFn(file, remoteHead);
          if (content) {
            // Read local counter
            const localContent = await fileSystemService.readFile(file);
            const remoteValue = parseInt(content.trim(), 10) || 0;
            const localValue = parseInt(localContent?.trim() || '0', 10);

            // Take the higher value (merge strategy for counters)
            if (remoteValue > localValue) {
              await fileSystemService.writeFile(file, String(remoteValue));
              debug.log(`[pullCounters] Updated ${file}: ${localValue} -> ${remoteValue}`);
            }
          }
        } catch {
          // File might not exist on remote
        }
      }

      return true;
    } catch (error) {
      debug.warn('[pullCounters] Failed:', error);
      return false;
    }
  }

  /**
   * Push counters folder to remote (for ID synchronization)
   */
  async pushCounters(remote: string = 'origin', branch: string = 'main'): Promise<boolean> {
    if (!this.initialized || !(await this.hasRemoteFn(remote))) {
      return false; // No remote configured, skip sync
    }

    try {
      // Commit only counter files that actually changed (no empty sync commits)
      const backend = gitBackend();
      const dir = getRootDir();
      const changed = (await backend.statusMatrix(dir, COUNTER_FILES))
        .filter(([, head, workdir, stage]) => !(head === 1 && workdir === 1 && stage === 1))
        .map(([filepath, , workdir]) => ({ filepath, deleted: workdir === 0 }));
      if (changed.length > 0) {
        await backend.commitPaths(
          dir,
          {
            add: changed.filter((c) => !c.deleted).map((c) => c.filepath),
            remove: changed.filter((c) => c.deleted).map((c) => c.filepath),
          },
          'Sync: Update artifact counters',
          { name: 'Tracyfy Sync', email: 'sync@tracyfy.local' }
        );
      }

      // Push to remote
      await this.pushFn(remote, branch);
      debug.log('[pushCounters] Pushed counter updates');
      return true;
    } catch (error) {
      debug.warn('[pushCounters] Failed:', error);
      return false;
    }
  }

  /**
   * Get sync status between local and remote
   */
  async getSyncStatus(remote: string = 'origin', branch?: string): Promise<SyncStatus> {
    if (!this.initialized) return { ahead: false, behind: false, diverged: false };

    try {
      const activeBranch = branch || (await this.getCurrentBranch());
      const rootDir = getRootDir();
      const remoteRef = `${remote}/${activeBranch}`;

      let localOID: string;
      let remoteOID: string;

      // Helper to get commit details by walking history until we find the merge base
      const getCommits = async (localOid: string, remoteOid: string) => {
        try {
          // Get local history
          const localLog = await this.getHistoryFn(undefined, 100, 'HEAD');

          // Find commits that are ahead: everything from HEAD until we find remoteOid
          const aheadCommits: CommitInfo[] = [];
          for (const commit of localLog) {
            if (commit.hash === remoteOid) break;
            aheadCommits.push(commit);
          }

          // For behind commits, get remote history and find commits until we reach localOid
          const remoteLog = await this.getHistoryFn(undefined, 100, remoteRef);
          const behindCommits: CommitInfo[] = [];
          for (const commit of remoteLog) {
            if (commit.hash === localOid) break;
            behindCommits.push(commit);
          }

          return { aheadCommits, behindCommits };
        } catch (e) {
          console.error('[getSyncStatus] Failed to get commit details:', e);
          return { aheadCommits: [], behindCommits: [] };
        }
      };

      const backend = gitBackend();
      try {
        localOID = await backend.resolveRef(rootDir, 'HEAD');
      } catch {
        return { ahead: false, behind: false, diverged: false };
      }
      try {
        remoteOID = await backend.resolveRef(rootDir, remoteRef);
      } catch {
        // Never fetched / remote branch doesn't exist yet: everything local is ahead
        return { ahead: true, behind: false, diverged: false, aheadCommits: [] };
      }

      if (localOID === remoteOID) return { ahead: false, behind: false, diverged: false };

      const ahead = await backend.isDescendent(rootDir, localOID, remoteOID);
      const behind = await backend.isDescendent(rootDir, remoteOID, localOID);
      const { aheadCommits, behindCommits } = await getCommits(localOID, remoteOID);

      return {
        ahead: ahead && !behind,
        behind: behind && !ahead,
        diverged: !ahead && !behind,
        aheadCommits,
        behindCommits,
      };
    } catch (error) {
      console.error('[getSyncStatus] Failed:', error);
      return { ahead: false, behind: false, diverged: false };
    }
  }
}

export const gitSyncService = new GitSyncService();
