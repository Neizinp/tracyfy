/**
 * Git Sync Service
 *
 * Handles counter synchronization and sync status between local and remote.
 */

import { debug } from '../../utils/debug';
import git from 'isomorphic-git';
import { fileSystemService } from '../fileSystemService';
import { fsAdapter } from '../fsAdapter';
import { isElectronEnv, type SyncStatus, type CommitInfo } from './types';

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
];

/**
 * Get the root directory path (Electron uses absolute path, browser uses '.')
 */
function getRootDir(): string {
  if (isElectronEnv()) {
    const rootPath = fileSystemService.getRootPath();
    return rootPath || '.';
  }
  return '.';
}

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
      if (isElectronEnv()) {
        const branch = await window.electronAPI!.git.currentBranch(getRootDir());
        return branch || 'main';
      }
      return (await git.currentBranch({ fs: fsAdapter, dir: getRootDir() })) || 'main';
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
      let localHead: string;
      let remoteHead: string;

      if (isElectronEnv()) {
        const rootDir = getRootDir();
        localHead = await window.electronAPI!.git.resolveRef(rootDir, 'HEAD');
        try {
          remoteHead = await window.electronAPI!.git.resolveRef(rootDir, remoteRef);
        } catch {
          return false;
        }
      } else {
        localHead = await git.resolveRef({
          fs: fsAdapter,
          dir: getRootDir(),
          ref: 'HEAD',
        });
        try {
          remoteHead = await git.resolveRef({
            fs: fsAdapter,
            dir: getRootDir(),
            ref: remoteRef,
          });
        } catch {
          // Remote ref doesn't exist yet
          return false;
        }
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
      // Stage and commit counter files
      const cache = {};
      let hasChanges = false;

      for (const file of COUNTER_FILES) {
        try {
          const exists = await fileSystemService.readFileBinary(file).then((b) => b !== null);
          if (exists) {
            if (isElectronEnv()) {
              const res = await window.electronAPI!.git.add(getRootDir(), file);
              if (res.error) throw new Error(res.error);
            } else {
              await git.add({ fs: fsAdapter, dir: getRootDir(), filepath: file, cache });
            }
            hasChanges = true;
          }
        } catch {
          // File might not exist
        }
      }

      if (!hasChanges) {
        return true; // Nothing to push
      }

      // Commit counter update
      const author = { name: 'Tracyfy Sync', email: 'sync@tracyfy.local' };
      const message = 'Sync: Update artifact counters';

      if (isElectronEnv()) {
        const res = await window.electronAPI!.git.commit(getRootDir(), message, author);
        if (res.error) throw new Error(res.error);
      } else {
        await git.commit({
          fs: fsAdapter,
          dir: getRootDir(),
          message,
          author,
          cache,
        });
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

      let localOID: string | undefined;
      let remoteOID: string | undefined;

      // Helper to get commit details by walking history until we find the merge base
      const getCommits = async (localOid: string, remoteOid: string) => {
        try {
          console.log(
            '[getSyncStatus] Finding commits between',
            localOid.slice(0, 7),
            'and',
            remoteOid.slice(0, 7)
          );

          // Get local history
          const localLog = await this.getHistoryFn(undefined, 100, 'HEAD');

          // Find commits that are ahead: everything from HEAD until we find remoteOid
          const aheadCommits: CommitInfo[] = [];
          for (const commit of localLog) {
            if (commit.hash === remoteOid) break;
            aheadCommits.push(commit);
          }

          console.log('[getSyncStatus] Found', aheadCommits.length, 'ahead commits');

          // For behind commits, get remote history and find commits until we reach localOid
          const remoteLog = await this.getHistoryFn(undefined, 100, remoteRef);
          const behindCommits: CommitInfo[] = [];
          for (const commit of remoteLog) {
            if (commit.hash === localOid) break;
            behindCommits.push(commit);
          }

          console.log('[getSyncStatus] Found', behindCommits.length, 'behind commits');

          return { aheadCommits, behindCommits };
        } catch (e) {
          console.error('[getSyncStatus] Failed to get commit details:', e);
          return { aheadCommits: [], behindCommits: [] };
        }
      };

      if (isElectronEnv()) {
        try {
          localOID = await window.electronAPI!.git.resolveRef(rootDir, 'HEAD');
        } catch {
          return { ahead: false, behind: false, diverged: false };
        }

        try {
          remoteOID = await window.electronAPI!.git.resolveRef(rootDir, remoteRef);
        } catch {
          return { ahead: !!localOID, behind: false, diverged: false, aheadCommits: [] };
        }

        if (localOID === remoteOID) return { ahead: false, behind: false, diverged: false };

        const aheadResult = await window.electronAPI!.git.isDescendent(
          rootDir,
          localOID,
          remoteOID
        );
        const behindResult = await window.electronAPI!.git.isDescendent(
          rootDir,
          remoteOID,
          localOID
        );

        const ahead = aheadResult === true;
        const behind = behindResult === true;
        const diverged = !ahead && !behind;

        const { aheadCommits, behindCommits } = await getCommits(localOID, remoteOID);

        return {
          ahead: ahead && !behind,
          behind: behind && !ahead,
          diverged,
          aheadCommits,
          behindCommits,
        };
      } else {
        try {
          localOID = await git.resolveRef({ fs: fsAdapter, dir: rootDir, ref: 'HEAD' });
        } catch {
          return { ahead: false, behind: false, diverged: false };
        }

        try {
          remoteOID = await git.resolveRef({ fs: fsAdapter, dir: rootDir, ref: remoteRef });
        } catch {
          return { ahead: !!localOID, behind: false, diverged: false };
        }

        if (localOID === remoteOID) return { ahead: false, behind: false, diverged: false };

        const aheadResult = await git.isDescendent({
          fs: fsAdapter,
          dir: rootDir,
          oid: localOID!,
          ancestor: remoteOID!,
        });
        const behindResult = await git.isDescendent({
          fs: fsAdapter,
          dir: rootDir,
          oid: remoteOID!,
          ancestor: localOID!,
        });

        const ahead = aheadResult === true;
        const behind = behindResult === true;
        const diverged = !ahead && !behind;

        const { aheadCommits, behindCommits } = await getCommits(localOID, remoteOID);

        return {
          ahead: ahead && !behind,
          behind: behind && !ahead,
          diverged,
          aheadCommits,
          behindCommits,
        };
      }
    } catch (error) {
      console.error('[getSyncStatus] Failed:', error);
      return { ahead: false, behind: false, diverged: false };
    }
  }
}

export const gitSyncService = new GitSyncService();
