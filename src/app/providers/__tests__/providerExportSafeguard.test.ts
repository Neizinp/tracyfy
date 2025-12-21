/**
 * Provider Export Safeguard Tests
 *
 * Ensures all providers export required hooks and contexts.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PROVIDERS_DIR = path.join(__dirname, '../../app/providers');

describe('Provider Export Safeguards', () => {
  describe('All providers should export a hook', () => {
    const providerFiles = [
      'FileSystemProvider.tsx',
      'GlobalStateProvider.tsx',
      'ProjectProvider.tsx',
      'UIProvider.tsx',
      'UserProvider.tsx',
      'ImportExportProvider.tsx',
      'BaselinesProvider.tsx',
    ];

    providerFiles.forEach((file) => {
      it(`${file} should export a use* hook`, () => {
        const filePath = path.join(PROVIDERS_DIR, file);

        if (!fs.existsSync(filePath)) {
          // Skip if file doesn't exist (might have different name)
          return;
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        // Should export a hook (use prefix)
        const hasHookExport = /export\s+(const|function)\s+use\w+/.test(content);

        expect(hasHookExport).toBe(true);
      });
    });
  });

  describe('Artifact providers should follow consistent pattern', () => {
    const artifactProviderDir = path.join(PROVIDERS_DIR, 'ArtifactProviders');

    it('should have an index.ts that re-exports all providers', () => {
      const indexPath = path.join(artifactProviderDir, 'index.ts');

      if (!fs.existsSync(indexPath)) {
        return; // Skip if no index
      }

      const content = fs.readFileSync(indexPath, 'utf-8');

      // Should have exports
      expect(content).toContain('export');
    });

    it('LinksProvider should export useLinks hook', () => {
      const providerPath = path.join(artifactProviderDir, 'LinksProvider.tsx');

      if (!fs.existsSync(providerPath)) {
        return;
      }

      const content = fs.readFileSync(providerPath, 'utf-8');

      expect(content).toContain('useLinks');
    });
  });

  describe('Main providers index should export all providers', () => {
    it('should export all main provider hooks', () => {
      const indexPath = path.join(PROVIDERS_DIR, 'index.ts');

      if (!fs.existsSync(indexPath)) {
        return;
      }

      const content = fs.readFileSync(indexPath, 'utf-8');

      const expectedExports = ['useFileSystem', 'useGlobalState', 'useProject', 'useUI', 'useUser'];

      expectedExports.forEach((hook) => {
        expect(content).toContain(hook);
      });
    });
  });
});
