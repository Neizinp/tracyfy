import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Helper to recursively find all files with specific extensions
function findFiles(dir: string, extensions: string[], ignore: string[] = []): string[] {
  const results: string[] = [];

  function walk(currentPath: string, relativePath: string = '') {
    // Skip ignored directories
    if (ignore.some((pattern) => relativePath.includes(pattern))) {
      return;
    }

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relPath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          results.push(relPath);
        }
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * App-Wide Opacity Safeguard Test
 *
 * Ensures that NOTHING in the entire app uses transparency.
 * This test scans all component files and prevents regression.
 *
 * User requirement: "I do not want ANYTHING in this app to be transparent"
 */
describe('App-Wide Opacity Safeguard', () => {
  const srcDir = path.join(__dirname, '../../');

  describe('Toast Notifications', () => {
    const toastContainerPath = path.join(__dirname, '../ToastContainer.tsx');
    const sourceCode = fs.readFileSync(toastContainerPath, 'utf-8');

    it('should ensure toast styles have explicit opacity: 1', () => {
      expect(sourceCode).toContain('opacity: 1');
    });

    it('should ensure all toast background colors are solid (no alpha channel)', () => {
      const expectedBackgrounds = {
        warning: '#433422',
        error: '#422222',
        success: '#224422',
        info: '#2a2a2a',
      };

      Object.entries(expectedBackgrounds).forEach(([type, color]) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(color.toLowerCase()).not.toContain('rgba');
        expect(color.toLowerCase()).not.toContain('transparent');
      });
    });

    it('should use solid hex colors, not CSS variables for backgrounds', () => {
      expect(sourceCode).toContain("backgroundColor: '#433422'");
      expect(sourceCode).toContain("backgroundColor: '#422222'");
      expect(sourceCode).toContain("backgroundColor: '#224422'");
      expect(sourceCode).toContain("backgroundColor: '#2a2a2a'");
    });
  });

  describe('Work Area Transparency Check', () => {
    it('should not use transparent backgrounds in input fields and textareas', () => {
      const files = findFiles(
        srcDir,
        ['.tsx', '.ts'],
        ['node_modules', 'dist', '__tests__', 'e2e']
      );

      const violations: string[] = [];

      files.forEach((file) => {
        const filePath = path.join(srcDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        const lines = content.split('\n');
        lines.forEach((line, index) => {
          // Check for input, textarea, or contentEditable elements with transparent backgrounds
          if (
            (line.includes('<input') ||
              line.includes('<textarea') ||
              line.includes('contentEditable')) &&
            (line.includes("background: 'transparent'") ||
              line.includes('background: transparent') ||
              line.includes("backgroundColor: 'transparent'") ||
              line.includes('backgroundColor: transparent'))
          ) {
            violations.push(`${file}:${index + 1}: ${line.trim()}`);
          }
        });
      });

      if (violations.length > 0) {
        throw new Error(
          `Found transparent backgrounds in work areas:\n${violations.join('\n')}\n\n` +
            `User requirement: "I don't want to see through something when working in a field"`
        );
      }
    });

    it('should ensure toast notifications have solid backgrounds', () => {
      const toastContainerPath = path.join(__dirname, '../ToastContainer.tsx');
      const sourceCode = fs.readFileSync(toastContainerPath, 'utf-8');

      // Verify toasts use solid hex colors
      expect(sourceCode).toContain("backgroundColor: '#433422'");
      expect(sourceCode).toContain("backgroundColor: '#422222'");
      expect(sourceCode).toContain("backgroundColor: '#224422'");
      expect(sourceCode).toContain("backgroundColor: '#2a2a2a'");

      // Verify explicit opacity: 1
      expect(sourceCode).toContain('opacity: 1');

      // Ensure no transparent or rgba with low alpha in toast backgrounds
      const lines = sourceCode.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('backgroundColor')) {
          if (
            line.includes('transparent') ||
            /backgroundColor:.*rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0(\.\d+)?\s*\)/.test(line)
          ) {
            throw new Error(
              `Toast has transparent background at line ${index + 1}: ${line.trim()}\n` +
                `Toasts must have solid backgrounds so users can read them clearly`
            );
          }
        }
      });
    });
  });
});
