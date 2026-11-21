/**
 * Git: pending changes (git status), commits, history and sync.
 */
import type { StateCreator } from 'zustand';
import type { AppState } from '../store';
import type { ArtifactKindId } from '../../domain/artifactKinds';
import { repository } from '../../storage/repository';
import {
  realGitService,
  type CommitInfo,
  type FileStatus,
  type PullResult,
} from '../../services/realGitService';
import { withTask } from './tasks';
import { isE2EMode } from '../e2e';

export interface GitSlice {
  pendingChanges: FileStatus[];
  /** Set when git status could not be read (shown instead of "No pending changes") */
  statusError: string | null;
  /** Read git status now; records a failure in statusError instead of throwing */
  loadStatus: () => Promise<void>;
  /** Read git status soon; rapid calls are coalesced into one */
  refreshStatus: () => void;
  /** Commit one file; the author is the repository's user.name */
  commitFile: (path: string, message: string) => Promise<void>;
  /** Discard the uncommitted changes to one file */
  revertFile: (path: string) => Promise<void>;
  artifactHistory: (kind: ArtifactKindId, id: string) => Promise<CommitInfo[]>;
  readFileAtCommit: (path: string, commit: string) => Promise<string | null>;
  push: () => Promise<void>;
  pull: () => Promise<PullResult>;
  hasRemote: () => Promise<boolean>;
}

const REFRESH_STATUS_DEBOUNCE_MS = 300;

export const createGitSlice: StateCreator<AppState, [], [], GitSlice> = (set, get) => {
  const e2e = isE2EMode();
  let timer: ReturnType<typeof setTimeout> | null = null;
  // A status read that started earlier must never overwrite the result of a later one
  let request = 0;

  const readStatus = async () => {
    const mine = ++request;
    try {
      const status = await repository.status();
      if (mine === request) set({ pendingChanges: status, statusError: null });
    } catch (err) {
      if (mine === request) {
        set({ pendingChanges: [], statusError: err instanceof Error ? err.message : String(err) });
      }
    }
  };

  return {
    pendingChanges: [],
    statusError: null,

    loadStatus: readStatus,

    refreshStatus: () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        if (realGitService.isInitialized()) {
          void withTask(get(), 'Refreshing git status...', readStatus);
        }
      }, REFRESH_STATUS_DEBOUNCE_MS);
    },

    commitFile: async (path, message) => {
      if (!get().isReady) throw new Error('Filesystem not ready');
      if (e2e) return;
      await repository.commit(path, message);
      // Lets the sidebar update its sync status
      window.dispatchEvent(new CustomEvent('git-check'));
    },

    revertFile: async (path) => {
      if (!get().isReady) throw new Error('Filesystem not ready');
      if (e2e) return;
      await repository.revert(path);
      // The file changed on disk; git status follows from the git-status-changed event
      await get().reload();
    },

    artifactHistory: async (kindId, id) => {
      if (!get().isReady || e2e) return [];
      return repository.history(kindId, id);
    },

    readFileAtCommit: async (path, commit) => {
      if (e2e) return null;
      return repository.readAt(path, commit);
    },

    push: () => repository.push(),

    pull: async () => {
      const result = await repository.pull();
      if (result.success) {
        // The pull changed files on disk: reload so the app (and the next save)
        // works on the pulled data instead of stale state
        await get().reload();
        get().refreshStatus();
      }
      return result;
    },

    hasRemote: () => repository.hasRemote(),
  };
};
