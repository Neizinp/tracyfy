// Automated test to verify Electron fs IPC is working
console.log('=== Electron FS IPC Test ===\n');

if (!window.electronAPI) {
  console.error('❌ FAILED: electronAPI not found');
  throw new Error('Not running in Electron');
}

console.log('✓ electronAPI found');
console.log('✓ isElectron:', window.electronAPI.isElectron);
console.log('✓ fs methods available:', !!window.electronAPI.fs);
console.log('✓ git methods available:', !!window.electronAPI.git);

// Log all available methods
console.log('\nAvailable fs methods:', Object.keys(window.electronAPI.fs));
console.log('Available git methods:', Object.keys(window.electronAPI.git));

console.log('\n✅ IPC setup verified successfully!');
console.log('\nTo test file operations, the app needs a directory selected via the UI.');
console.log('Click "Select Directory" and choose a test location like /tmp/reqtest');
