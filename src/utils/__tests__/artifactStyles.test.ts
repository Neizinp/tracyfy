import { describe, it, expect } from 'vitest';
import {
  getPriorityStyle,
  getStatusStyle,
  badgeStyle,
  idBadgeStyle,
  revisionBadgeStyle,
} from '../artifactStyles';

describe('artifactStyles', () => {
  describe('getPriorityStyle', () => {
    it('should return error style for high priority', () => {
      const style = getPriorityStyle('high');
      expect(style.bg).toBe('var(--color-error-bg)');
      expect(style.text).toBe('var(--color-error-light)');
    });

    it('should return warning style for medium priority', () => {
      const style = getPriorityStyle('medium');
      expect(style.bg).toBe('var(--color-warning-bg)');
      expect(style.text).toBe('var(--color-warning-light)');
    });

    it('should return success style for low priority', () => {
      const style = getPriorityStyle('low');
      expect(style.bg).toBe('var(--color-success-bg)');
      expect(style.text).toBe('var(--color-success-light)');
    });

    it('should return default style for unknown priority', () => {
      const style = getPriorityStyle('unknown');
      expect(style.bg).toBe('var(--color-bg-tertiary)');
      expect(style.text).toBe('var(--color-text-secondary)');
    });
  });

  describe('getStatusStyle', () => {
    it('should return success style for verified status', () => {
      const style = getStatusStyle('verified');
      expect(style.bg).toBe('var(--color-success-bg)');
      expect(style.text).toBe('var(--color-success-light)');
    });

    it('should return success style for passed status', () => {
      const style = getStatusStyle('passed');
      expect(style.bg).toBe('var(--color-success-bg)');
      expect(style.text).toBe('var(--color-success-light)');
    });

    it('should return error style for failed status', () => {
      const style = getStatusStyle('failed');
      expect(style.bg).toBe('var(--color-error-bg)');
      expect(style.text).toBe('var(--color-error-light)');
    });

    it('should return error style for rejected status', () => {
      const style = getStatusStyle('rejected');
      expect(style.bg).toBe('var(--color-error-bg)');
      expect(style.text).toBe('var(--color-error-light)');
    });

    it('should return warning style for blocked status', () => {
      const style = getStatusStyle('blocked');
      expect(style.bg).toBe('var(--color-warning-bg)');
      expect(style.text).toBe('var(--color-warning-light)');
    });

    it('should return warning style for pending status', () => {
      const style = getStatusStyle('pending');
      expect(style.bg).toBe('var(--color-warning-bg)');
      expect(style.text).toBe('var(--color-warning-light)');
    });

    it('should return info style for implemented status', () => {
      const style = getStatusStyle('implemented');
      expect(style.bg).toBe('var(--color-info-bg)');
      expect(style.text).toBe('var(--color-info-light)');
    });

    it('should return info style for approved status', () => {
      const style = getStatusStyle('approved');
      expect(style.bg).toBe('var(--color-info-bg)');
      expect(style.text).toBe('var(--color-info-light)');
    });

    it('should return default style for draft status', () => {
      const style = getStatusStyle('draft');
      expect(style.bg).toBe('var(--color-bg-tertiary)');
      expect(style.text).toBe('var(--color-text-secondary)');
    });

    it('should return default style for not_run status', () => {
      const style = getStatusStyle('not_run');
      expect(style.bg).toBe('var(--color-bg-tertiary)');
      expect(style.text).toBe('var(--color-text-secondary)');
    });

    it('should return default style for unknown status', () => {
      const style = getStatusStyle('unknown');
      expect(style.bg).toBe('var(--color-bg-tertiary)');
      expect(style.text).toBe('var(--color-text-secondary)');
    });
  });

  describe('style constants', () => {
    it('should export badgeStyle with correct properties', () => {
      expect(badgeStyle.padding).toBe('2px 8px');
      expect(badgeStyle.borderRadius).toBe('4px');
      expect(badgeStyle.fontSize).toBe('var(--font-size-xs)');
      expect(badgeStyle.textTransform).toBe('capitalize');
      expect(badgeStyle.fontWeight).toBe(500);
    });

    it('should export idBadgeStyle with correct properties', () => {
      expect(idBadgeStyle.fontFamily).toBe('monospace');
      expect(idBadgeStyle.fontSize).toBe('var(--font-size-sm)');
      expect(idBadgeStyle.color).toBe('var(--color-accent-light)');
    });

    it('should export revisionBadgeStyle with correct properties', () => {
      expect(revisionBadgeStyle.fontSize).toBe('var(--font-size-xs)');
      expect(revisionBadgeStyle.borderRadius).toBe('3px');
    });
  });
});
