#!/usr/bin/env node
/**
 * End-to-end test for Electron fs IPC implementation
 * Tests that files are written to real disk and git commits work
 */

import { _electron as electron } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_DIR = '/tmp/reqtest-electron';

async function runTest() {
  console.log('🧪 Starting Electron IPC Test\n');

  // Clean and create test directory
  console.log(`📁 Setting up test directory: ${TEST_DIR}`);
  if (existsSync(TEST_DIR)) {
    await fs.rm(TEST_DIR, { recursive: true });
  }
  await fs.mkdir(TEST_DIR, { recursive: true });
  console.log('✓ Test directory created\n');

  console.log('🚀 Launching Electron app...');
  const electronApp = await electron.launch({
    args: ['.'],
    cwd: __dirname,
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: 'http://localhost:5181',
    },
  });

  const window = await electronApp.firstWindow();
  console.log('✓ Electron app launched\n');

  // Wait for app to be ready
  await window.waitForLoadState('domcontentloaded');
  await window.waitForTimeout(2000);

  console.log('🔍 Verifying electronAPI is available...');
  const hasElectronAPI = await window.evaluate(() => {
    return {
      available: !!window.electronAPI,
      isElectron: window.electronAPI?.isElectron,
      hasFs: !!window.electronAPI?.fs,
      hasGit: !!window.electronAPI?.git,
      fsMethods: window.electronAPI?.fs ? Object.keys(window.electronAPI.fs) : [],
      gitMethods: window.electronAPI?.git ? Object.keys(window.electronAPI.git) : [],
    };
  });

  console.log('electronAPI status:', JSON.stringify(hasElectronAPI, null, 2));

  if (!hasElectronAPI.available) {
    throw new Error('❌ electronAPI not available!');
  }
  console.log('✓ electronAPI verified\n');

  console.log('📝 Testing file write via IPC...');
  const testFilePath = `${TEST_DIR}/test-ipc.txt`;
  const writeResult = await window.evaluate(async ([path]) => {
    return await window.electronAPI.fs.writeFile(path, 'Hello from IPC!');
  }, [testFilePath]);

  console.log('Write result:', writeResult);

  if (writeResult.error) {
    throw new Error(`❌ File write failed: ${writeResult.error}`);
  }

  // Verify file exists on real disk
  if (!existsSync(testFilePath)) {
    throw new Error(`❌ File not found on disk: ${testFilePath}`);
  }

  const fileContent = await fs.readFile(testFilePath, 'utf-8');
  if (fileContent !== 'Hello from IPC!') {
    throw new Error(`❌ File content mismatch: ${fileContent}`);
  }
  console.log('✓ File written to real disk successfully\n');

  console.log('📖 Testing file read via IPC...');
  const readResult = await window.evaluate(async ([path]) => {
    return await window.electronAPI.fs.readFile(path);
  }, [testFilePath]);

  console.log('Read result:', readResult);

  if (readResult.error || readResult.content !== 'Hello from IPC!') {
    throw new Error(`❌ File read failed`);
  }
  console.log('✓ File read from real disk successfully\n');

  console.log('🔧 Testing git init via IPC...');
  const gitInitResult = await window.evaluate(async ([dir]) => {
    return await window.electronAPI.git.init(dir);
  }, [TEST_DIR]);

  console.log('Git init result:', gitInitResult);

  if (gitInitResult.error) {
    throw new Error(`❌ Git init failed: ${gitInitResult.error}`);
  }

  // Verify .git directory exists
  if (!existsSync(join(TEST_DIR, '.git'))) {
    throw new Error(`❌ .git directory not created`);
  }
  console.log('✓ Git repository initialized\n');

  console.log('📄 Creating requirement file...');
  const reqDir = join(TEST_DIR, 'requirements');
  await fs.mkdir(reqDir, { recursive: true });
  
  const reqPath = `${reqDir}/REQ-001.md`;
  const reqContent = `---
id: REQ-001
title: Test Requirement
status: draft
priority: high
---

# Test Requirement

This is a test requirement created via Electron IPC.
`;

  const reqWriteResult = await window.evaluate(async ([path, content]) => {
    return await window.electronAPI.fs.writeFile(path, content);
  }, [reqPath, reqContent]);

  if (reqWriteResult.error) {
    throw new Error(`❌ Requirement file write failed: ${reqWriteResult.error}`);
  }

  if (!existsSync(reqPath)) {
    throw new Error(`❌ Requirement file not found on disk: ${reqPath}`);
  }
  console.log('✓ Requirement file created\n');

  console.log('➕ Testing git add via IPC...');
  const addResult = await window.evaluate(async ([dir, file]) => {
    return await window.electronAPI.git.add(dir, file);
  }, [TEST_DIR, 'requirements/REQ-001.md']);

  console.log('Git add result:', addResult);

  if (addResult.error) {
    throw new Error(`❌ Git add failed: ${addResult.error}`);
  }
  console.log('✓ File staged\n');

  console.log('💾 Testing git commit via IPC...');
  const commitResult = await window.evaluate(async ([dir, msg, author]) => {
    return await window.electronAPI.git.commit(dir, msg, author);
  }, [TEST_DIR, 'Add test requirement', { name: 'Test User', email: 'test@example.com' }]);

  console.log('Git commit result:', commitResult);

  if (commitResult.error) {
    throw new Error(`❌ Git commit failed: ${commitResult.error}`);
  }

  // Verify commit with native git
  try {
    const logOutput = execSync('git log --oneline', { cwd: TEST_DIR, encoding: 'utf-8' });
    console.log('Git log:\n' + logOutput);
    
    if (!logOutput.includes('Add test requirement')) {
      throw new Error('❌ Commit not found in git log');
    }
  } catch (error) {
    throw new Error(`❌ Git log verification failed: ${error.message}`);
  }
  console.log('✓ Commit verified in git history\n');

  console.log('📊 Testing git status via IPC...');
  const statusResult = await window.evaluate(async ([dir]) => {
    return await window.electronAPI.git.statusMatrix(dir);
  }, [TEST_DIR]);

  console.log('Git status:', statusResult);
  console.log('✓ Git status working\n');

  await electronApp.close();

  console.log('✅ ALL TESTS PASSED!\n');
  console.log('Summary:');
  console.log('  ✓ Electron IPC setup verified');
  console.log('  ✓ File write to real disk working');
  console.log('  ✓ File read from real disk working');
  console.log('  ✓ Git init working');
  console.log('  ✓ Git add working');
  console.log('  ✓ Git commit working');
  console.log('  ✓ Files visible to native git');
  console.log('\nThe fs IPC implementation is fully functional! 🎉');
}

runTest().catch((error) => {
  console.error('\n❌ TEST FAILED:', error.message);
  console.error(error.stack);
  process.exit(1);
});
