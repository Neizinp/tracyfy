/**
 * Utility functions for application initialization and state loading.
 * Handles loading projects and global state.
 */

import type { Project, GlobalState } from '../types';

export const PROJECTS_KEY = 'tracyfy-projects';
export const CURRENT_PROJECT_KEY = 'tracyfy-current-project-id';
const GLOBAL_STATE_KEY = 'tracyfy-global-state';

/**
 * Helper to load projects from localStorage (browser fallback)
 */
export const loadProjects = (): {
  projects: Project[];
  currentProjectId: string;
  globalState: GlobalState;
} => {
  try {
    const savedProjects = localStorage.getItem(PROJECTS_KEY);
    const savedGlobal = localStorage.getItem(GLOBAL_STATE_KEY);
    const savedCurrentId = localStorage.getItem(CURRENT_PROJECT_KEY);

    if (savedGlobal && savedProjects) {
      const parsedGlobal = JSON.parse(savedGlobal);
      const parsedProjects = JSON.parse(savedProjects);
      if (parsedGlobal && Array.isArray(parsedProjects)) {
        return {
          projects: parsedProjects,
          currentProjectId: savedCurrentId || parsedProjects[0]?.id || 'default-project',
          globalState: parsedGlobal,
        };
      }
    }

    // Fallback: return empty state
    return {
      projects: [],
      currentProjectId: '',
      globalState: {
        requirements: [],
        useCases: [],
        testCases: [],
        information: [],
        risks: [],
        documents: [],
      },
    };
  } catch (error) {
    console.error('Failed to load projects:', error);
    return {
      projects: [],
      currentProjectId: '',
      globalState: {
        requirements: [],
        useCases: [],
        testCases: [],
        information: [],
        risks: [],
        documents: [],
      },
    };
  }
};
