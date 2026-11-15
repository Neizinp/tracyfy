// @vitest-environment node
/**
 * Contract + behavior tests for the Electron bridge, using the real preload.js
 * and the real IPC handlers against a real temp directory and real git.
 *
 * Replaces the old text-search "mode parity" tests: instead of checking that
 * source files contain certain strings, these call the API and check what
 * actually happens.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import git from 'isomorphic-git';
import { createElectronIpc, type ElectronIpc } from './electronIpc';

type AnyFn = (...args: unknown[]) => Promise<unknown>;
type Api = {
  fs: Record<string, AnyFn>;
  git: Record<string, AnyFn>;
  secure: Record<string, AnyFn>;
};

let root: string;
let dir: string;
let ipc: ElectronIpc;
let api: Api;

beforeEach(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'tracyfy-ipc-'));
  dir = path.join(root, 'project');
  fs.mkdirSync(dir);
  fs.mkdirSync(path.join(root, 'userData'));
  ipc = createElectronIpc({ pickedDirectory: dir, userDataDir: path.join(root, 'userData') });
  api = ipc.api as unknown as Api;
  // The user picks the project folder (this is what grants access to it)
  expect(await api.fs.selectDirectory()).toEqual({ path: dir });
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe('preload ↔ main contract', () => {
  it('every function exposed by preload.js reaches a registered IPC handler', async () => {
    const exposed: string[] = [];
    for (const group of ['fs', 'git', 'secure'] as const) {
      for (const [name, fn] of Object.entries(api[group])) {
        exposed.push(`${group}.${name}`);
        // Arguments don't matter here; handlers report bad input as { error }
        await fn(dir, dir, dir).catch((e: Error) => {
          // A missing handler is the only failure we care about
          if (e.message.startsWith('No IPC handler')) throw e;
        });
      }
    }
    expect(exposed.length).toBeGreaterThan(30);
    expect(ipc.invoked.every((channel) => ipc.handlers.has(channel))).toBe(true);
  });

  it('every registered IPC handler is reachable from preload.js (no dead or private-only handlers)', () => {
    const exposedChannels = new Set(ipc.invoked);
    // invoke everything once to collect channels
    return (async () => {
      for (const group of ['fs', 'git', 'secure'] as const) {
        for (const fn of Object.values(api[group])) {
          await fn(dir, dir, dir).catch(() => undefined);
        }
      }
      ipc.invoked.forEach((c) => exposedChannels.add(c));
      expect([...ipc.handlers.keys()].filter((c) => !exposedChannels.has(c))).toEqual([]);
    })();
  });

  it('does not expose a way to read the stored git token', () => {
    expect(Object.keys(api.secure).sort()).toEqual(['hasToken', 'removeToken', 'setToken']);
  });
});

describe('path access control', () => {
  it('allows files inside the picked folder', async () => {
    const file = path.join(dir, 'requirements', 'REQ-001.md');
    expect(await api.fs.writeFile(file, 'hello')).toEqual({ ok: true });
    expect(await api.fs.readFile(file)).toEqual({ content: 'hello' });
  });

  it('denies reading and writing outside the picked folder', async () => {
    const outside = path.join(root, 'secret.txt');
    fs.writeFileSync(outside, 'secret');

    expect(await api.fs.readFile(outside)).toMatchObject({
      error: expect.stringMatching(/denied/i),
    });
    expect(await api.fs.readFile(path.join(dir, '..', 'secret.txt'))).toMatchObject({
      error: expect.stringMatching(/denied/i),
    });
    expect(await api.fs.writeFile(path.join(root, 'evil.txt'), 'x')).toMatchObject({
      error: expect.stringMatching(/denied/i),
    });
    expect(fs.existsSync(path.join(root, 'evil.txt'))).toBe(false);
  });

  it('denies a sibling folder whose name starts with the picked folder name', async () => {
    const sibling = `${dir}-other`;
    fs.mkdirSync(sibling);
    expect(await api.fs.writeFile(path.join(sibling, 'x.md'), 'x')).toMatchObject({
      error: expect.stringMatching(/denied/i),
    });
  });

  it('keeps access to the picked folder after a restart', async () => {
    const restarted = createElectronIpc({
      pickedDirectory: '/nowhere',
      userDataDir: path.join(root, 'userData'),
    }).api as unknown as Api;
    expect(await restarted.fs.writeFile(path.join(dir, 'a.md'), 'a')).toEqual({ ok: true });
  });
});

describe('git:commit', () => {
  const commitFile = async (name: string, content: string) => {
    await api.fs.writeFile(path.join(dir, name), content);
    await api.git.add(dir, name);
    return (await api.git.commit(dir, `add ${name}`)) as { oid?: string; error?: string };
  };

  beforeEach(async () => {
    await api.git.init(dir);
  });

  it('uses the same default author as browser mode', async () => {
    await commitFile('a.md', 'a');
    const [head] = await git.log({ fs, dir, depth: 1 });
    expect(head.commit.author).toMatchObject({ name: 'Tracyfy User', email: 'user@tracyfy.local' });
  });

  it('reattaches a detached HEAD to main when it is a fast-forward', async () => {
    const first = (await commitFile('a.md', 'a')).oid!;
    const second = (await commitFile('b.md', 'b')).oid!;
    // main lags behind a detached HEAD
    await git.writeRef({ fs, dir, ref: 'refs/heads/main', value: first, force: true });
    fs.writeFileSync(path.join(dir, '.git', 'HEAD'), `${second}\n`);

    const third = await commitFile('c.md', 'c');

    expect(third.error).toBeUndefined();
    expect(fs.readFileSync(path.join(dir, '.git', 'HEAD'), 'utf8').trim()).toBe(
      'ref: refs/heads/main'
    );
    expect(await git.resolveRef({ fs, dir, ref: 'main' })).toBe(third.oid);
  });

  it('refuses to commit when HEAD is detached on an older commit (would drop main history)', async () => {
    const first = (await commitFile('a.md', 'a')).oid!;
    const second = (await commitFile('b.md', 'b')).oid!;
    fs.writeFileSync(path.join(dir, '.git', 'HEAD'), `${first}\n`);

    const result = await commitFile('c.md', 'c');

    expect(result.error).toMatch(/detached/i);
    expect(await git.resolveRef({ fs, dir, ref: 'refs/heads/main' })).toBe(second);
  });
});

describe('binary files', () => {
  it('round-trips binary data byte-for-byte', async () => {
    const bytes = new Uint8Array(256).map((_, i) => i);
    const file = path.join(dir, 'assets', 'img.bin');
    expect(await api.fs.writeFileBinary(file, bytes)).toEqual({ ok: true });
    const { data } = (await api.fs.readFileBinary(file)) as { data: Uint8Array };
    expect(Array.from(data)).toEqual(Array.from(bytes));
  });
});
