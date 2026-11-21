/**
 * PDF Export Types
 *
 * Shared types for PDF export modules.
 */

import type { CommitInfo } from '../../types';
import type { ArtifactKindId } from '../../domain/artifactKinds';

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
  artifactType: ArtifactKindId;
  commits: CommitInfo[];
  isNew?: boolean;
}

// Removed artifact for revision history
export interface RemovedArtifact {
  artifactId: string;
  artifactType: ArtifactKindId;
}

// Page reference for tracking across page breaks
export interface PageRef {
  page: number;
}
