const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const SERVICES_DIR = path.join(SRC_DIR, 'services');

let errors = 0;

function walk(dir, callback) {
    fs.readdirSync(dir).forEach((file) => {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walk(filepath, callback);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            callback(filepath);
        }
    });
}

console.log('🔍 Auditing Architecture Standards...');

walk(SRC_DIR, (filepath) => {
    const content = fs.readFileSync(filepath, 'utf-8');
    const relativePath = path.relative(path.join(__dirname, '..'), filepath);

    // Rule 1: No direct useFileSystem() or fileSystemService access outside services/providers
    const isExcludedFromFileSystemRule =
        filepath.startsWith(SERVICES_DIR) ||
        filepath.includes('__tests__') ||
        filepath.includes('FileSystemProvider.tsx') ||
        filepath.includes('ArtifactModals.tsx') ||
        filepath.includes('ArtifactProviders') ||
        filepath.includes('GlobalStateProvider.tsx') ||
        filepath.includes('ProjectProvider.tsx') ||
        filepath.includes('UserProvider.tsx') ||
        filepath.includes('CustomAttributeProvider.tsx') ||
        filepath.includes('AppContent.tsx') ||
        filepath.includes('DirectorySelector.tsx') ||
        filepath.includes('PendingChangesPanel.tsx') ||
        filepath.includes('ManagementModals.tsx') ||
        filepath.includes('ProjectModals.tsx') ||
        filepath.includes('ProjectLayout.tsx');

    if (!isExcludedFromFileSystemRule) {
        if (content.includes('useFileSystem()') || content.includes('fileSystemService')) {
            console.error(
                `❌ [Architecture Violation] Direct file system access found in ${relativePath}. Use a high-level Service instead.`
            );
            errors++;
        }
    }

    // Rule 2: Disk services must extend proper base classes
    const isDiskService =
        filepath.startsWith(SERVICES_DIR) &&
        path.basename(filepath).startsWith('disk') &&
        !filepath.includes('base') &&
        !filepath.includes('__tests__') &&
        !filepath.includes('git');

    if (isDiskService) {
        if (!content.includes('extends BaseDiskService') && !content.includes('extends BaseArtifactService')) {
            console.error(
                `❌ [Architecture Violation] Service in ${relativePath} should extend BaseDiskService or BaseArtifactService.`
            );
            errors++;
        }
    }
});

if (errors === 0) {
    console.log('✅ Architecture audit passed!');
    process.exit(0);
} else {
    console.error(`\n💥 Found ${errors} architecture violations.`);
    process.exit(1);
}
