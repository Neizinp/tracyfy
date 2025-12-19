/**
 * Git Remote Service
 *
 * Handles remote repository operations: add/remove remotes, fetch, push, pull, and authentication.
 */

import { debug } from '../../utils/debug';
import git from 'isomorphic-git';
import { fileSystemService } from '../fileSystemService';
import { fsAdapter } from '../fsAdapter';
import { isElectronEnv, type Remote, type PullResult } from './types';

/**
 * Get the root directory path (Electron uses absolute path, browser uses '.')
 */
function getRootDir(): string {
  if (isElectronEnv()) {
    const rootPath = fileSystemService.getRootPath();
    return rootPath || '.';
  }
  return '.';
}

class GitRemoteService {
  private initialized = false;
  private authToken: string | null = null;
  private tokenLoaded = false;

  setInitialized(value: boolean): void {
    this.initialized = value;
  }

  /**
   * Add a remote repository
   */
  async addRemote(name: string, url: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    if (isElectronEnv()) {
      const result = await window.electronAPI!.git.addRemote(getRootDir(), name, url);
      if (result.error) throw new Error(result.error);
    } else {
      await git.addRemote({
        fs: fsAdapter,
        dir: getRootDir(),
        remote: name,
        url,
      });
    }
    debug.log(`[addRemote] Added remote '${name}': ${url}`);
  }

  /**
   * Remove a remote repository
   */
  async removeRemote(name: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    if (isElectronEnv()) {
      const result = await window.electronAPI!.git.removeRemote(getRootDir(), name);
      if (result.error) throw new Error(result.error);
    } else {
      await git.deleteRemote({
        fs: fsAdapter,
        dir: getRootDir(),
        remote: name,
      });
    }
    debug.log(`[removeRemote] Removed remote '${name}'`);
  }

  /**
   * List all configured remotes
   */
  async getRemotes(): Promise<Remote[]> {
    if (!this.initialized) {
      return [];
    }

    try {
      if (isElectronEnv()) {
        const result = await window.electronAPI!.git.listRemotes(getRootDir());
        if ('error' in result) throw new Error(result.error);
        return result;
      }
      const remotes = await git.listRemotes({
        fs: fsAdapter,
        dir: getRootDir(),
      });
      return remotes.map((r) => ({ name: r.remote, url: r.url }));
    } catch (error) {
      console.error('[getRemotes] Failed:', error);
      return [];
    }
  }

  /**
   * Check if a remote is configured
   */
  async hasRemote(name: string = 'origin'): Promise<boolean> {
    const remotes = await this.getRemotes();
    return remotes.some((r) => r.name === name);
  }

  /**
   * Ensure authentication token is loaded from disk/localStorage
   */
  async ensureTokenLoaded(): Promise<void> {
    if (this.tokenLoaded) return;

    try {
      if (isElectronEnv()) {
        const result = await window.electronAPI!.secure.getToken();
        if (result.token) {
          this.authToken = result.token;
          this.tokenLoaded = true;
          return;
        }

        // Migration from localStorage if exists
        const oldToken = localStorage.getItem('git-remote-token');
        if (oldToken) {
          debug.log('[ensureTokenLoaded] Migrating token to secure storage');
          await this.setAuthToken(oldToken);
          localStorage.removeItem('git-remote-token');
          return;
        }
      } else {
        this.authToken = localStorage.getItem('git-remote-token');
      }
    } catch (err) {
      console.warn('[ensureTokenLoaded] Failed:', err);
    }
    this.tokenLoaded = true;
  }

  /**
   * Get stored authentication token
   * Note: ensureTokenLoaded() must be called once before this (is called in init)
   */
  getAuthToken(): string | null {
    if (!this.tokenLoaded) {
      // Fallback for immediate access, though unreliable in Electron if not yet initialized
      return this.authToken || localStorage.getItem('git-remote-token');
    }
    return this.authToken;
  }

  /**
   * Set authentication token
   */
  async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    this.tokenLoaded = true;

