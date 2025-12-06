#!/usr/bin/env node
/**
 * Regression test: handles missing .git/HEAD by reinitializing and committing successfully.
 */
import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import git from 'isomorphic-git';

const TEST_DIR = `/tmp/reqtest-missing-head-${Date.now()}`;

async function main() {
  console.log('🧪 Missing HEAD Regression Test');
  console.log('Test dir:', TEST_DIR);

  await fs.mkdir(TEST_DIR, { recursive: true });

  // 1) Init normally, then remove HEAD to simulate broken repo
  await git.init({ fs, dir: TEST_DIR, defaultBranch: 'main' });
  await fs.unlink(path.join(TEST_DIR, '.git', 'HEAD'));
  console.log('→ Simulated broken repo (HEAD removed)');

  // 2) App logic: recreate HEAD file before re-init
  await fs.writeFile(path.join(TEST_DIR, '.git', 'HEAD'), 'ref: refs/heads/main\n');
  await fs.mkdir(path.join(TEST_DIR, '.git', 'refs', 'heads'), { recursive: true });
  await fs.writeFile(path.join(TEST_DIR, '.git', 'refs', 'heads', 'main'), '');

  // 3) Re-init to repair (mirrors app logic)
  await git.init({ fs, dir: TEST_DIR, defaultBranch: 'main' });
  if (!existsSync(path.join(TEST_DIR, '.git', 'HEAD'))) {
    throw new Error('HEAD was not recreated after re-init');
  }
  console.log('✓ HEAD recreated by git init');

  // 4) Write file and commit
  const reqDir = path.join(TEST_DIR, 'requirements');
  await fs.mkdir(reqDir, { recursive: true });
  const reqPath = path.join(reqDir, 'REQ-001.md');
  await fs.writeFile(
    reqPath,
    `---\nid: REQ-001\ntitle: Test\nstatus: draft\npriority: high\n---\n\n# Test\n`
  );
  await git.add({ fs, dir: TEST_DIR, filepath: 'requirements/REQ-001.md' });
  const sha = await git.commit({
    fs,
    dir: TEST_DIR,
    message: 'Commit after head repair',
    author: { name: 'Test User', email: 'test@example.com' },
  });
  console.log('✓ Commit succeeded:', sha);

  const status = await git.statusMatrix({ fs, dir: TEST_DIR });
  const entry = status.find(([f]) => f === 'requirements/REQ-001.md');
  if (!entry || entry[1] !== 1 || entry[2] !== 1 || entry[3] !== 1) {
    throw new Error('Status not clean after commit');
  }
  console.log('✓ Status clean after commit');

  console.log('\n✅ Missing HEAD regression test passed');
}

main().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
