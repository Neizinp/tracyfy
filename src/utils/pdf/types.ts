/**
 * PDF Export Types
 *
 * Shared types for PDF export modules.
 */

import type { CommitInfo } from '../../types';

// Table of Contents entry
export interface TOCEntry {
  title: string;
  page: number;
  level: number;
}

// Artifact commit for revision history
export interface ArtifactCommit {
  artifactId: string;
  artifactTitle: string;
  artifactType: 'requirement' | 'usecase' | 'testcase' | 'information';
  commits: CommitInfo[];
  isNew?: boolean;
}

// Removed artifact for revision history
export interface RemovedArtifact {
  artifactId: string;
  artifactType: 'requirement' | 'usecase' | 'testcase' | 'information';
}

// Page reference for tracking across page breaks
export interface PageRef {
  page: number;
}
