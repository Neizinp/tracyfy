import type { ArtifactKindId } from '../domain/artifactKinds';

export interface ArtifactChange {
  id: string;
  type: ArtifactKindId | 'project' | 'asset' | 'link' | 'saved-filter' | 'workflow';
  title: string;
  /** Artifacts are never deleted from disk, but a removed link is a deleted file */
  status: 'new' | 'modified' | 'deleted';
  path: string;
  commitMessage?: string; // User's pending commit message
}

export interface ArtifactRevision {
  commitHash: string;
  message: string;
  author: string;
  timestamp: number;
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  authorEmail?: string;
  timestamp: number;
  parent?: string[];
}

export interface SyncStatus {
  ahead: boolean;
  behind: boolean;
  diverged: boolean;
  aheadCommits?: CommitInfo[];
  behindCommits?: CommitInfo[];
  lastFetched?: number;
}

/** A baseline is a git tag: a name for one commit of the whole project */
export interface ProjectBaseline {
  /** The tag name, e.g. "1.0" */
  name: string;
  /** The tag message */
  description: string;
  timestamp: number;
  /** The commit the tag points at */
  commit: string;
}
