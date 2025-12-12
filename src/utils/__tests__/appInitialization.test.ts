import { describe, it, expect } from 'vitest';
import { loadProjects, PROJECTS_KEY, CURRENT_PROJECT_KEY } from '../appInitialization';

describe('appInitialization', () => {
  describe('exports', () => {
    it('should export PROJECTS_KEY constant', () => {
      expect(PROJECTS_KEY).toBe('reqify-projects');
    });

    it('should export CURRENT_PROJECT_KEY constant', () => {
      expect(CURRENT_PROJECT_KEY).toBe('reqify-current-project-id');
    });

    it('should export loadProjects function', () => {
      expect(typeof loadProjects).toBe('function');
    });
  });

  describe('loadProjects', () => {
    it('should return object with expected shape', () => {
      const result = loadProjects();

      // Should always return an object with these properties
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('currentProjectId');
      expect(result).toHaveProperty('globalState');
      expect(Array.isArray(result.projects)).toBe(true);
      expect(typeof result.currentProjectId).toBe('string');
      expect(result.globalState).toHaveProperty('requirements');
      expect(result.globalState).toHaveProperty('useCases');
      expect(result.globalState).toHaveProperty('testCases');
      expect(result.globalState).toHaveProperty('information');
    });

    it('should return arrays for each globalState category', () => {
      const result = loadProjects();

      expect(Array.isArray(result.globalState.requirements)).toBe(true);
      expect(Array.isArray(result.globalState.useCases)).toBe(true);
      expect(Array.isArray(result.globalState.testCases)).toBe(true);
      expect(Array.isArray(result.globalState.information)).toBe(true);
    });
  });
});
