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

export type ArtifactFolder =
  | 'requirements'
  | 'usecases'
  | 'testcases'
  | 'information'
  | 'risks'
  | 'links'
  | 'workflows'
  | 'custom-attributes'
  | 'documents'
  | 'users'
  | 'baselines';

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
      /** See shared/gitOps.js; errors come back as { error, name } */
      git: {
        call: (
          op: string,
          dir: string,
          ...args: unknown[]
        ) => Promise<{ ok?: true; value?: unknown; error?: string; name?: string }>;
      };
      secure: {
        setToken: (token: string) => Promise<{ ok?: boolean; error?: string }>;
        hasToken: () => Promise<{ hasToken: boolean }>;
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

    // Debug: log the raw status for REQ-001
    if (filepath.includes('REQ-001')) {
      console.log(
        `[parseStatusMatrix] ${filepath}: HEAD=${headStatus}, WORKDIR=${workdirStatus}, STAGE=${stageStatus}`
      );
    }
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
