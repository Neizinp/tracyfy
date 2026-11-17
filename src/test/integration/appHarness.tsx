/**
 * Integration test harness: runs the real app stack against a real temp
 * directory with real git. Nothing in the data path is mocked:
 *
 *   React providers → services → window.electronAPI (the real preload.js)
 *     → IPC handlers (the real electron/ipcHandlers.js) → node fs + isomorphic-git
 *
 * Only the Electron runtime objects are faked (ipcMain, dialog, safeStorage),
 * and IPC arguments/results go through structuredClone like real Electron IPC.
 *
 * Use it to assert what the user would actually get: files on disk, git
 * status/history, and the state the UI renders from.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import React, { StrictMode, useLayoutEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { expect } from 'vitest';
import { render, waitFor, act, screen, fireEvent } from '@testing-library/react';
import git from 'isomorphic-git';
import { createElectronIpc, type ElectronIpc } from './electronIpc';
import { classifyPendingPath } from '../../utils/pendingChanges';
import { AppProviders } from '../../app/AppProviders';
import { AppContent } from '../../app/AppContent';
import { StatusBar, ToastContainer } from '../../components';
import {
  useFileSystem,
  useUser,
  useProject,
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
  useRisks,
  useDocuments,
  useGlobalState,
  useUI,
} from '../../app/providers';

/**
 * Generous: the whole app boots per test, and the suite runs many files in
 * parallel (cold transform cache in CI / fresh worktrees makes this slower).
 */
const READY_TIMEOUT = 30_000;

export interface AppHooks {
  fileSystem: ReturnType<typeof useFileSystem>;
  user: ReturnType<typeof useUser>;
  project: ReturnType<typeof useProject>;
  requirements: ReturnType<typeof useRequirements>;
  useCases: ReturnType<typeof useUseCases>;
  testCases: ReturnType<typeof useTestCases>;
  information: ReturnType<typeof useInformation>;
  risks: ReturnType<typeof useRisks>;
  documents: ReturnType<typeof useDocuments>;
  globalState: ReturnType<typeof useGlobalState>;
  ui: ReturnType<typeof useUI>;
}

export interface Harness {
  /** Project directory on disk (what the user picked) */
  dir: string;
  /**
   * The real IPC handlers. Tests may replace network-facing ones (git:fetch,
   * git:push, git:pull) to simulate a remote; everything else stays real.
   */
  ipc: ElectronIpc;
  /**
   * Replace one git operation (e.g. 'pull') in the main process - typically
   * to stand in for the network. All other operations stay real.
   */
  stubGitOp: (op: string, impl: (dir: string, ...args: unknown[]) => unknown) => void;
  /** Latest hook values - read after act()/waitFor() */
  app: () => AppHooks;
  /** Read a project file from disk, or null if missing */
  readFile: (relPath: string) => string | null;
  exists: (relPath: string) => boolean;
  /** Paths with uncommitted changes according to real git (untracked, modified, deleted) */
  dirtyPaths: () => Promise<string[]>;
  /**
   * Uncommitted paths the user cannot see (and so cannot commit) in the
   * Pending Changes panel. Must always be empty: code writing hidden
   * bookkeeping files has to commit them itself.
   */
  invisibleDirtyPaths: () => Promise<string[]>;
  /**
   * A colleague commits to this repository (as a pull would bring in), then
   * the app restarts so it sees them as a person in the history.
   */
  colleagueCommits: (name: string) => Promise<void>;
  /** Commit messages on HEAD, newest first */
  commitMessages: () => Promise<string[]>;
  /** Wait until the debounced git status refresh in the app has settled */
  settle: () => Promise<void>;
  /** Unmount and remount the app on the same directory (simulates a restart) */
  restart: () => Promise<void>;
  cleanup: () => void;
}

function installElectronApi(projectDir: string, userDataDir: string): ElectronIpc {
  const ipc = createElectronIpc({ pickedDirectory: projectDir, userDataDir });
  (window as unknown as Record<string, unknown>).electronAPI = ipc.api;
  return ipc;
}

/**
 * Start the app on a fresh, empty project folder (named "project") with a
 * user created - the state a real user is in right after onboarding.
 */
