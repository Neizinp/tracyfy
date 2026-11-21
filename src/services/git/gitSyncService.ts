/**
 * Git Sync Service
 *
 * Sync status between local and remote.
 */

import { gitBackend, getRootDir } from './gitBackend';
import type { SyncStatus, CommitInfo } from './types';

class GitSyncService {
  private initialized = false;
  // These will be injected from the main service
  private getHistoryFn: (filepath?: string, depth?: number, ref?: string) => Promise<CommitInfo[]> =
    async () => [];

  setInitialized(value: boolean): void {
    this.initialized = value;
  }

  // Dependency injection methods
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
