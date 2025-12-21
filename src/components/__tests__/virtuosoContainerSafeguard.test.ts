/**
 * Virtuoso Container Safeguard Tests
 *
 * Ensures react-virtuoso containers have proper height configuration.
 * This prevents the bug where tables render 0 rows due to minHeight: 0.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const COMPONENTS_DIR = path.join(__dirname, '../../components');

describe('Virtuoso Container Safeguards', () => {
  const componentsUsingVirtuoso = [
    'LinksView.tsx',
    'RequirementList.tsx',
    'UseCaseList.tsx',
    'TestCaseList.tsx',
    'InformationList.tsx',
    'RiskList.tsx',
    'DocumentList.tsx',
  ];

  describe('Components using BaseArtifactTable should have proper container height', () => {
    componentsUsingVirtuoso.forEach((file) => {
      it(`${file} should not have minHeight: 0 on table container`, () => {
        const filePath = path.join(COMPONENTS_DIR, file);

        if (!fs.existsSync(filePath)) {
          return; // Skip if file doesn't exist
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        // Check if component uses BaseArtifactTable
        if (!content.includes('BaseArtifactTable')) {
          return; // Skip if doesn't use BaseArtifactTable
        }

        // Check for problematic pattern: minHeight: 0 with flex: 1
        // This pattern causes react-virtuoso to render 0 rows
        const hasProblematicPattern = /style\s*=\s*\{\s*\{[^}]*minHeight:\s*0[^}]*\}\s*\}/.test(
          content
        );

        if (hasProblematicPattern) {
          // Also check if there's a flex: 1 nearby (within 100 chars)
          const minHeightMatch = content.match(/minHeight:\s*0/);
          if (minHeightMatch) {
            const startIdx = Math.max(0, minHeightMatch.index! - 100);
            const endIdx = Math.min(content.length, minHeightMatch.index! + 100);
            const context = content.slice(startIdx, endIdx);

            if (context.includes('flex: 1') || context.includes('flex:1')) {
              expect.fail(
                `${file} has problematic minHeight: 0 with flex: 1 pattern that breaks react-virtuoso`
              );
            }
          }
        }
      });
    });
  });

  describe('BaseArtifactTable should have fixed height container', () => {
    it('BaseArtifactTable should have height: 100% on outer div', () => {
      const filePath = path.join(COMPONENTS_DIR, 'BaseArtifactTable.tsx');

      if (!fs.existsSync(filePath)) {
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');

      // Should have height: '100%' in the outer container style
      expect(content).toContain("height: '100%'");
    });
  });
});
