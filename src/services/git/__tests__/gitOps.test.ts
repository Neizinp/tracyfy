// @vitest-environment node
/**
 * shared/gitOps.js against a real repository on disk, in both runtimes:
 * - Electron: Node fs with an absolute dir (what the main process does)
 * - Browser: fsAdapter over a File System Access handle with dir '.'
 *   (the handle is backed by the same real folder)
 * Assertions inspect the repository with Node fs + isomorphic-git directly.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import git from 'isomorphic-git';
import {
  createGitOps,
  DetachedHeadError,
  DEFAULT_AUTHOR,
  GIT_OP_NAMES,
  type GitOps,
} from '../../../../shared/gitOps';
import { fsAdapter } from '../../fsAdapter';
import { fileSystemService } from '../../fileSystemService';
import { NodeDirectoryHandle } from '../../../test/integration/nodeDirectoryHandle';

const RUNTIMES = [
  {
    name: 'Electron (Node fs)',
    setup: (abs: string) => ({ ops: createGitOps({ fs, git }), repo: abs }),
  },
  {
    name: 'browser (fsAdapter)',
    setup: (abs: string) => {
      fileSystemService.setDirectoryHandle(
        new NodeDirectoryHandle(abs) as unknown as FileSystemDirectoryHandle
      );
      return { ops: createGitOps({ fs: fsAdapter, git }), repo: '.' };
    },
  },
];

/** Absolute path of the temp repo on disk (for assertions) */
let dir: string;
/** What the runtime passes as `dir` to gitOps */
let repo: string;
let ops: GitOps;
const write = (rel: string, content: string) => {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), content);
};

