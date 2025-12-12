import { describe, it, expect } from 'vitest';
import { normalizePath, isGitInternalPath, createENOENT, filterTempFiles } from '../pathUtils';

describe('pathUtils', () => {
  describe('normalizePath', () => {
    it('should remove leading slashes', () => {
      expect(normalizePath('/path/to/file')).toBe('path/to/file');
      expect(normalizePath('//path/to/file')).toBe('path/to/file');
      expect(normalizePath('///path')).toBe('path');
    });

    it('should remove ./ prefixes', () => {
      expect(normalizePath('./path/to/file')).toBe('path/to/file');
      expect(normalizePath('./file.txt')).toBe('file.txt');
    });

    it('should handle clean paths unchanged', () => {
      expect(normalizePath('path/to/file')).toBe('path/to/file');
      expect(normalizePath('file.txt')).toBe('file.txt');
    });

    it('should handle empty string', () => {
      expect(normalizePath('')).toBe('');
    });
  });

  describe('isGitInternalPath', () => {
    it('should identify .git directory paths', () => {
      expect(isGitInternalPath('.git')).toBe(true);
      expect(isGitInternalPath('.git/')).toBe(true);
      expect(isGitInternalPath('.git/config')).toBe(true);
      expect(isGitInternalPath('.git/objects/ab/1234')).toBe(true);
    });

    it('should identify .git paths with leading slashes', () => {
      expect(isGitInternalPath('/.git')).toBe(true);
      expect(isGitInternalPath('/.git/HEAD')).toBe(true);
    });

    it('should identify .git paths with ./ prefix', () => {
      expect(isGitInternalPath('./.git')).toBe(true);
      expect(isGitInternalPath('./.git/config')).toBe(true);
    });

    it('should return false for non-git paths', () => {
      expect(isGitInternalPath('requirements/REQ-001.md')).toBe(false);
      expect(isGitInternalPath('projects/project.md')).toBe(false);
      expect(isGitInternalPath('.gitignore')).toBe(false);
      expect(isGitInternalPath('folder/.gitkeep')).toBe(false);
    });
  });

  describe('createENOENT', () => {
    it('should create an error with ENOENT code', () => {
      const err = createENOENT('/path/to/missing/file');
      expect(err.code).toBe('ENOENT');
    });

    it('should include filepath in error message', () => {
      const err = createENOENT('/path/to/file.txt');
      expect(err.message).toContain('/path/to/file.txt');
    });

    it('should be an instance of Error', () => {
      const err = createENOENT('file.txt');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('filterTempFiles', () => {
    it('should filter out .crswap files', () => {
      const entries = ['file.md', 'file.md.crswap'];
      expect(filterTempFiles(entries)).toEqual(['file.md']);
    });

    it('should filter out .swp files', () => {
      const entries = ['file.md', '.file.md.swp'];
      expect(filterTempFiles(entries)).toEqual(['file.md']);
    });

    it('should filter out .tmp files', () => {
      const entries = ['file.md', 'temp.tmp'];
      expect(filterTempFiles(entries)).toEqual(['file.md']);
    });

    it('should filter out tilde backup files', () => {
      const entries = ['file.md', 'file.md~'];
      expect(filterTempFiles(entries)).toEqual(['file.md']);
    });

    it('should filter out .# lock files', () => {
      const entries = ['file.md', '.#file.md'];
      expect(filterTempFiles(entries)).toEqual(['file.md']);
    });

    it('should keep regular files', () => {
      const entries = ['requirements/REQ-001.md', 'projects/test.md', '.gitignore'];
      expect(filterTempFiles(entries)).toEqual(entries);
    });

    it('should filter multiple temp files at once', () => {
      const entries = ['file.md', 'file.md.crswap', '.file.swp', 'backup.tmp', 'real.txt'];
      expect(filterTempFiles(entries)).toEqual(['file.md', 'real.txt']);
    });
  });
});
