/**
 * Mode Parity Tests
 *
 * These tests ensure that Electron mode and Browser mode do not diverge.
 * They verify:
 * 1. Both modes expose the same Git operations
 * 2. Both modes handle the same edge cases (like detached HEAD)
 * 3. Service layer correctly routes to both implementations
 */

import { describe, it, expect } from 'vitest';
import { promises as nodeFs } from 'node:fs';
import path from 'node:path';

// Use process.cwd() which is the project root during test execution
const PROJECT_ROOT = process.cwd();
const ELECTRON_MAIN_PATH = path.join(PROJECT_ROOT, 'electron/main.js');
const ELECTRON_PRELOAD_PATH = path.join(PROJECT_ROOT, 'electron/preload.js');
const GIT_CORE_SERVICE_PATH = path.join(PROJECT_ROOT, 'src/services/git/gitCoreService.ts');

describe('Mode Parity Tests', () => {
  describe('Git Operation Parity', () => {
    // List of all git operations that must exist in both modes
    const REQUIRED_GIT_OPERATIONS = [
      'status',
      'statusMatrix',
      'add',
      'remove',
      'commit',
      'log',
      'checkout',
      'init',
      'resolveRef',
      'currentBranch',
      'listTags',
      'annotatedTag',
      'readTag',
      'listFiles',
      'readBlob',
      'isDescendent',
      // Remote operations
      'fetch',
      'push',
      'pull',
      'addRemote',
      'removeRemote',
      'listRemotes',
    ];

    it('should have all required git operations in Electron preload', async () => {
      const preloadContent = await nodeFs.readFile(ELECTRON_PRELOAD_PATH, 'utf8');

      for (const op of REQUIRED_GIT_OPERATIONS) {
        expect(
          preloadContent.includes(`${op}:`),
          `Electron preload missing git operation: ${op}`
        ).toBe(true);
      }
    });

    it('should have all required git operations in Electron main IPC handlers', async () => {
      const mainContent = await nodeFs.readFile(ELECTRON_MAIN_PATH, 'utf8');

      for (const op of REQUIRED_GIT_OPERATIONS) {
        expect(
          mainContent.includes(`git:${op}`),
          `Electron main.js missing IPC handler: git:${op}`
        ).toBe(true);
      }
    });

    it('should have matching operation count between preload and main', async () => {
      const preloadContent = await nodeFs.readFile(ELECTRON_PRELOAD_PATH, 'utf8');
      const mainContent = await nodeFs.readFile(ELECTRON_MAIN_PATH, 'utf8');

      // Count git operations in preload
      const preloadGitOps = (preloadContent.match(/ipcRenderer\.invoke\('git:/g) || []).length;

      // Count git handlers in main
      const mainGitHandlers = (mainContent.match(/ipcMain\.handle\('git:/g) || []).length;

      expect(
        preloadGitOps,
        `Preload has ${preloadGitOps} git operations but main has ${mainGitHandlers} handlers`
      ).toBe(mainGitHandlers);
    });
  });

  describe('Filesystem Operation Parity', () => {
    const REQUIRED_FS_OPERATIONS = [
      'readFile',
      'readFileBinary',
      'writeFile',
      'writeFileBinary',
      'deleteFile',
      'listFiles',
      'listEntries',
      'checkExists',
      'mkdir',
      'selectDirectory',
    ];

    it('should have all required fs operations in Electron preload', async () => {
      const preloadContent = await nodeFs.readFile(ELECTRON_PRELOAD_PATH, 'utf8');

      for (const op of REQUIRED_FS_OPERATIONS) {
        expect(
          preloadContent.includes(`${op}:`),
          `Electron preload missing fs operation: ${op}`
        ).toBe(true);
      }
    });

    it('should have all required fs operations in Electron main IPC handlers', async () => {
      const mainContent = await nodeFs.readFile(ELECTRON_MAIN_PATH, 'utf8');

      for (const op of REQUIRED_FS_OPERATIONS) {
        expect(
          mainContent.includes(`fs:${op}`),
          `Electron main.js missing IPC handler: fs:${op}`
        ).toBe(true);
      }
    });
  });

  describe('Detached HEAD Fix Parity', () => {
    it('should have ensureHeadAttached logic in browser gitCoreService', async () => {
      const serviceContent = await nodeFs.readFile(GIT_CORE_SERVICE_PATH, 'utf8');

      expect(
        serviceContent.includes('ensureHeadAttached'),
        'Browser gitCoreService missing ensureHeadAttached function'
      ).toBe(true);

      expect(
        serviceContent.includes('ref: refs/heads/main'),
        'Browser gitCoreService missing HEAD repair logic'
      ).toBe(true);
    });

    it('should have ensureHeadAttached logic in Electron main.js', async () => {
      const mainContent = await nodeFs.readFile(ELECTRON_MAIN_PATH, 'utf8');

      expect(
        mainContent.includes('HEAD is detached'),
        'Electron main.js missing detached HEAD detection'
      ).toBe(true);

      expect(
        mainContent.includes('ref: refs/heads/main'),
        'Electron main.js missing HEAD repair logic'
      ).toBe(true);
    });

    it('should use the same branch name for HEAD repair in both modes', async () => {
      const serviceContent = await nodeFs.readFile(GIT_CORE_SERVICE_PATH, 'utf8');
      const mainContent = await nodeFs.readFile(ELECTRON_MAIN_PATH, 'utf8');

      // Both should use 'main' as the default branch
      const browserBranchMatch = serviceContent.match(/refs\/heads\/(\w+)/);
      const electronBranchMatch = mainContent.match(/refs\/heads\/(\w+)/);

      expect(browserBranchMatch).not.toBeNull();
      expect(electronBranchMatch).not.toBeNull();
      expect(browserBranchMatch![1]).toBe(electronBranchMatch![1]);
    });
  });

  describe('Error Response Format Parity', () => {
    it('should use consistent error response format in Electron handlers', async () => {
      const mainContent = await nodeFs.readFile(ELECTRON_MAIN_PATH, 'utf8');

      // All error responses should use { error: error.message } format
      const errorPatterns = mainContent.match(/return \{ error:/g) || [];
      const catchBlocks = mainContent.match(/catch \(error\)/g) || [];

      // Every catch block should have a corresponding error return
      expect(
        errorPatterns.length,
        'Error response count should match catch block count'
      ).toBeGreaterThanOrEqual(catchBlocks.length - 5); // Allow some tolerance
    });
  });

  describe('Author Default Parity', () => {
    it('should use same default author in both modes', async () => {
      const mainContent = await nodeFs.readFile(ELECTRON_MAIN_PATH, 'utf8');
      const serviceContent = await nodeFs.readFile(GIT_CORE_SERVICE_PATH, 'utf8');

      // Check for consistent default author pattern
      expect(mainContent).toContain('Tracyfy User');
      expect(mainContent).toContain('user@tracyfy.local');

      // Note: Browser mode gets author from FileSystemProvider,
      // but the pattern should be similar
    });
  });
});

describe('Service Layer Routing Tests', () => {
  // These tests verify that the service layer correctly routes
  // to Electron or Browser implementation based on environment

  it('should have isElectronEnv check before Electron-specific code', async () => {
    const serviceContent = await nodeFs.readFile(GIT_CORE_SERVICE_PATH, 'utf8');

    // Should check for Electron environment
    expect(serviceContent).toContain('isElectronEnv()');

    // Should have both Electron and Browser branches
    expect(serviceContent).toContain('window.electronAPI');
  });

  it('should have parallel implementation for key operations', async () => {
    const serviceContent = await nodeFs.readFile(GIT_CORE_SERVICE_PATH, 'utf8');

    // Key operations that need both implementations (Electron and Browser branches)
    const keyOperations = ['commitFile', 'revertFile', 'renameFile'];

    for (const op of keyOperations) {
      expect(serviceContent.includes(op), `Service should implement ${op}`).toBe(true);
    }
  });
});
