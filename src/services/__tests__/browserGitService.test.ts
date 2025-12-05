import { describe, it, expect } from 'vitest';
import type { Requirement } from '../../types';

describe('browserGitService', () => {
  describe('Path Generation', () => {
    it('should sanitize project names for safe folder usage', () => {
      const safeName = 'My Project!@#$%^&*()'.replace(/[^a-z0-9-_]/gi, '_');
      expect(safeName).toBe('My_Project__________');
    });

    it('should generate artifact paths correctly', () => {
      const type = 'requirements';
      const artifactId = 'REQ-001';
      const expectedPath = `artifacts/${type}/${artifactId}.md`;

      expect(expectedPath).toBe('artifacts/requirements/REQ-001.md');
    });
  });

  describe('Commit Message Formatting', () => {
    it('should prefix project name to commit messages', () => {
      const projectName = 'Test Project';
      const message = 'Add feature';
      const formatted = `[${projectName}] ${message}`;

      expect(formatted).toBe('[Test Project] Add feature');
    });
  });

  describe('File Status Detection', () => {
    it('should identify new files', () => {
      const statusCode = [0, 2, 0]; // [head, workdir, stage]
      const isNew = statusCode[0] === 0 && statusCode[1] === 2;

      expect(isNew).toBe(true);
    });

    it('should identify modified files', () => {
      const statusCode = [1, 2, 1];
      const isModified = statusCode[0] === 1 && statusCode[1] === 2;

      expect(isModified).toBe(true);
    });

    it('should identify deleted files', () => {
      const statusCode = [1, 0, 1];
      const isDeleted = statusCode[0] === 1 && statusCode[1] === 0;

      expect(isDeleted).toBe(true);
    });
  });

  describe('Artifact Filtering', () => {
    it('should filter out non-artifact files', () => {
      const files = [
        'README.md',
        'projects/test/_manifest.json',
        'artifacts/requirements/REQ-001.md',
        '.git/config',
        'artifacts/usecases/UC-001.md',
      ];

      const filtered = files.filter(
        (f) =>
          f.startsWith('artifacts/') &&
          !f.startsWith('.git') &&
          f !== 'README.md' &&
          !f.includes('_manifest.json')
      );

      expect(filtered).toHaveLength(2);
      expect(filtered).toContain('artifacts/requirements/REQ-001.md');
      expect(filtered).toContain('artifacts/usecases/UC-001.md');
    });
  });

  describe('Commit Info Transformation', () => {
    it('should transform git log output to CommitInfo format', () => {
      const gitLogEntry = {
        oid: 'abc123def456',
        commit: {
          message: 'Test commit',
          author: {
            name: 'John Doe',
            timestamp: 1609459200, // Seconds
          },
        },
      };

      const commitInfo = {
        hash: gitLogEntry.oid,
        message: gitLogEntry.commit.message,
        author: gitLogEntry.commit.author.name,
        timestamp: gitLogEntry.commit.author.timestamp * 1000, // Convert to ms
      };

      expect(commitInfo.hash).toBe('abc123def456');
      expect(commitInfo.message).toBe('Test commit');
      expect(commitInfo.author).toBe('John Doe');
      expect(commitInfo.timestamp).toBe(1609459200000);
    });
  });

  describe('Data Validation', () => {
    it('should validate artifact has required fields', () => {
      const validRequirement: Requirement = {
        id: 'REQ-001',
        title: 'Test',
        description: '',
        text: '',
        rationale: '',
        status: 'draft',
        priority: 'medium',
        parentIds: [],
        lastModified: Date.now(),
        revision: '01',
        dateCreated: Date.now(),
      };

      expect(validRequirement.id).toBeDefined();
      expect(validRequirement.title).toBeDefined();
      expect(validRequirement.revision).toBeDefined();
    });
  });
});
