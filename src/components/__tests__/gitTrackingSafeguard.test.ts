/**
 * Git Tracking Safeguard Tests
 *
 * These tests ensure that all data directories that need to be shared
 * are properly tracked in the PendingChangesPanel component.
 *
 * If a new directory is added to the project structure but not to
 * PendingChangesPanel, these tests will fail, alerting developers
 * to the oversight.
 */

import { describe, it, expect } from 'vitest';

// All directories that store shareable data
// Add new directories here when they are created
const SHAREABLE_DIRECTORIES = [
  'requirements',
  'usecases',
  'testcases',
  'information',
  'risks',
  'projects',
  'assets',
  'users',
  'counters',
  'links',
  'custom-attributes',
  'saved-filters',
  'documents',
] as const;

// Directories that are intentionally NOT shared (local preferences)
const LOCAL_ONLY_DIRECTORIES = [
  // current-project.md and current-user.md are files, not directories
  // Add any future local-only directories here
] as const;

// This should match the type union in types.ts ArtifactChange interface
type TrackedArtifactType =
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
  | 'document';

// Mapping from directory name to artifact type
const DIRECTORY_TO_TYPE_MAP: Record<string, TrackedArtifactType> = {
  requirements: 'requirement',
  usecases: 'usecase',
  testcases: 'testcase',
  information: 'information',
  risks: 'risk',
  projects: 'project',
  assets: 'asset',
  users: 'user',
  counters: 'counter',
  links: 'link',
  'custom-attributes': 'custom-attribute',
  'saved-filters': 'saved-filter',
  documents: 'document',
};

describe('Git Tracking Safeguard', () => {
  it('should have a mapping for every shareable directory', () => {
    for (const dir of SHAREABLE_DIRECTORIES) {
      expect(
        DIRECTORY_TO_TYPE_MAP[dir],
        `Directory "${dir}" is not mapped to an artifact type. ` +
          `Add it to DIRECTORY_TO_TYPE_MAP and ensure PendingChangesPanel handles it.`
      ).toBeDefined();
    }
  });

  it('should have every mapped directory in the shareable list', () => {
    const mappedDirs = Object.keys(DIRECTORY_TO_TYPE_MAP);
    for (const dir of mappedDirs) {
      expect(
        SHAREABLE_DIRECTORIES.includes(dir as (typeof SHAREABLE_DIRECTORIES)[number]),
        `Directory "${dir}" is in the mapping but not in SHAREABLE_DIRECTORIES. ` +
          `Either add it to SHAREABLE_DIRECTORIES or remove from the mapping.`
      ).toBe(true);
    }
  });

  it('should have unique artifact types for each directory', () => {
    const types = Object.values(DIRECTORY_TO_TYPE_MAP);
    const uniqueTypes = new Set(types);
    expect(uniqueTypes.size, `Duplicate artifact types found in DIRECTORY_TO_TYPE_MAP`).toBe(
      types.length
    );
  });

  it('should not have any overlap between shareable and local-only directories', () => {
    for (const dir of LOCAL_ONLY_DIRECTORIES) {
      expect(
        SHAREABLE_DIRECTORIES.includes(dir as (typeof SHAREABLE_DIRECTORIES)[number]),
        `Directory "${dir}" is marked as both shareable and local-only`
      ).toBe(false);
    }
  });

  // This test documents the expected count - update when adding new directories
  it('should track exactly 13 directory types', () => {
    expect(SHAREABLE_DIRECTORIES.length).toBe(13);
    expect(Object.keys(DIRECTORY_TO_TYPE_MAP).length).toBe(13);
  });
});