describe.each(RUNTIMES)('gitOps in $name', (runtime) => {
  beforeEach(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tracyfy-gitops-'));
    ({ ops, repo } = runtime.setup(dir));
    await ops.init(repo);
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('exposes every operation listed in GIT_OP_NAMES (the IPC allowlist)', () => {
    for (const name of GIT_OP_NAMES) expect(typeof ops[name]).toBe('function');
    expect(Object.keys(ops).sort()).toEqual([...GIT_OP_NAMES].sort());
  });

  it('commitPaths adds, commits and then removes files', async () => {
    write('requirements/REQ-001.md', 'one');
    const first = await ops.commitPaths(repo, { add: ['requirements/REQ-001.md'] }, 'Add REQ-001');
    expect(await ops.listFiles(repo, first)).toEqual(['requirements/REQ-001.md']);

    fs.rmSync(path.join(dir, 'requirements/REQ-001.md'));
    const second = await ops.commitPaths(repo, { remove: ['requirements/REQ-001.md'] }, 'Remove');
    expect(await ops.listFiles(repo, second)).toEqual([]);

    const log = await ops.log(repo);
    expect(log.map((c) => c.message.trim())).toEqual(['Remove', 'Add REQ-001']);
    expect(log[0]).toMatchObject({ hash: second, author: DEFAULT_AUTHOR.name, parent: [first] });
  });

  it('a rename is one commit (remove old + add new)', async () => {
    write('projects/old.md', 'p');
    await ops.commitPaths(repo, { add: ['projects/old.md'] }, 'Add');
    fs.renameSync(path.join(dir, 'projects/old.md'), path.join(dir, 'projects/new.md'));
    const oid = await ops.commitPaths(
      repo,
      { remove: ['projects/old.md'], add: ['projects/new.md'] },
      'Rename'
    );
    expect(await ops.listFiles(repo, oid)).toEqual(['projects/new.md']);
  });

  it('statusMatrix reports untracked/modified files, optionally for given paths', async () => {
    write('a.md', 'a');
    await ops.commitPaths(repo, { add: ['a.md'] }, 'a');
    write('a.md', 'changed');
    write('b.md', 'new');
    expect(await ops.statusMatrix(repo)).toEqual([
      ['a.md', 1, 2, 1],
      ['b.md', 0, 2, 0],
    ]);
    expect(await ops.statusMatrix(repo, ['b.md'])).toEqual([['b.md', 0, 2, 0]]);
  });

  it('checkoutFile discards changes to one file', async () => {
    write('a.md', 'original');
    await ops.commitPaths(repo, { add: ['a.md'] }, 'a');
    write('a.md', 'edited');
    await ops.checkoutFile(repo, 'a.md');
    expect(fs.readFileSync(path.join(dir, 'a.md'), 'utf8')).toBe('original');
  });

  it('readBlob returns file bytes at a commit', async () => {
    write('a.md', 'v1');
    const oid = await ops.commitPaths(repo, { add: ['a.md'] }, 'v1');
    write('a.md', 'v2');
    await ops.commitPaths(repo, { add: ['a.md'] }, 'v2');
    expect(new TextDecoder().decode(await ops.readBlob(repo, oid, 'a.md'))).toBe('v1');
  });

  it('annotated tags round-trip', async () => {
    write('a.md', 'a');
    const oid = await ops.commitPaths(repo, { add: ['a.md'] }, 'a');
    await ops.annotatedTag(repo, 'baseline-1', 'First baseline');
    expect(await ops.listTags(repo)).toEqual(['baseline-1']);
    const tag = await ops.readTag(repo, await ops.resolveRef(repo, 'baseline-1'));
    expect(tag).toMatchObject({ message: 'First baseline\n', object: oid });
  });

  it('remotes can be added, listed and removed', async () => {
    await ops.addRemote(repo, 'origin', 'https://example.invalid/r.git');
    expect(await ops.listRemotes(repo)).toEqual([
      { name: 'origin', url: 'https://example.invalid/r.git' },
    ]);
    await ops.removeRemote(repo, 'origin');
    expect(await ops.listRemotes(repo)).toEqual([]);
  });

  describe('detached HEAD', () => {
    it('reattaches to main when the detached commit is a fast-forward', async () => {
      write('a.md', 'a');
      const first = await ops.commitPaths(repo, { add: ['a.md'] }, 'a');
      write('b.md', 'b');
      const second = await ops.commitPaths(repo, { add: ['b.md'] }, 'b');
      await git.writeRef({ fs, dir, ref: 'refs/heads/main', value: first, force: true });
      fs.writeFileSync(path.join(dir, '.git', 'HEAD'), `${second}\n`);

      write('c.md', 'c');
      const third = await ops.commitPaths(repo, { add: ['c.md'] }, 'c');

      expect(fs.readFileSync(path.join(dir, '.git', 'HEAD'), 'utf8').trim()).toBe(
        'ref: refs/heads/main'
      );
      expect(await ops.resolveRef(repo, 'main')).toBe(third);
    });

    it('refuses to commit when that would drop commits from main', async () => {
      write('a.md', 'a');
      const first = await ops.commitPaths(repo, { add: ['a.md'] }, 'a');
      write('b.md', 'b');
      const second = await ops.commitPaths(repo, { add: ['b.md'] }, 'b');
      fs.writeFileSync(path.join(dir, '.git', 'HEAD'), `${first}\n`);

      write('c.md', 'c');
      await expect(ops.commitPaths(repo, { add: ['c.md'] }, 'c')).rejects.toBeInstanceOf(
        DetachedHeadError
      );
      expect(await ops.resolveRef(repo, 'refs/heads/main')).toBe(second);
    });

    it('canMoveMainTo: allowed when main does not exist yet', async () => {
      expect(await ops.canMoveMainTo(repo, 'a'.repeat(40))).toBe(true);
    });
  });
});

/**
 * Remote ops at the network boundary: isomorphic-git only speaks http(s), so
 * its remote calls are recorded instead of sent. Everything local is real.
 */
describe('gitOps remote: baselines travel with Push and Pull', () => {
  let calls: { op: string; ref?: string; tags?: boolean }[];
  let rejectTag: string | null;
  let remoteOps: GitOps;

  beforeEach(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tracyfy-gitops-'));
    calls = [];
    rejectTag = null;
    const record =
      (op: string) =>
      async ({ ref, tags }: { ref?: string; tags?: boolean }) => {
        calls.push({ op, ref, ...(tags ? { tags } : {}) });
        if (op === 'push' && ref === `refs/tags/${rejectTag}`) throw new Error('rejected');
        return op === 'fetch' ? {} : undefined;
      };
    const remoteGit = {
      ...git,
      push: record('push'),
      fetch: record('fetch'),
      pull: record('pull'),
    } as unknown as typeof git;
    remoteOps = createGitOps({ fs, git: remoteGit, getHttp: async () => ({}) });
    await remoteOps.init(dir);
    await remoteOps.addRemote(dir, 'origin', 'https://example.invalid/r.git');
    fs.writeFileSync(path.join(dir, 'a.md'), 'a');
    await remoteOps.commitPaths(dir, { add: ['a.md'] }, 'a');
    await remoteOps.annotatedTag(dir, '1.0', 'First');
    await remoteOps.annotatedTag(dir, '1.1', 'Second');
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('Push sends the branch and every baseline', async () => {
    await remoteOps.push(dir, { branch: 'main' });
    expect(calls).toEqual([
      { op: 'push', ref: 'main' },
      { op: 'push', ref: 'refs/tags/1.0' },
      { op: 'push', ref: 'refs/tags/1.1' },
    ]);
  });

  it('a baseline the remote refuses is reported; the others are still pushed', async () => {
    rejectTag = '1.0';
    await expect(remoteOps.push(dir, { branch: 'main' })).rejects.toThrow(
      /other baselines named 1\.0$/
    );
    expect(calls.map((c) => c.ref)).toEqual(['main', 'refs/tags/1.0', 'refs/tags/1.1']);
  });

  it('Pull and fetch bring the remote’s baselines', async () => {
    await remoteOps.pull(dir, { branch: 'main' });
    expect(calls).toEqual([
      { op: 'fetch', ref: 'main', tags: true },
      { op: 'pull', ref: 'main' },
    ]);
    calls = [];
    await remoteOps.fetch(dir, { branch: 'main' });
    expect(calls).toEqual([{ op: 'fetch', ref: 'main', tags: true }]);
  });
});
