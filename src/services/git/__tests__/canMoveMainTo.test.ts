// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import git from 'isomorphic-git';
import { canMoveMainTo } from '../gitCoreService';

const author = { name: 'Test', email: 'test@example.com' };

async function commitFile(dir: string, name: string, content: string) {
  await fs.promises.writeFile(path.join(dir, name), content);
  await git.add({ fs, dir, filepath: name });
  return git.commit({ fs, dir, message: `add ${name}`, author });
}

describe('canMoveMainTo', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tracyfy-git-'));
    await git.init({ fs, dir, defaultBranch: 'main' });
  });

  afterEach(async () => {
    await fs.promises.rm(dir, { recursive: true, force: true });
  });

  it('allows moving when main does not exist yet', async () => {
    expect(await canMoveMainTo({ fs, dir, oid: 'a'.repeat(40) })).toBe(true);
  });

  it('allows moving to the commit main already points at', async () => {
    const head = await commitFile(dir, 'a.md', 'a');
    expect(await canMoveMainTo({ fs, dir, oid: head })).toBe(true);
  });

  it('allows a fast-forward to a descendant of main', async () => {
    const first = await commitFile(dir, 'a.md', 'a');
    const second = await commitFile(dir, 'b.md', 'b');
    // Pretend main lags behind the detached commit
    await git.writeRef({ fs, dir, ref: 'refs/heads/main', value: first, force: true });
    expect(await canMoveMainTo({ fs, dir, oid: second })).toBe(true);
  });

  it('refuses moving main back to an older commit (would discard history)', async () => {
    const first = await commitFile(dir, 'a.md', 'a');
    await commitFile(dir, 'b.md', 'b');
    expect(await canMoveMainTo({ fs, dir, oid: first })).toBe(false);
  });
});
