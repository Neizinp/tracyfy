/**
 * Real Git Service - Facade
 *
 * This file is now a thin wrapper around the modular git services in src/services/git/.
 * It maintains backward compatibility for existing imports in the codebase.
 */

import { realGitService as composite } from './git';

// Export the singleton instance
export const realGitService = composite;

// Re-export types for backward compatibility
export type { FileStatus, CommitInfo, SyncStatus, PullResult } from './git';
