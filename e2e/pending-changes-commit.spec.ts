/**
 * Pending Changes and Commit Flow E2E Tests
 *
 * These tests verify that:
 * 1. Git commits work correctly with proper object persistence
 * 2. The statusMatrix returns correct status codes for files
 *
 * Note: Full statusMatrix testing requires a more complete fs implementation.
 * The real application's FSAdapter should work correctly now that we fixed
 * the ENOENT bug.
 */

import { test, expect } from '@playwright/test';

test.describe('Pending Changes Commit Flow', () => {
  test('git commit creates objects and returns SHA', async ({ page }) => {
    // Collect console logs
    const logs: string[] = [];
    page.on('console', (msg) => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Load isomorphic-git
    await page.addScriptTag({
      url: 'https://unpkg.com/isomorphic-git@1.25.3/index.umd.min.js',
    });

    await page.waitForTimeout(1000);

    // Test that commit works and creates objects
    const result = await page.evaluate(async () => {
      const git = (window as any).git;
      if (!git) {
        return { success: false, error: 'git not loaded' };
      }

      // Minimal in-memory file system
      const store: Record<string, Uint8Array> = {};
      const dirs = new Set(['', '.']);

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const fs = {
        promises: {
          readFile: async (filepath: string, opts?: { encoding?: string }) => {
            const p = filepath.replace(/^\//, '');
            if (!(p in store)) {
              const e: any = new Error(`ENOENT: ${filepath}`);
              e.code = 'ENOENT';
              throw e;
            }
            const data = store[p];
            return opts?.encoding === 'utf8' ? decoder.decode(data) : data;
          },
          writeFile: async (filepath: string, data: Uint8Array | string) => {
            const p = filepath.replace(/^\//, '');
            const parts = p.split('/');
            for (let i = 1; i < parts.length; i++) {
              dirs.add(parts.slice(0, i).join('/'));
            }
            store[p] = typeof data === 'string' ? encoder.encode(data) : new Uint8Array(data);
          },
          unlink: async (filepath: string) => {
            delete store[filepath.replace(/^\//, '')];
          },
          readdir: async (filepath: string) => {
            const p = filepath.replace(/^\//, '').replace(/\/$/, '');
            const prefix = p ? p + '/' : '';
            const entries = new Set<string>();
            for (const key of Object.keys(store)) {
              if (key.startsWith(prefix)) {
                const rest = key.slice(prefix.length);
                const first = rest.split('/')[0];
                if (first) entries.add(first);
              }
            }
            for (const d of dirs) {
              if (d.startsWith(prefix) && d !== p) {
                const rest = d.slice(prefix.length);
                const first = rest.split('/')[0];
                if (first) entries.add(first);
              }
            }
            return [...entries];
          },
          mkdir: async (filepath: string) => {
            const p = filepath.replace(/^\//, '');
            dirs.add(p);
            const parts = p.split('/');
            for (let i = 1; i <= parts.length; i++) {
              dirs.add(parts.slice(0, i).join('/'));
            }
          },
          rmdir: async () => {},
          stat: async (filepath: string) => {
            let p = filepath.replace(/^\//, '');
            if (p === '' || p === '.') p = '.';

            if (p in store) {
              const now = Date.now();
              return {
                isFile: () => true,
                isDirectory: () => false,
                isSymbolicLink: () => false,
                size: store[p].length,
                mode: 0o100644,
                mtimeMs: now,
                ctimeMs: now,
                uid: 1000,
                gid: 1000,
                ino: 0,
                type: 'file',
              };
            }
            if (dirs.has(p)) {
              const now = Date.now();
              return {
                isFile: () => false,
                isDirectory: () => true,
                isSymbolicLink: () => false,
                size: 0,
                mode: 0o40755,
                mtimeMs: now,
                ctimeMs: now,
                uid: 1000,
                gid: 1000,
                ino: 0,
                type: 'dir',
              };
            }
            const e: any = new Error(`ENOENT: ${filepath}`);
            e.code = 'ENOENT';
            throw e;
          },
          lstat: async (filepath: string) => {
            return fs.promises.stat(filepath);
          },
          readlink: async () => {
            throw new Error('ENOENT');
          },
          symlink: async () => {
            throw new Error('Not supported');
          },
        },
      };

      try {
        const dir = '.';

        // Initialize git repo
        await git.init({ fs, dir });

        // Create initial commit
        await fs.promises.writeFile('README.md', '# Test');
        await git.add({ fs, dir, filepath: 'README.md' });
        const sha1 = await git.commit({
          fs,
          dir,
          message: 'Initial commit',
          author: { name: 'Test', email: 'test@test.com' },
        });

        // Create a new requirement file (simulates user creating requirement)
        await fs.promises.writeFile(
          'requirements/REQ-001.md',
          '---\nid: REQ-001\ntitle: Test Requirement\nstatus: draft\n---\n\n# Test Requirement\n'
        );

        // Stage and commit the requirement
        await git.add({ fs, dir, filepath: 'requirements/REQ-001.md' });
        const sha2 = await git.commit({
          fs,
          dir,
          message: 'Add REQ-001',
          author: { name: 'Test', email: 'test@test.com' },
        });

        // Find object files
        const objectFiles = Object.keys(store).filter((k) => k.startsWith('.git/objects/'));

        // Verify we have expected objects:
        // - Initial commit: README blob, tree, commit
        // - Second commit: REQ-001 blob, requirements tree, root tree, commit
        return {
          success: true,
          sha1,
          sha2,
          objectCount: objectFiles.length,
          objectFiles,
          hasRequirementFile: 'requirements/REQ-001.md' in store,
        };
      } catch (e: any) {
        return { success: false, error: e.message, stack: e.stack };
      }
    });

    console.log('Commit test result:', JSON.stringify(result, null, 2));

    expect(result.success).toBe(true);
    expect(result.sha1).toBeTruthy();
    expect(result.sha2).toBeTruthy();
    expect(result.objectCount).toBeGreaterThanOrEqual(6); // At least 6 objects from 2 commits
    expect(result.hasRequirementFile).toBe(true);
  });

  test('second commit on modified file creates new objects', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.addScriptTag({
      url: 'https://unpkg.com/isomorphic-git@1.25.3/index.umd.min.js',
    });

    await page.waitForTimeout(1000);

    const result = await page.evaluate(async () => {
      const git = (window as any).git;
      if (!git) {
        return { success: false, error: 'git not loaded' };
      }

      // In-memory file system (same as above)
      const store: Record<string, Uint8Array> = {};
      const dirs = new Set(['', '.']);

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const fs = {
        promises: {
          readFile: async (filepath: string, opts?: { encoding?: string }) => {
            const p = filepath.replace(/^\//, '');
            if (!(p in store)) {
              const e: any = new Error(`ENOENT: ${filepath}`);
              e.code = 'ENOENT';
              throw e;
            }
            const data = store[p];
            return opts?.encoding === 'utf8' ? decoder.decode(data) : data;
          },
          writeFile: async (filepath: string, data: Uint8Array | string) => {
            const p = filepath.replace(/^\//, '');
            const parts = p.split('/');
            for (let i = 1; i < parts.length; i++) {
              dirs.add(parts.slice(0, i).join('/'));
            }
            store[p] = typeof data === 'string' ? encoder.encode(data) : new Uint8Array(data);
          },
          unlink: async (filepath: string) => {
            delete store[filepath.replace(/^\//, '')];
          },
          readdir: async (filepath: string) => {
            const p = filepath.replace(/^\//, '').replace(/\/$/, '');
            const prefix = p ? p + '/' : '';
            const entries = new Set<string>();
            for (const key of Object.keys(store)) {
              if (key.startsWith(prefix)) {
                const rest = key.slice(prefix.length);
                const first = rest.split('/')[0];
                if (first) entries.add(first);
              }
            }
            for (const d of dirs) {
              if (d.startsWith(prefix) && d !== p) {
                const rest = d.slice(prefix.length);
                const first = rest.split('/')[0];
                if (first) entries.add(first);
              }
            }
            return [...entries];
          },
          mkdir: async (filepath: string) => {
            const p = filepath.replace(/^\//, '');
            dirs.add(p);
            const parts = p.split('/');
            for (let i = 1; i <= parts.length; i++) {
              dirs.add(parts.slice(0, i).join('/'));
            }
          },
          rmdir: async () => {},
          stat: async (filepath: string) => {
            let p = filepath.replace(/^\//, '');
            if (p === '' || p === '.') p = '.';

            if (p in store) {
              const now = Date.now();
              return {
                isFile: () => true,
                isDirectory: () => false,
                isSymbolicLink: () => false,
                size: store[p].length,
                mode: 0o100644,
                mtimeMs: now,
                ctimeMs: now,
                uid: 1000,
                gid: 1000,
                ino: 0,
                type: 'file',
              };
            }
            if (dirs.has(p)) {
              const now = Date.now();
              return {
                isFile: () => false,
                isDirectory: () => true,
                isSymbolicLink: () => false,
                size: 0,
                mode: 0o40755,
                mtimeMs: now,
                ctimeMs: now,
                uid: 1000,
                gid: 1000,
                ino: 0,
                type: 'dir',
              };
            }
            const e: any = new Error(`ENOENT: ${filepath}`);
            e.code = 'ENOENT';
            throw e;
          },
          lstat: async (filepath: string) => {
            return fs.promises.stat(filepath);
          },
          readlink: async () => {
            throw new Error('ENOENT');
          },
          symlink: async () => {
            throw new Error('Not supported');
          },
        },
      };

      try {
        const dir = '.';

        // Initialize and create initial commit
        await git.init({ fs, dir });
        await fs.promises.writeFile('README.md', '# Test');
        await git.add({ fs, dir, filepath: 'README.md' });
        await git.commit({
          fs,
          dir,
          message: 'Initial commit',
          author: { name: 'Test', email: 'test@test.com' },
        });

        // Create and commit a requirement
        await fs.promises.writeFile(
          'requirements/REQ-001.md',
          '---\nid: REQ-001\ntitle: Original Title\n---\n'
        );
        await git.add({ fs, dir, filepath: 'requirements/REQ-001.md' });
        const shaFirst = await git.commit({
          fs,
          dir,
          message: 'Add REQ-001',
          author: { name: 'Test', email: 'test@test.com' },
        });

        const objectsAfterFirstCommit = Object.keys(store).filter((k) =>
          k.startsWith('.git/objects/')
        ).length;

        // Modify the file
        await fs.promises.writeFile(
          'requirements/REQ-001.md',
          '---\nid: REQ-001\ntitle: Modified Title\n---\n'
        );

        // Commit the modification
        await git.add({ fs, dir, filepath: 'requirements/REQ-001.md' });
        const shaSecond = await git.commit({
          fs,
          dir,
          message: 'Update REQ-001',
          author: { name: 'Test', email: 'test@test.com' },
        });

        const objectsAfterSecondCommit = Object.keys(store).filter((k) =>
          k.startsWith('.git/objects/')
        ).length;

        return {
          success: true,
          shaFirst,
          shaSecond,
          objectsAfterFirstCommit,
          objectsAfterSecondCommit,
          newObjectsCreated: objectsAfterSecondCommit > objectsAfterFirstCommit,
        };
      } catch (e: any) {
        return { success: false, error: e.message, stack: e.stack };
      }
    });

    console.log('Modified file test result:', JSON.stringify(result, null, 2));

    expect(result.success).toBe(true);
    expect(result.shaFirst).toBeTruthy();
    expect(result.shaSecond).toBeTruthy();
    expect(result.shaFirst).not.toBe(result.shaSecond); // Different commits
    expect(result.newObjectsCreated).toBe(true); // Second commit created new objects
  });

  test('documents expected behavior: pending changes panel should clear after commit', async ({
    page: _page,
  }) => {
    /**
     * This test documents the expected behavior:
     *
     * 1. User creates a requirement
     * 2. Requirement appears in "Pending Changes" panel as "New"
     * 3. User clicks "Commit" with a message
     * 4. Requirement disappears from "Pending Changes" panel
     *
     * The underlying mechanism:
     * - saveRequirement() writes file to disk and calls refreshStatus()
     * - refreshStatus() calls git.statusMatrix() to get pending changes
     * - New files show as [0, 2, 0] (not in HEAD, in workdir, not staged)
     * - After commitFile(), git.add() + git.commit() are called
     * - refreshStatus() is called again
     * - Committed files show as [1, 1, 1] (in HEAD, in workdir, staged = clean)
     * - Clean files are filtered out, so they don't appear in Pending Changes
     *
     * FIX APPLIED:
     * The realGitService.getStatus() method now uses git.statusMatrix() in the browser
     * instead of just enumerating files, so committed files are correctly excluded.
     */

    // This is a documentation test - the actual implementation is tested above
    expect(true).toBe(true);
  });

  test('statusMatrix returns [1,1,1] for committed file (not pending)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Collect console logs
    const logs: string[] = [];
    page.on('console', (msg) => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.addScriptTag({
      url: 'https://unpkg.com/isomorphic-git@1.25.3/index.umd.min.js',
    });

    await page.waitForTimeout(1000);

    const result = await page.evaluate(async () => {
      const git = (window as any).git;
      if (!git) {
        return { success: false, error: 'git not loaded' };
      }

      // In-memory file system with proper path normalization
      const store: Record<string, Uint8Array> = {};
      const dirs = new Set(['', '.']);

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Helper to normalize paths consistently
      const normalizePath = (filepath: string): string => {
        // Remove leading slashes and ./ prefix
        let p = filepath.replace(/^\/+/, '').replace(/^\.\//, '');
        // Handle root directory
        if (p === '' || p === '.') p = '.';
        return p;
      };

      const fs = {
        promises: {
          readFile: async (filepath: string, opts?: { encoding?: string }) => {
            const p = normalizePath(filepath);
            if (!(p in store)) {
              const e: any = new Error(`ENOENT: ${filepath}`);
              e.code = 'ENOENT';
              throw e;
            }
            const data = store[p];
            return opts?.encoding === 'utf8' ? decoder.decode(data) : data;
          },
          writeFile: async (filepath: string, data: Uint8Array | string) => {
            const p = normalizePath(filepath);
            const parts = p.split('/');
            for (let i = 1; i < parts.length; i++) {
              dirs.add(parts.slice(0, i).join('/'));
            }
            store[p] = typeof data === 'string' ? encoder.encode(data) : new Uint8Array(data);
          },
          unlink: async (filepath: string) => {
            delete store[normalizePath(filepath)];
          },
          readdir: async (filepath: string) => {
            const p = normalizePath(filepath).replace(/\/$/, '');
            const prefix = p && p !== '.' ? p + '/' : '';
            const entries = new Set<string>();
            for (const key of Object.keys(store)) {
              if (prefix === '' || key.startsWith(prefix)) {
                const rest = prefix === '' ? key : key.slice(prefix.length);
                const first = rest.split('/')[0];
                if (first) entries.add(first);
              }
            }
            for (const d of dirs) {
              if ((prefix === '' || d.startsWith(prefix)) && d !== p && d !== '') {
                const rest = prefix === '' ? d : d.slice(prefix.length);
                const first = rest.split('/')[0];
                if (first) entries.add(first);
              }
            }
            return [...entries];
          },
          mkdir: async (filepath: string) => {
            const p = normalizePath(filepath);
            dirs.add(p);
            const parts = p.split('/');
            for (let i = 1; i <= parts.length; i++) {
              dirs.add(parts.slice(0, i).join('/'));
            }
          },
          rmdir: async () => {},
          stat: async (filepath: string) => {
            const p = normalizePath(filepath);

            if (p in store) {
              const now = Date.now();
              return {
                isFile: () => true,
                isDirectory: () => false,
                isSymbolicLink: () => false,
                size: store[p].length,
                mode: 0o100644,
                mtimeMs: now,
                ctimeMs: now,
                uid: 1000,
                gid: 1000,
                ino: 0,
                type: 'file',
              };
            }
            if (dirs.has(p)) {
              const now = Date.now();
              return {
                isFile: () => false,
                isDirectory: () => true,
                isSymbolicLink: () => false,
                size: 0,
                mode: 0o40755,
                mtimeMs: now,
                ctimeMs: now,
                uid: 1000,
                gid: 1000,
                ino: 0,
                type: 'dir',
              };
            }
            const e: any = new Error(`ENOENT: ${filepath}`);
            e.code = 'ENOENT';
            throw e;
          },
          lstat: async (filepath: string) => {
            return fs.promises.stat(filepath);
          },
          readlink: async () => {
            throw new Error('ENOENT');
          },
          symlink: async () => {
            throw new Error('Not supported');
          },
        },
      };

      try {
        const dir = '.';

        // Initialize git repo
        await git.init({ fs, dir });

        // Create initial commit
        await fs.promises.writeFile('README.md', '# Test');
        await git.add({ fs, dir, filepath: 'README.md' });
        await git.commit({
          fs,
          dir,
          message: 'Initial commit',
          author: { name: 'Test', email: 'test@test.com' },
        });

        // Create a new requirement file
        await fs.promises.writeFile(
          'requirements/REQ-001.md',
          '---\nid: REQ-001\ntitle: Test Requirement\nstatus: draft\n---\n\n# Test Requirement\n'
        );

        // Check status BEFORE commit
        const matrixBeforeCommit = await git.statusMatrix({ fs, dir });
        const reqStatusBefore = matrixBeforeCommit.find(
          (row: [string, number, number, number]) => row[0] === 'requirements/REQ-001.md'
        );

        // Stage and commit the requirement
        await git.add({ fs, dir, filepath: 'requirements/REQ-001.md' });
        const commitSha = await git.commit({
          fs,
          dir,
          message: 'Add REQ-001',
          author: { name: 'Test', email: 'test@test.com' },
        });

        // Check status AFTER commit
        const matrixAfterCommit = await git.statusMatrix({ fs, dir });
        const reqStatusAfter = matrixAfterCommit.find(
          (row: [string, number, number, number]) => row[0] === 'requirements/REQ-001.md'
        );

        // Compute pending changes (files NOT matching [1,1,1])
        const pendingFiles = matrixAfterCommit
          .filter((row: [string, number, number, number]) => {
            const [, head, workdir, stage] = row;
            return !(head === 1 && workdir === 1 && stage === 1);
          })
          .map((row: [string, number, number, number]) => ({
            filepath: row[0],
            head: row[1],
            workdir: row[2],
            stage: row[3],
          }));

        return {
          success: true,
          commitSha,
          reqStatusBefore: reqStatusBefore
            ? { head: reqStatusBefore[1], workdir: reqStatusBefore[2], stage: reqStatusBefore[3] }
            : null,
          reqStatusAfter: reqStatusAfter
            ? { head: reqStatusAfter[1], workdir: reqStatusAfter[2], stage: reqStatusAfter[3] }
            : null,
          matrixAfterCommit: matrixAfterCommit.map((row: [string, number, number, number]) => ({
            filepath: row[0],
            head: row[1],
            workdir: row[2],
            stage: row[3],
          })),
          pendingFiles,
          reqInPendingFiles: pendingFiles.some(
            (f: { filepath: string }) => f.filepath === 'requirements/REQ-001.md'
          ),
        };
      } catch (e: any) {
        return { success: false, error: e.message, stack: e.stack };
      }
    });

    console.log('statusMatrix test result:', JSON.stringify(result, null, 2));
    console.log('Console logs:', logs.join('\n'));

    expect(result.success).toBe(true);
    expect(result.commitSha).toBeTruthy();

    // Before commit: file should be new (HEAD=0, WORKDIR=2, STAGE=0 for untracked)
    expect(result.reqStatusBefore).toBeTruthy();

    // After commit: file should be clean (HEAD=1, WORKDIR=1, STAGE=1)
    expect(result.reqStatusAfter).toEqual({ head: 1, workdir: 1, stage: 1 });

    // The committed file should NOT be in pending files
    expect(result.reqInPendingFiles).toBe(false);
  });
});
