/**
 * Utility functions for application initialization and state loading.
 * Handles loading projects, global state, and initializing used ID numbers.
 */

import type { Project, GlobalState, Requirement, UseCase } from '../types';
import {
  mockRequirements,
  mockUseCases,
  mockTestCases,
  mockInformation,
  mockLinks,
} from '../mockData';

export const PROJECTS_KEY = 'reqtrace-projects';
export const CURRENT_PROJECT_KEY = 'reqtrace-current-project-id';
export const USED_NUMBERS_KEY = 'reqtrace-used-numbers';
export const GLOBAL_STATE_KEY = 'reqtrace-global-state';

/**
 * Helper to load used numbers from LocalStorage
 */
export const loadUsedNumbers = () => {
  try {
    const saved = localStorage.getItem(USED_NUMBERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        usedReqNumbers: new Set<number>(parsed.usedReqNumbers || []),
        usedUcNumbers: new Set<number>(parsed.usedUcNumbers || []),
      };
    }
  } catch (error) {
    console.error('Failed to load used numbers:', error);
  }
  return {
    usedReqNumbers: new Set<number>(),
    usedUcNumbers: new Set<number>(),
  };
};

/**
 * Initialize used numbers from existing requirements/use cases
 */
export const initializeUsedNumbers = (requirements: Requirement[], useCases: UseCase[]) => {
  const savedNumbers = loadUsedNumbers();

  // Extract numbers from existing IDs and merge with saved used numbers
  requirements.forEach((req) => {
    const match = req.id.match(/REQ-(\d+)/);
    if (match) {
      savedNumbers.usedReqNumbers.add(parseInt(match[1], 10));
    }
  });

  useCases.forEach((uc) => {
    const match = uc.id.match(/UC-(\d+)/);
    if (match) {
      savedNumbers.usedUcNumbers.add(parseInt(match[1], 10));
    }
  });

  return savedNumbers;
};

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
        links: [],
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
        links: [],
      },
    };
  }
};
