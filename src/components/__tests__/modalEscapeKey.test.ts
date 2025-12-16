/**
 * Modal Escape Key Test
 *
 * This test enforces that all modal components support closing via Escape key.
 * All modals must either:
 * 1. Use the useKeyboardShortcuts hook with onClose callback, OR
 * 2. Have their own onKeyDown handler for Escape
 *
 * CONTRIBUTING GUIDELINES:
 * When creating new modals, you MUST add Escape key support.
 * The recommended approach is to use the useKeyboardShortcuts hook:
 *
 *   import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
 *
 *   useKeyboardShortcuts({
 *     onClose: onClose,
 *   });
 */

import { describe, it, expect } from 'vitest';

// Define modal files to check
// Note: UserOnboardingModal is excluded because it's a mandatory onboarding flow
// that must complete before the user can proceed (no onClose prop).
const MODAL_FILES = {
  RequirementModal: () => import('../RequirementModal.tsx?raw'),
  UseCaseModal: () => import('../UseCaseModal.tsx?raw'),
  TestCaseModal: () => import('../TestCaseModal.tsx?raw'),
  InformationModal: () => import('../InformationModal.tsx?raw'),
  RiskModal: () => import('../RiskModal.tsx?raw'),
  LinkModal: () => import('../LinkModal.tsx?raw'),
  EditLinkModal: () => import('../EditLinkModal.tsx?raw'),
  CreateProjectModal: () => import('../CreateProjectModal.tsx?raw'),
  ProjectSettingsModal: () => import('../ProjectSettingsModal.tsx?raw'),
  GlobalLibraryModal: () => import('../GlobalLibraryModal.tsx?raw'),
  UserSettingsModal: () => import('../UserSettingsModal.tsx?raw'),
  RemoteSettingsModal: () => import('../RemoteSettingsModal.tsx?raw'),
  ExportModal: () => import('../ExportModal.tsx?raw'),
  AdvancedSearchModal: () => import('../AdvancedSearchModal.tsx?raw'),
  CustomAttributeDefinitionModal: () => import('../CustomAttributeDefinitionModal.tsx?raw'),
};

describe('Modal Escape Key Pattern: All modals must close on Escape', () => {
  Object.entries(MODAL_FILES).forEach(([name, loadFile]) => {
    it(`${name} should support Escape key to close`, async () => {
      const module = await loadFile();
      const content = (module as { default: string }).default;

      // Check for useKeyboardShortcuts with onClose
      const hasKeyboardShortcutsHook = /useKeyboardShortcuts\s*\(\s*\{[^}]*onClose/.test(content);

      // Check for onKeyDown handler that handles Escape
      const hasEscapeKeyHandler = /onKeyDown[^}]*Escape|event\.key\s*===?\s*['"]Escape['"]/.test(
        content
      );

      // Check for document.addEventListener keydown with Escape
      const hasDocumentEscapeListener =
        /document\.addEventListener\s*\(\s*['"]keydown['"].*Escape|addEventListener.*keydown[^}]+Escape/.test(
          content
        );

      // Check for useEffect with Escape key handling
      const hasUseEffectEscape = /useEffect[^}]*Escape/.test(content);

      const hasEscapeSupport =
        hasKeyboardShortcutsHook ||
        hasEscapeKeyHandler ||
        hasDocumentEscapeListener ||
        hasUseEffectEscape;

      expect(
        hasEscapeSupport,
        `${name} must support Escape key to close. Use useKeyboardShortcuts({ onClose }) hook or add an Escape key handler.`
      ).toBe(true);
    });
  });
});
