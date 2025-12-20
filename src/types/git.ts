export interface ArtifactChange {
  id: string;
  type:
    | 'requirement'
    | 'usecase'
    | 'testcase'
    | 'information'
    | 'project'
    | 'asset'
    | 'risk'
    | 'user'
    | 'counter'
    | 'link'
    | 'custom-attribute'
    | 'saved-filter'
    | 'workflow'
    | 'document';
  title: string;
  status: 'new' | 'modified'; // No 'deleted' - artifacts can only be removed from projects
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
  projectId: string;
  version: string; // e.g., "01", "02", "03"
  name: string;
  description: string;
  timestamp: number;
  // Snapshot of which artifacts are in the project at this baseline
  artifactCommits: {
    [artifactId: string]: {
      commitHash: string;
      type: 'requirement' | 'usecase' | 'testcase' | 'information' | 'risk' | 'document';
    };
  };
  // Track what was added/removed from project since last baseline
  addedArtifacts?: string[];
  removedArtifacts?: string[];
}