export async function startApp(
  options: { userName?: string; initialRoute?: string } = {}
): Promise<Harness> {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tracyfy-it-'));
  const dir = path.join(root, 'project');
  const userData = path.join(root, 'userData');
  fs.mkdirSync(dir);
  fs.mkdirSync(userData);

  localStorage.clear();
  const ipc = installElectronApi(dir, userData);

  const latest: { current: AppHooks | null } = { current: null };
  const Probe: React.FC = () => {
    const hooks: AppHooks = {
      fileSystem: useFileSystem(),
      user: useUser(),
      project: useProject(),
      requirements: useRequirements(),
      useCases: useUseCases(),
      testCases: useTestCases(),
      information: useInformation(),
      risks: useRisks(),
      documents: useDocuments(),
      globalState: useGlobalState(),
      ui: useUI(),
    };
    // Publish after commit so tests always read the latest rendered values
    useLayoutEffect(() => {
      latest.current = hooks;
    });
    return null;
  };

  // Same tree as App.tsx / main.tsx (StrictMode like `npm run electron:dev`), plus a probe
  const tree = (
    <StrictMode>
      <MemoryRouter initialEntries={[options.initialRoute ?? '/requirements']}>
        <AppProviders>
          <AppContent />
          <StatusBar />
          <ToastContainer />
          <Probe />
        </AppProviders>
      </MemoryRouter>
    </StrictMode>
  );
  let rendered = render(tree);

  const app = () => {
    if (!latest.current) throw new Error('App not rendered');
    return latest.current;
  };

  // First run, through the real UI: pick the folder, then onboard the first user
  fireEvent.click(
    await screen.findByRole('button', { name: /choose folder/i }, { timeout: READY_TIMEOUT })
  );
  await waitFor(() => expect(app().fileSystem.isReady).toBe(true), { timeout: READY_TIMEOUT });

  const nameInput = await screen.findByPlaceholderText(
    'Enter your name',
    {},
    { timeout: READY_TIMEOUT }
  );
  fireEvent.change(nameInput, { target: { value: options.userName ?? 'Test User' } });
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: 'test@example.com' },
  });
  fireEvent.submit(nameInput.closest('form')!);
  await waitFor(() => expect(app().user.currentUser?.name).toBe(options.userName ?? 'Test User'));

  const settle = async () => {
    // refreshStatus is debounced (300 ms) and runs async git status
    await act(() => new Promise((r) => setTimeout(r, 450)));
    await act(() => new Promise((r) => setTimeout(r, 50)));
  };

  const stubs = new Map<string, (dir: string, ...args: unknown[]) => unknown>();
  const realGitCall = ipc.handlers.get('git:call')!;
  ipc.handlers.set('git:call', async (event: unknown, ...callArgs: unknown[]) => {
    const [op, opDir, ...rest] = callArgs as [string, string, ...unknown[]];
    const stub = stubs.get(op);
    if (!stub) return realGitCall(event, ...callArgs);
    try {
      return { ok: true, value: await stub(opDir, ...rest) };
    } catch (error) {
      return { error: (error as Error).message, name: (error as Error).name };
    }
  });

  const harness: Harness = {
    dir,
    ipc,
    stubGitOp: (op, impl) => {
      stubs.set(op, impl);
    },
    app,
    readFile: (rel) => {
      const p = path.join(dir, rel);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    },
    exists: (rel) => fs.existsSync(path.join(dir, rel)),
    dirtyPaths: async () => {
      const matrix = await git.statusMatrix({ fs, dir });
      return matrix
        .filter(([, head, workdir, stage]) => !(head === 1 && workdir === 1 && stage === 1))
        .map(([filepath]) => filepath)
        .sort();
    },
    invisibleDirtyPaths: async () => {
      const matrix = await git.statusMatrix({ fs, dir });
      return matrix
        .filter(([, head, workdir, stage]) => !(head === 1 && workdir === 1 && stage === 1))
        .map(([filepath]) => filepath)
        .filter((p) => classifyPendingPath(p) === null)
        .sort();
    },
    colleagueCommits: async (name) => {
      const file = `notes/${name.replace(/\W+/g, '-')}.txt`;
      fs.mkdirSync(path.join(dir, 'notes'), { recursive: true });
      fs.writeFileSync(path.join(dir, file), `${name} was here\n`);
      await git.add({ fs, dir, filepath: file });
      await git.commit({
        fs,
        dir,
        message: `Note from ${name}`,
        author: { name, email: `${name.toLowerCase()}@example.com` },
      });
      await harness.restart();
    },
    commitMessages: async () => {
      const log = await git.log({ fs, dir });
      return log.map((c) => c.commit.message.trim());
    },
    settle,
    restart: async () => {
      rendered.unmount();
      latest.current = null;
      // Record errors during startup so a failed restart explains itself
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (...args: unknown[]) => {
        errors.push(args.map((a) => (a instanceof Error ? a.stack : String(a))).join(' '));
        originalError(...args);
      };
      try {
        rendered = render(tree);
        await waitFor(
          () => {
            const fsState = latest.current?.fileSystem;
            if (!fsState?.isReady) {
              throw new Error(
                `App not ready after restart: isLoading=${fsState?.isLoading} ` +
                  `error=${fsState?.error}\nconsole.error during restart:\n${errors.join('\n')}`
              );
            }
          },
          { timeout: READY_TIMEOUT }
        );
      } finally {
        console.error = originalError;
      }
      await settle();
    },
    cleanup: () => {
      rendered.unmount();
      fs.rmSync(root, { recursive: true, force: true });
      delete (window as unknown as Record<string, unknown>).electronAPI;
      localStorage.clear();
    },
  };

  await settle();
  return harness;
}
