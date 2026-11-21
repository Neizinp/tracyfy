/**
 * Sync with the remote: whether there is one, how the branch stands against
 * it (ahead / behind), auto-sync, and the last sync error. Commits, Push and
 * Pull update it directly; the sidebar only reads it.
 */
import type { StateCreator } from 'zustand';
import type { AppState } from '../store';
import type { SyncStatus } from '../../types';
import { repository } from '../../storage/repository';
import { realGitService } from '../../services/realGitService';
import { debug } from '../../utils/debug';

const AUTO_SYNC_KEY = 'tracyfy-auto-sync';

export interface SyncSlice {
  hasRemote: boolean;
  syncStatus: SyncStatus;
  /** Push after every commit (per user, in localStorage) */
  autoSync: boolean;
  /** The last Push or Pull failure, shown in the sidebar */
  syncError: string | null;
  /** Read whether there is a remote and how the branch stands against it */
  checkSync: () => Promise<void>;
  setAutoSync: (enabled: boolean) => void;
  setSyncError: (error: string | null) => void;
  /** After a commit: push when auto-sync is on, otherwise read the sync status */
  syncAfterCommit: () => Promise<void>;
}

const NOT_SYNCED: SyncStatus = { ahead: false, behind: false, diverged: false };

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

function readAutoSync(): boolean {
  try {
    return localStorage.getItem(AUTO_SYNC_KEY) === 'true';
  } catch {
    return false;
  }
}

export const createSyncSlice: StateCreator<AppState, [], [], SyncSlice> = (set, get) => ({
  hasRemote: false,
  syncStatus: NOT_SYNCED,
  autoSync: readAutoSync(),
  syncError: null,

  checkSync: async () => {
    if (!realGitService.isInitialized()) return;
    try {
      const hasRemote = await repository.hasRemote();
      set({ hasRemote, ...(hasRemote ? {} : { syncStatus: NOT_SYNCED }) });
      // Can fail (nothing fetched yet) while the remote is still there
      if (hasRemote) set({ syncStatus: await repository.syncStatus() });
    } catch (err) {
      debug.warn('[sync] Failed to read the sync status:', err);
    }
  },

  setAutoSync: (enabled) => {
    set({ autoSync: enabled });
    try {
      localStorage.setItem(AUTO_SYNC_KEY, String(enabled));
    } catch {
      // Not stored; it still applies until the app is closed
    }
  },

  setSyncError: (error) => set({ syncError: error }),

  syncAfterCommit: async () => {
    const { autoSync, hasRemote } = get();
    if (!autoSync || !hasRemote) return get().checkSync();
    try {
      await get().push(); // reads the sync status after pushing
    } catch (err) {
      // The user relies on auto-sync; tell them their commit was NOT pushed
      set({ syncError: `Automatic push failed: ${message(err)}` });
    }
  },
});
