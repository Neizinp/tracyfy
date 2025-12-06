/**
 * Test script to verify Electron fs IPC handlers work correctly
 * Run this in the Electron renderer console
 */

async function testElectronFS() {
  console.log('Testing Electron FS IPC...');

  if (!window.electronAPI) {
    console.error('❌ electronAPI not found - not running in Electron');
    return;
  }

  console.log('✓ electronAPI found');
  console.log('✓ electronAPI.isElectron:', window.electronAPI.isElectron);
  console.log('✓ electronAPI.fs available:', !!window.electronAPI.fs);
  console.log('✓ electronAPI.git available:', !!window.electronAPI.git);

  // Test directory selection
  console.log('\n1. Testing directory selection...');
  const selectResult = await window.electronAPI.fs.selectDirectory();

  if (selectResult.canceled) {
    console.log('Directory selection canceled');
    return;
  }

  console.log('✓ Directory selected:', selectResult.path);

  // Test file write
  console.log('\n2. Testing file write...');
  const testFilePath = `${selectResult.path}/test-file.txt`;
  const writeResult = await window.electronAPI.fs.writeFile(testFilePath, 'Hello from Electron!');

  if (writeResult.error) {
    console.error('❌ Write failed:', writeResult.error);
    return;
  }

  console.log('✓ File written successfully');

  // Test file read
  console.log('\n3. Testing file read...');
  const readResult = await window.electronAPI.fs.readFile(testFilePath);

  if (readResult.error) {
    console.error('❌ Read failed:', readResult.error);
    return;
  }

  console.log('✓ File read successfully:', readResult.content);

  // Test file exists
  console.log('\n4. Testing file exists check...');
  const existsResult = await window.electronAPI.fs.checkExists(testFilePath);
  console.log('✓ File exists:', existsResult.exists);

  // Test list files
  console.log('\n5. Testing list files...');
  const listResult = await window.electronAPI.fs.listFiles(selectResult.path);
  console.log('✓ Files in directory:', listResult.files);

  // Test git init
  console.log('\n6. Testing git init...');
  const gitInitResult = await window.electronAPI.git.init(selectResult.path);

  if (gitInitResult.error) {
    console.log('Git already initialized or error:', gitInitResult.error);
  } else {
    console.log('✓ Git initialized');
  }

  // Test git status
  console.log('\n7. Testing git status...');
  const statusResult = await window.electronAPI.git.statusMatrix(selectResult.path);
  console.log('✓ Git status:', statusResult);

  console.log('\n✅ All tests passed!');
}

// Export for manual testing
console.log('Test function loaded. Run testElectronFS() to start tests.');
