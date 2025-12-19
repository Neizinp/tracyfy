/**
 * Git Service Facade
 *
 * Re-exports the composite git service which orchestrates specialized sub-services.
 */

import { compositeGitService } from './compositeGitService';

export { compositeGitService as realGitService };

// Re-export types
export type { FileStatus, Remote, TagDetails, PullResult, CommitInfo, SyncStatus } from './types';
export { isElectronEnv, parseStatusMatrix } from './types';