    try {
      if (isElectronEnv()) {
        const result = await window.electronAPI!.secure.setToken(token);
        if (result.error) throw new Error(result.error);
      } else {
        localStorage.setItem('git-remote-token', token);
      }
    } catch (err) {
      console.warn('[setAuthToken] Failed:', err);
      // Fallback to localStorage even in Electron if secure storage fails
      try {
        localStorage.setItem('git-remote-token', token);
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Clear authentication token
   */
  async clearAuthToken(): Promise<void> {
    this.authToken = null;
    this.tokenLoaded = true;

    try {
      if (isElectronEnv()) {
        await window.electronAPI!.secure.removeToken();
      }
      localStorage.removeItem('git-remote-token');
    } catch {
      // Ignore
    }
  }

  /**
   * Create auth callback for git operations
   */
  private getAuthCallback() {
    const token = this.getAuthToken();
    if (!token) return undefined;

    return {
      onAuth: () => ({
        username: 'x-access-token',
        password: token, // GitHub PAT as password
      }),
    };
  }

  /**
   * Fetch from remote repository
   */
  async fetch(remote: string = 'origin', branch?: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token configured. Please set a token first.');
    }

    try {
      if (isElectronEnv()) {
        const result = await window.electronAPI!.git.fetch(getRootDir(), remote, branch, token);
        if (result.error) throw new Error(result.error);
      } else {
        const auth = this.getAuthCallback();
        await git.fetch({
          fs: fsAdapter,
          http: await import('isomorphic-git/http/web').then((m) => m.default),
          dir: getRootDir(),
          corsProxy: 'https://corsproxy.io/?',
          remote,
          ref: branch,
          singleBranch: !!branch,
          ...auth,
        });
      }
      debug.log(`[fetch] Fetched from ${remote}${branch ? '/' + branch : ''}`);
    } catch (error) {
      console.error('[fetch] Failed:', error);
      throw error;
    }
  }

  /**
   * Push to remote repository
   */
  async push(remote: string = 'origin', branch: string = 'main'): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token configured. Please set a token first.');
    }

    if (isElectronEnv()) {
      const result = await window.electronAPI!.git.push(getRootDir(), remote, branch, token);
      if (result.error) throw new Error(result.error);
    } else {
      const auth = this.getAuthCallback();
      await git.push({
        fs: fsAdapter,
        http: await import('isomorphic-git/http/web').then((m) => m.default),
        dir: getRootDir(),
        corsProxy: 'https://corsproxy.io/?',
        remote,
        ref: branch,
        ...auth,
      });
    }
    debug.log(`[push] Pushed to ${remote}/${branch}`);
  }

  /**
   * Pull from remote repository (fetch + merge)
   * Returns list of conflicted files if merge conflicts occur
   */
  async pull(remote: string = 'origin', branch: string = 'main'): Promise<PullResult> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token configured. Please set a token first.');
    }

    try {
      if (isElectronEnv()) {
        const result = await window.electronAPI!.git.pull(getRootDir(), remote, branch, token, {
          name: 'Tracyfy User',
          email: 'user@tracyfy.local',
        });
        if (result.error) throw new Error(result.error);
        if (!result.ok) {
          return { success: false, conflicts: result.conflicts || [] };
        }
        debug.log(`[pull] Pulled from ${remote}/${branch}`);
        return { success: true, conflicts: [] };
      }

      const auth = this.getAuthCallback();
      await git.pull({
        fs: fsAdapter,
        http: await import('isomorphic-git/http/web').then((m) => m.default),
        dir: getRootDir(),
        corsProxy: 'https://corsproxy.io/?',
        remote,
        ref: branch,
        author: { name: 'Tracyfy User', email: 'user@tracyfy.local' },
        ...auth,
      });
      debug.log(`[pull] Pulled from ${remote}/${branch}`);
      return { success: true, conflicts: [] };
    } catch (error: unknown) {
      const err = error as { code?: string; data?: { filepaths?: string[] } };
      if (err?.code === 'MergeConflictError' || err?.code === 'CheckoutConflictError') {
        const conflicts = err.data?.filepaths || [];
        console.warn(`[pull] Merge conflicts in: ${conflicts.join(', ')}`);
        return { success: false, conflicts };
      }
      throw error;
    }
  }
}

export const gitRemoteService = new GitRemoteService();
