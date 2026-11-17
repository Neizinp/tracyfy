import type { ArtifactKindId } from '../domain/artifactKinds';

export interface ArtifactChange {
  id: string;
  type:
    | ArtifactKindId
    | 'project'
    | 'asset'
    | 'link'
    | 'custom-attribute'
    | 'saved-filter'
    | 'workflow';
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

export interface ProjectBaseline {
  id: string;
  version: string; // e.g., "01", "02", "03"
  name: string;
  description: string;
  timestamp: number;
  // Snapshot of which artifacts are in the project at this baseline
  artifactCommits: {
    [artifactId: string]: {
      commitHash: string;
      type: ArtifactKindId;
    };
  };
  // Track what was added/removed from project since last baseline
  addedArtifacts?: string[];
  removedArtifacts?: string[];
}
