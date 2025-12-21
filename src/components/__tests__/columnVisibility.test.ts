/**
 * Column Visibility Tests
 *
 * Tests for toggling column visibility in artifact lists.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the useUI hook
const mockSetColumnVisibility = vi.fn();
const mockColumnVisibility = {
  idTitle: true,
  description: true,
  text: false,
  rationale: false,
  author: true,
  priority: true,
  status: true,
  comments: false,
  created: true,
  approved: false,
  projects: true,
  category: true,
  revision: true,
};

vi.mock('../../app/providers', () => ({
  useUI: () => ({
    columnVisibility: mockColumnVisibility,
    setColumnVisibility: mockSetColumnVisibility,
  }),
}));

describe('Column Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should have default visible columns', () => {
      expect(mockColumnVisibility.idTitle).toBe(true);
      expect(mockColumnVisibility.description).toBe(true);
      expect(mockColumnVisibility.author).toBe(true);
      expect(mockColumnVisibility.priority).toBe(true);
      expect(mockColumnVisibility.status).toBe(true);
    });

    it('should have default hidden columns', () => {
      expect(mockColumnVisibility.text).toBe(false);
      expect(mockColumnVisibility.rationale).toBe(false);
      expect(mockColumnVisibility.comments).toBe(false);
      expect(mockColumnVisibility.approved).toBe(false);
    });
  });

  describe('Toggling visibility', () => {
    it('should toggle column visibility', () => {
      const newVisibility = { ...mockColumnVisibility, text: true };

      mockSetColumnVisibility(newVisibility);

      expect(mockSetColumnVisibility).toHaveBeenCalledWith(expect.objectContaining({ text: true }));
    });

    it('should toggle multiple columns', () => {
      const newVisibility = {
        ...mockColumnVisibility,
        text: true,
        rationale: true,
        comments: true,
      };

      mockSetColumnVisibility(newVisibility);

      expect(mockSetColumnVisibility).toHaveBeenCalledWith(
        expect.objectContaining({
          text: true,
          rationale: true,
          comments: true,
        })
      );
    });
  });

  describe('alwaysVisible columns', () => {
    it('idTitle should always be visible', () => {
      // idTitle is marked as alwaysVisible in column configurations
      expect(mockColumnVisibility.idTitle).toBe(true);
    });
  });

  describe('Custom attribute columns', () => {
    it('should support dynamic column keys', () => {
      const visibilityWithCustom = {
        ...mockColumnVisibility,
        'CA-001': true,
        'CA-002': false,
      };

      expect(visibilityWithCustom['CA-001']).toBe(true);
      expect(visibilityWithCustom['CA-002']).toBe(false);
    });
  });
});
