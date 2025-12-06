#!/usr/bin/env node
/**
 * End-to-end git status regression test for requirement files.
 * - Initializes repo with HEAD
 * - Writes REQ-001
 * - Verifies statusMatrix shows it as new
 * - Commits and verifies clean status
 */
import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import git from 'isomorphic-git';

const TEST_DIR = `/tmp/reqtest-pending-${Date.now()}`;

async function main() {
  console.log('🧪 Pending Changes Regression Test');
  console.log('Test dir:', TEST_DIR);

  await fs.mkdir(TEST_DIR, { recursive: true });

  // Init repo + initial commit to ensure HEAD exists
  await git.init({ fs, dir: TEST_DIR, defaultBranch: 'main' });
  await fs.writeFile(path.join(TEST_DIR, 'README.md'), '# Test Repo\n');
  await git.add({ fs, dir: TEST_DIR, filepath: 'README.md' });
  await git.commit({
    fs,
    dir: TEST_DIR,
    message: 'Initial commit',
    author: { name: 'Test User', email: 'test@example.com' },
  });
  if (!existsSync(path.join(TEST_DIR, '.git', 'HEAD'))) {
    throw new Error('HEAD missing after init');
  }

  // Write requirement
  const reqDir = path.join(TEST_DIR, 'requirements');
  await fs.mkdir(reqDir, { recursive: true });
  await fs.writeFile(
    path.join(reqDir, 'REQ-001.md'),
    `---\nid: REQ-001\ntitle: Pending Test\nstatus: draft\npriority: high\n---\n\n# Pending Test\n`
  );

  // Check status matrix for pending change
  const status = await git.statusMatrix({ fs, dir: TEST_DIR });
  const reqStatus = status.find(([f]) => f === 'requirements/REQ-001.md');
  if (!reqStatus) {
    throw new Error('REQ-001.md not found in statusMatrix');
  }
  const [, head, workdir, stage] = reqStatus;
  if (!(head === 0 && workdir === 2 && stage === 0)) {
    throw new Error(`REQ-001.md not marked as new. Got [${head}, ${workdir}, ${stage}]`);
  }
  if (status.filter(([f, h, w, s]) => h !== 1 || w !== 1 || s !== 1).length !== 1) {
    throw new Error('Pending changes count mismatch (expected exactly REQ-001 as pending)');
  }
  console.log('✓ REQ-001 shows as NEW in statusMatrix');

  // Commit and verify clean
  await git.add({ fs, dir: TEST_DIR, filepath: 'requirements/REQ-001.md' });
  await git.commit({
    fs,
    dir: TEST_DIR,
    message: 'Add REQ-001',
    author: { name: 'Test User', email: 'test@example.com' },
  });
  const statusAfter = await git.statusMatrix({ fs, dir: TEST_DIR });
  const reqAfter = statusAfter.find(([f]) => f === 'requirements/REQ-001.md');
  if (!reqAfter || reqAfter[1] !== 1 || reqAfter[2] !== 1 || reqAfter[3] !== 1) {
    throw new Error('REQ-001 not clean after commit');
  }
  console.log('✓ REQ-001 clean after commit');

  console.log('\n✅ Pending changes regression test passed');
}

main().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
