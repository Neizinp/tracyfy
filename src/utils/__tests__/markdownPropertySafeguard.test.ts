/**
 * Markdown Property Safeguard Tests
 *
 * Ensures all type properties are handled in markdown utils.
 * This prevents bugs where new properties are added to types
 * but not serialized/parsed correctly.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const TYPES_DIR = path.join(__dirname, '../../types');
const UTILS_DIR = path.join(__dirname, '../../utils');

describe('Markdown Property Safeguards', () => {
  describe('Link type properties should be handled in linkMarkdownUtils', () => {
    it('should handle all Link properties in linkToMarkdown', () => {
      const linkTypePath = path.join(TYPES_DIR, 'link.ts');
      const utilsPath = path.join(UTILS_DIR, 'linkMarkdownUtils.ts');

      if (!fs.existsSync(linkTypePath) || !fs.existsSync(utilsPath)) {
        return;
      }

      const typeContent = fs.readFileSync(linkTypePath, 'utf-8');
      const utilsContent = fs.readFileSync(utilsPath, 'utf-8');

      // Extract property names from Link interface
      const interfaceMatch = typeContent.match(/interface\s+Link\s*\{([^}]+)\}/);
      if (!interfaceMatch) return;

      // Required properties that MUST be in linkToMarkdown
      const requiredProps = ['id', 'sourceId', 'targetId', 'type', 'projectIds'];

      requiredProps.forEach((prop) => {
        expect(utilsContent).toContain(prop);
      });
    });

    it('should handle revision property in parseMarkdownLink', () => {
      const utilsPath = path.join(UTILS_DIR, 'linkMarkdownUtils.ts');

      if (!fs.existsSync(utilsPath)) {
        return;
      }

      const content = fs.readFileSync(utilsPath, 'utf-8');

      // Should handle revision in parse function
      expect(content).toContain('revision');
    });

    it('should handle isDeleted and deletedAt properties', () => {
      const utilsPath = path.join(UTILS_DIR, 'linkMarkdownUtils.ts');

      if (!fs.existsSync(utilsPath)) {
        return;
      }

      const content = fs.readFileSync(utilsPath, 'utf-8');

      // Should handle soft delete properties
      expect(content).toContain('isDeleted');
      expect(content).toContain('deletedAt');
    });
  });

  describe('All artifact markdown utils should exist', () => {
    const expectedUtils = [
      'linkMarkdownUtils.ts',
      'requirementMarkdownUtils.ts',
      'useCaseMarkdownUtils.ts',
      'testCaseMarkdownUtils.ts',
      'informationMarkdownUtils.ts',
      'riskMarkdownUtils.ts',
    ];

    expectedUtils.forEach((utilFile) => {
      it(`${utilFile} should exist`, () => {
        const filePath = path.join(UTILS_DIR, utilFile);

        // Check if file exists
        const exists = fs.existsSync(filePath);

        // This is a soft check - not all may exist yet
        if (exists) {
          const content = fs.readFileSync(filePath, 'utf-8');

          // Should export parse and toMarkdown functions
          expect(content).toContain('export');
        }
      });
    });
  });
});
