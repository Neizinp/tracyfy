/**
 * Git Remote Service
 *
 * Handles remote repository operations: add/remove remotes, fetch, push, pull, and authentication.
 */

import { debug } from '../../utils/debug';
import { gitBackend, getRootDir } from './gitBackend';
import { isElectronEnv, type Remote, type PullResult } from './types';

class GitRemoteService {
  private initialized = false;
  private authToken: string | null = null;
  private tokenLoaded = false;
  /** Electron only: the token lives in the main process, we only know whether one exists */
  private hasStoredToken = false;

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

    await gitBackend().addRemote(getRootDir(), name, url);
    debug.log(`[addRemote] Added remote '${name}': ${url}`);
  }

  /**
   * Remove a remote repository
   */
  async removeRemote(name: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }

    await gitBackend().removeRemote(getRootDir(), name);
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
      return await gitBackend().listRemotes(getRootDir());
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
        const result = await window.electronAPI!.secure.hasToken();
        if (result.hasToken) {
          this.hasStoredToken = true;
          this.tokenLoaded = true;
          return;
        }

        // Migration from localStorage if exists
        const oldToken =
          typeof localStorage !== 'undefined' ? localStorage.getItem('git_pat_token') : null;
        if (oldToken) {
          debug.log('[ensureTokenLoaded] Migrating token to secure storage');
          await this.setAuthToken(oldToken);
          localStorage.removeItem('git_pat_token');
          return;
        }
      } else if (typeof localStorage !== 'undefined') {
        this.authToken = localStorage.getItem('git_pat_token');
      }
    } catch (err) {
      debug.warn('[ensureTokenLoaded] Failed:', err);
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
      return (
        this.authToken ||
        (typeof localStorage !== 'undefined' ? localStorage.getItem('git_pat_token') : null)
      );
    }
    return this.authToken;
  }

  /**
   * Whether a token is available for remote operations.
   * In Electron the token itself is kept in the main process and never exposed here.
   */
  hasAuthToken(): boolean {
    return this.hasStoredToken || !!this.getAuthToken();
  }

  /**
   * Set authentication token
   */
  async setAuthToken(token: string): Promise<void> {
    this.tokenLoaded = true;

    try {
      if (isElectronEnv()) {
        const result = await window.electronAPI!.secure.setToken(token);
        if (result.error) throw new Error(result.error);
        // Stored in the main process; don't keep a copy in the renderer
        this.authToken = null;
        this.hasStoredToken = true;
        return;
      } else {
        this.authToken = token;
        localStorage.setItem('git_pat_token', token);
      }
    } catch (err) {
      debug.warn('[setAuthToken] Failed:', err);
      this.authToken = token;
      // Fallback to localStorage even in Electron if secure storage fails
      try {
        localStorage.setItem('git_pat_token', token);
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
    this.hasStoredToken = false;
    this.tokenLoaded = true;

    try {
      if (isElectronEnv()) {
        await window.electronAPI!.secure.removeToken();
      }
      localStorage.removeItem('git_pat_token');
    } catch {
      // Ignore
    }
  }

  /**
   * Token to pass to remote operations: in the browser the stored token; in
   * Electron undefined (the main process uses its securely stored token).
   */
  private requireToken(): string | undefined {
    if (!this.initialized) {
      throw new Error('Git service not initialized');
    }
    if (!this.hasAuthToken()) {
      throw new Error('No authentication token configured. Please set a token first.');
    }
    return this.getAuthToken() ?? undefined;
  }

  /**
   * Fetch from remote repository
   */
  async fetch(remote: string = 'origin', branch?: string): Promise<void> {
    const token = this.requireToken();
    await gitBackend().fetch(getRootDir(), { remote, branch, token });
    debug.log(`[fetch] Fetched from ${remote}${branch ? '/' + branch : ''}`);
  }

  /**
   * Push to remote repository
   */
  async push(remote: string = 'origin', branch: string = 'main'): Promise<void> {
    const token = this.requireToken();
    await gitBackend().push(getRootDir(), { remote, branch, token });
    debug.log(`[push] Pushed to ${remote}/${branch}`);
  }

  /**
   * Pull from remote repository (fetch + merge)
   * Returns list of conflicted files if merge conflicts occur
   */
  async pull(remote: string = 'origin', branch: string = 'main'): Promise<PullResult> {
    const token = this.requireToken();
    const result = await gitBackend().pull(getRootDir(), { remote, branch, token });
    if (!result.ok) {
      debug.warn(`[pull] Merge conflicts in: ${result.conflicts.join(', ')}`);
      return { success: false, conflicts: result.conflicts };
    }
    debug.log(`[pull] Pulled from ${remote}/${branch}`);
    return { success: true, conflicts: [] };
  }
}

export const gitRemoteService = new GitRemoteService();
