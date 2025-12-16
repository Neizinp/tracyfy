/**
 * UI Pattern Tests - Artifact List Views
 *
 * These tests enforce consistent UI patterns across artifact list pages.
 *
 * RULE: Artifact rows must NOT have inline edit/delete buttons.
 * Editing is done by clicking the row, not via separate buttons.
 */

import { describe, it, expect } from 'vitest';

// Import file contents directly using Vite's raw import
// NOTE: This test is for LIST/VIEW components only, not Page components.
// Page components (RequirementsPage, UseCasesPage, etc.) ARE allowed to have
// Plus icons for Add buttons - that's the expected pattern.
const ARTIFACT_LIST_FILES = {
  // List/View components only - these should not have inline action buttons
  UseCaseList: () => import('../UseCaseList.tsx?raw'),
  TestCaseList: () => import('../TestCaseList.tsx?raw'),
  InformationList: () => import('../InformationList.tsx?raw'),
  RiskList: () => import('../RiskList.tsx?raw'),
  DetailedRequirementView: () => import('../DetailedRequirementView.tsx?raw'),
  LinksView: () => import('../LinksView.tsx?raw'),
};

describe('UI Pattern: No inline edit/delete buttons on artifact rows', () => {
  Object.entries(ARTIFACT_LIST_FILES).forEach(([name, loadFile]) => {
    describe(name, () => {
      it('should not have Pencil import (no inline edit buttons)', async () => {
        const module = await loadFile();
        const content = (module as { default: string }).default;

        // Check for Pencil import from lucide-react
        const hasPencilImport =
          /import\s+\{[^}]*\bPencil\b[^}]*\}\s+from\s+['"]lucide-react['"]/.test(content);

        expect(
          hasPencilImport,
          `${name} should not import Pencil icon - editing is done by clicking the row`
        ).toBe(false);
      });

      it('should not have Plus import (no inline add buttons)', async () => {
        // LinksView is an exception - it has a header toolbar where the Add button belongs
        // (not inline on rows). This is passed via the onAdd prop.
        if (name === 'LinksView') return;

        const module = await loadFile();
        const content = (module as { default: string }).default;

        // Check for Plus import from lucide-react
        const hasPlusImport = /import\s+\{[^}]*\bPlus\b[^}]*\}\s+from\s+['"]lucide-react['"]/.test(
          content
        );

        expect(
          hasPlusImport,
          `${name} should not import Plus icon - creation is done via header bar Create New menu`
        ).toBe(false);
      });

      it('should not have Trash import (no inline delete buttons)', async () => {
        const module = await loadFile();
        const content = (module as { default: string }).default;

        // Check for Trash or Trash2 import from lucide-react
        const hasTrashImport =
          /import\s+\{[^}]*\bTrash2?\b[^}]*\}\s+from\s+['"]lucide-react['"]/.test(content);

        expect(
          hasTrashImport,
          `${name} should not import Trash icon - deletion is done via modal`
        ).toBe(false);
      });

      it('rows should have click handler for editing', async () => {
        const module = await loadFile();
        const content = (module as { default: string }).default;

        // Should have onClick handler somewhere
        const hasOnClick = /onClick\s*[=:]/.test(content);

        // Should have cursor: pointer somewhere
        const hasCursorPointer = /cursor:\s*['"]?pointer/.test(content);

        expect(hasOnClick || hasCursorPointer, `${name} should have clickable rows`).toBe(true);
      });
    });
  });
});

/**
 * CONTRIBUTING GUIDELINES:
 *
 * When adding new artifact list views:
 * 1. DO NOT add inline Pencil/Edit buttons on rows
 * 2. DO NOT add inline Plus/Add buttons - creation is via header bar "Create New" menu
 * 3. DO NOT add inline Trash/Delete buttons on rows
 * 4. DO add onClick handler to the entire row
 * 5. DO add cursor: 'pointer' style to rows
 *
 * Editing flow:
 * - Click row → opens edit modal
 * - Delete is handled inside the modal, not from the list
 * - Create is handled via header bar "Create New" menu
 */
