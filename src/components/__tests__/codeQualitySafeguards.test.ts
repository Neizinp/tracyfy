import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Code Quality Safeguards
 *
 * These tests ensure that the codebase maintains its type safety and build integrity.
 * If these tests fail, it means we have introduced regressions that must be fixed.
 */
describe('Code Quality Safeguards', () => {
  it('should pass TypeScript type check', () => {
    try {
      // Run tsc --noEmit to verify full project type safety
      // Using execSync because this is an integration-style test for build integrity
      execSync('npm run typecheck', { stdio: 'pipe' });
    } catch (error: unknown) {
      const execError = error as { stdout?: Buffer; message: string };
      const output = execError.stdout?.toString() || execError.message;
      throw new Error(`TypeScript type check failed. Please fix these errors:\n${output}`);
    }
  });

  it('should not contain forbidden "any" types in critical files', () => {
    const CRITICAL_FILES = [
      'src/components/InformationModal.tsx',
      'src/components/UseCaseModal.tsx',
      'src/utils/pdf/pdfMainExport.ts',
      'src/components/__tests__/InformationModal.test.tsx',
      'src/components/__tests__/UseCaseModal.test.tsx',
      'src/components/__tests__/codeQualitySafeguards.test.ts',
    ];

    const forbiddenPatterns = [
      new RegExp(':' + '\\s*any', 'g'), // any as type
      new RegExp('as' + '\\s+any', 'g'), // any as cast
      new RegExp('<' + 'any>', 'g'), // any as generic
    ];

    const violations: string[] = [];

    CRITICAL_FILES.forEach((filePath) => {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        violations.push(`File not found: ${filePath}`);
        return;
      }

      const content = fs.readFileSync(fullPath, 'utf8');

      // Basic check for forbidden patterns
      forbiddenPatterns.forEach((pattern) => {
        if (pattern.test(content)) {
          violations.push(`${filePath}: Contains forbidden "any" usage (${pattern.source})`);
        }
      });
    });

    expect(violations, violations.join('\n')).toEqual([]);
  });
});
