/**
 * Git Service Facade
 *
 * Re-exports all git service functionality. This maintains backward compatibility
 * with existing imports of realGitService while the internals are gradually refactored.
 *
 * Usage:
 *   import { realGitService } from './services/git';
 *   // or
 *   import { realGitService } from './services/realGitService'; // still works
 */

// Re-export the main service (currently still in parent directory)
export { realGitService } from '../realGitService';

// Re-export types
export type { FileStatus, Remote, TagDetails, PullResult, CommitInfo, SyncStatus } from './types';
export { isElectronEnv, parseStatusMatrix } from './types';
