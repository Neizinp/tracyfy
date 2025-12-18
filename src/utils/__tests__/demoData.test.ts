/**
 * Tests for demo data constants and naming
 */

import { describe, it, expect } from 'vitest';
import { DEMO_PROJECT, DEMO_ARTIFACTS } from '../demoData';

describe('Demo Data', () => {
  describe('DEMO_PROJECT', () => {
    it('should have the correct name without timestamp suffix', () => {
      expect(DEMO_PROJECT.name).toBe('Tracyfy Management System');
    });

    it('should have a description', () => {
      expect(DEMO_PROJECT.description).toBeTruthy();
      expect(typeof DEMO_PROJECT.description).toBe('string');
    });
  });

  describe('DEMO_ARTIFACTS', () => {
    it('should have requirements', () => {
      expect(DEMO_ARTIFACTS.requirements).toBeDefined();
      expect(Array.isArray(DEMO_ARTIFACTS.requirements)).toBe(true);
      expect(DEMO_ARTIFACTS.requirements.length).toBeGreaterThan(0);
    });

    it('should have use cases', () => {
      expect(DEMO_ARTIFACTS.useCases).toBeDefined();
      expect(Array.isArray(DEMO_ARTIFACTS.useCases)).toBe(true);
      expect(DEMO_ARTIFACTS.useCases.length).toBeGreaterThan(0);
    });

    it('should have test cases', () => {
      expect(DEMO_ARTIFACTS.testCases).toBeDefined();
      expect(Array.isArray(DEMO_ARTIFACTS.testCases)).toBe(true);
      expect(DEMO_ARTIFACTS.testCases.length).toBeGreaterThan(0);
    });

    it('should have information items', () => {
      expect(DEMO_ARTIFACTS.information).toBeDefined();
      expect(Array.isArray(DEMO_ARTIFACTS.information)).toBe(true);
      expect(DEMO_ARTIFACTS.information.length).toBeGreaterThan(0);
    });

    it('should have links between artifacts', () => {
      expect(DEMO_ARTIFACTS.links).toBeDefined();
      expect(Array.isArray(DEMO_ARTIFACTS.links)).toBe(true);
      expect(DEMO_ARTIFACTS.links.length).toBeGreaterThan(0);
    });

    it('requirements should have required properties', () => {
      const req = DEMO_ARTIFACTS.requirements[0];
      expect(req).toHaveProperty('title');
      expect(req).toHaveProperty('description');
      expect(req).toHaveProperty('dateCreated');
    });

    it('links should have valid structure', () => {
      const link = DEMO_ARTIFACTS.links[0];
      expect(link).toHaveProperty('sourceType');
      expect(link).toHaveProperty('sourceIndex');
      expect(link).toHaveProperty('targetType');
      expect(link).toHaveProperty('targetIndex');
      expect(link).toHaveProperty('type');
      expect(link).toHaveProperty('scope');
    });
  });
});
