/**
 * The git backend for the current runtime.
 *
 * Both runtimes run the same operations (shared/gitOps.js); only the file
 * access differs:
 * - Electron: forwarded over IPC to the main process, which runs them with
 *   Node's fs (and supplies the stored token for remote operations)
 * - Browser: run here with fsAdapter (File System Access API)
 *
 * Either way, failures are thrown as errors (never returned as values).
 */
import git from 'isomorphic-git';
import { createGitOps, DetachedHeadError, GIT_OP_NAMES, type GitOps } from '../../../shared/gitOps';
import { fsAdapter } from '../fsAdapter';
import { fileSystemService } from '../fileSystemService';
import { isElectronEnv } from './types';

let ipcOps: GitOps | null = null;
let browserOps: GitOps | null = null;

function createIpcOps(): GitOps {
  const entries = GIT_OP_NAMES.map((name) => [
    name,
    async (dir: string, ...args: unknown[]) => {
      const result = await window.electronAPI!.git.call(name, dir, ...args);
      if (result.error !== undefined) {
        if (result.name === 'DetachedHeadError') throw new DetachedHeadError();
        // Keep isomorphic-git's error code (e.g. NotFoundError) like in browser mode
        const error = new Error(result.error) as Error & { code?: string };
        if (result.name) {
          error.name = result.name;
          error.code = result.name;
        }
        throw error;
      }
      return result.value;
    },
  ]);
  return Object.fromEntries(entries) as unknown as GitOps;
}

export function gitBackend(): GitOps {
  if (isElectronEnv()) {
    ipcOps ??= createIpcOps();
    return ipcOps;
  }
  browserOps ??= createGitOps({
    fs: fsAdapter,
    git,
    getHttp: () => import('isomorphic-git/http/web').then((m) => m.default),
    corsProxy: 'https://corsproxy.io/?',
  });
  return browserOps;
}

/** Repository root as gitOps expects it: absolute path in Electron, '.' in the browser */
export function getRootDir(): string {
  if (isElectronEnv()) return fileSystemService.getRootPath() || '.';
  return '.';
}

export { DetachedHeadError };
