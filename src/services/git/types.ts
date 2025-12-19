/**
 * Git Service Types
 *
 * Shared types used across the git service modules.
 */

import type { CommitInfo, SyncStatus } from '../../types';

export type { CommitInfo, SyncStatus };

// Re-export for convenience
export interface FileStatus {
  path: string;
  status: string;
}

export interface Remote {
  name: string;
  url: string;
}

export interface TagDetails {
  name: string;
  message: string;
  timestamp: number;
  commit: string;
}

export interface PullResult {
  success: boolean;
  conflicts: string[];
}

// Type for electron API
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      git: {
        status: (dir: string, filepath: string) => Promise<string>;
        statusMatrix: (dir: string) => Promise<[string, number, number, number][]>;
        add: (dir: string, filepath: string) => Promise<{ ok?: boolean; error?: string }>;
        remove: (dir: string, filepath: string) => Promise<{ ok?: boolean; error?: string }>;
        commit: (
          dir: string,
          message: string,
          author?: { name: string; email: string }
        ) => Promise<{ oid?: string; error?: string }>;
        log: (
          dir: string,
          depth?: number,
          filepath?: string,
          ref?: string
        ) => Promise<CommitInfo[]>;
        listFiles: (dir: string, ref?: string) => Promise<string[]>;
        readBlob: (
          dir: string,
          oid: string,
          filepath: string
        ) => Promise<{ blob?: number[]; error?: string }>;
        resolveRef: (dir: string, ref: string) => Promise<string>;
        isDescendent: (
          dir: string,
          oid: string,
          ancestor: string,
          depth?: number
        ) => Promise<boolean | { error: string }>;
        currentBranch: (dir: string) => Promise<string | null>;
        init: (dir: string) => Promise<{ ok?: boolean; error?: string }>;
        annotatedTag: (
          dir: string,
          ref: string,
          message: string,
          tagger?: { name: string; email: string }
        ) => Promise<{ ok?: boolean; error?: string }>;
        listTags: (dir: string) => Promise<string[]>;
        readTag: (
          dir: string,
          oid: string
        ) => Promise<{ message: string; timestamp: number; object: string }>;
        // Remote operations
        addRemote: (
          dir: string,
          name: string,
          url: string
        ) => Promise<{ ok?: boolean; error?: string }>;
        removeRemote: (dir: string, name: string) => Promise<{ ok?: boolean; error?: string }>;
        listRemotes: (dir: string) => Promise<{ name: string; url: string }[] | { error: string }>;
        fetch: (
          dir: string,
          remote: string,
          branch?: string,
          token?: string
        ) => Promise<{ ok?: boolean; error?: string }>;
        push: (
          dir: string,
          remote: string,
          branch: string,
          token?: string
        ) => Promise<{ ok?: boolean; error?: string }>;
        pull: (
          dir: string,
          remote: string,
          branch: string,
          token?: string,
          author?: { name: string; email: string }
        ) => Promise<{ ok?: boolean; conflicts?: string[]; error?: string }>;
      };
      secure: {
        setToken: (token: string) => Promise<{ ok?: boolean; error?: string }>;
        getToken: () => Promise<{ token?: string | null; error?: string }>;
        removeToken: () => Promise<{ ok?: boolean; error?: string }>;
      };
    };
  }
}

/**
 * Check if running in Electron environment
 */
export const isElectronEnv = () =>
  typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

/**
 * Parse status matrix into FileStatus array
 */
export function parseStatusMatrix(matrix: [string, number, number, number][]): {
  statuses: FileStatus[];
  allFiles: Set<string>;
} {
  const statuses: FileStatus[] = [];
  const allFiles = new Set<string>();

  for (const [filepath, headStatus, workdirStatus, stageStatus] of matrix) {
    allFiles.add(filepath);

    // Parse status based on the matrix values
    // [filepath, HEAD, WORKDIR, STAGE]
    // 0 = absent, 1 = present unchanged, 2 = modified
    if (headStatus === 0 && workdirStatus === 2 && stageStatus === 0) {
      statuses.push({ path: filepath, status: 'new' });
    } else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 1) {
      statuses.push({ path: filepath, status: 'modified' });
    } else if (headStatus === 1 && workdirStatus === 0 && stageStatus === 0) {
      statuses.push({ path: filepath, status: 'deleted' });
    } else if (headStatus === 1 && workdirStatus === 0 && stageStatus === 1) {
      statuses.push({ path: filepath, status: 'deleted' });
    } else if (headStatus === 0 && workdirStatus === 2 && stageStatus === 2) {
      statuses.push({ path: filepath, status: 'added' });
    } else if (headStatus === 0 && workdirStatus === 2 && stageStatus === 3) {
      statuses.push({ path: filepath, status: 'added' });
    } else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 2) {
      statuses.push({ path: filepath, status: 'modified' });
    } else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 3) {
      statuses.push({ path: filepath, status: 'modified' });
    }
  }

  return { statuses, allFiles };
}
