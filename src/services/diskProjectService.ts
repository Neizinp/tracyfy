/**
 * Disk-based Project Service
 *
 * All data is stored on disk, nothing in localStorage.
 * Artifacts are GLOBAL, projects just reference them by ID.
 *
 * Directory structure:
 * /requirements/
 *   REQ-001.md
 *   REQ-002.md
 * /usecases/
 *   UC-001.md
 * /testcases/
 *   TC-001.md
 * /information/
 *   INFO-001.md
 * /projects/
 *   ProjectA.json        # {name, description, requirementIds: [...], ...}
 *   ProjectB.json
 * config.json            # {currentProjectId, counters: {req, uc, tc, info}}
 * links.json             # Global links
 */

import { fileSystemService } from './fileSystemService';
import type { Project, Requirement, UseCase, TestCase, Information, Link, User } from '../types';
import {
  requirementToMarkdown,
  markdownToRequirement,
  convertUseCaseToMarkdown,
  markdownToUseCase,
  testCaseToMarkdown,
  markdownToTestCase,
  informationToMarkdown,
  markdownToInformation,
  userToMarkdown,
  markdownToUser,
  projectToMarkdown,
  markdownToProject,
} from '../utils/markdownUtils';

const REQUIREMENTS_DIR = 'requirements';
const USECASES_DIR = 'usecases';
const TESTCASES_DIR = 'testcases';
const INFORMATION_DIR = 'information';
const PROJECTS_DIR = 'projects';
const USERS_DIR = 'users';
const COUNTERS_DIR = 'counters';
const CURRENT_PROJECT_FILE = 'current-project.md';
const CURRENT_USER_FILE = 'current-user.md';
const LINKS_FILE = 'links.json';

class DiskProjectService {
  /**
   * Initialize directory structure
   */
  async initialize(): Promise<void> {
    await fileSystemService.getOrCreateDirectory(REQUIREMENTS_DIR);
    await fileSystemService.getOrCreateDirectory(USECASES_DIR);
    await fileSystemService.getOrCreateDirectory(TESTCASES_DIR);
    await fileSystemService.getOrCreateDirectory(INFORMATION_DIR);
    await fileSystemService.getOrCreateDirectory(PROJECTS_DIR);
    await fileSystemService.getOrCreateDirectory(USERS_DIR);
    await fileSystemService.getOrCreateDirectory(COUNTERS_DIR);
  }

  // ============ COUNTER OPERATIONS ============

  /**
   * Get counter value from file
   * File format: just the number, e.g., "42"
   */
  private async getCounter(
    type: 'requirements' | 'useCases' | 'testCases' | 'information' | 'users'
  ): Promise<number> {
    const filename = `${COUNTERS_DIR}/${type}.md`;
    try {
      const content = await fileSystemService.readFile(filename);
      if (content) {
        return parseInt(content.trim(), 10) || 0;
      }
    } catch {
      // File doesn't exist
    }
    return 0;
  }

  /**
   * Set counter value
   */
  private async setCounter(
    type: 'requirements' | 'useCases' | 'testCases' | 'information' | 'users',
    value: number
  ): Promise<void> {
    const filename = `${COUNTERS_DIR}/${type}.md`;
    await fileSystemService.writeFile(filename, String(value));
  }

  /**
   * Get current project ID
   */
  async getCurrentProjectId(): Promise<string> {
    try {
      const content = await fileSystemService.readFile(CURRENT_PROJECT_FILE);
      if (content) {
        return content.trim();
      }
    } catch {
      // File doesn't exist
    }
    return '';
  }

  /**
   * Set current project ID
   */
  async setCurrentProjectId(projectId: string): Promise<void> {
    await fileSystemService.writeFile(CURRENT_PROJECT_FILE, projectId);
  }

  /**
   * Get current user ID
   */
  async getCurrentUserId(): Promise<string> {
    try {
      const content = await fileSystemService.readFile(CURRENT_USER_FILE);
      if (content) {
        return content.trim();
      }
    } catch {
      // File doesn't exist
    }
    return '';
  }

  /**
   * Set current user ID
   */
  async setCurrentUserId(userId: string): Promise<void> {
    await fileSystemService.writeFile(CURRENT_USER_FILE, userId);
  }

  /**
   * Get next artifact ID and increment counter
   */
  async getNextId(
    type: 'requirements' | 'useCases' | 'testCases' | 'information' | 'users'
  ): Promise<string> {
    const current = await this.getCounter(type);
    const next = current + 1;
    await this.setCounter(type, next);

    const prefixMap = {
      requirements: 'REQ',
      useCases: 'UC',
      testCases: 'TC',
      information: 'INFO',
      users: 'USER',
    };

    return `${prefixMap[type]}-${String(next).padStart(3, '0')}`;
  }

  // ============ PROJECT OPERATIONS ============

  /**
   * List all projects from disk
   */
  async listProjects(): Promise<Project[]> {
    const projects: Project[] = [];

    try {
      const files = await fileSystemService.listFiles(PROJECTS_DIR);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fileSystemService.readFile(`${PROJECTS_DIR}/${file}`);
          if (content) {
            const project = markdownToProject(content);
            if (project) {
              projects.push(project);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to list projects:', err);
    }

    return projects;
  }

  /**
   * Create a new project
   */
  async createProject(name: string, description: string): Promise<Project> {
    const id = `proj-${Date.now()}`;

    const project: Project = {
      id,
      name,
      description,
      requirementIds: [],
      useCaseIds: [],
      testCaseIds: [],
      informationIds: [],
      lastModified: Date.now(),
    };

    const markdown = projectToMarkdown(project);
    await fileSystemService.writeFile(`${PROJECTS_DIR}/${id}.md`, markdown);

    // Set as current project if none set
    const currentId = await this.getCurrentProjectId();
    if (!currentId) {
      await this.setCurrentProjectId(id);
    }

    return project;
  }

  /**
   * Update project metadata
   */
  async updateProject(project: Project): Promise<void> {
    const updatedProject: Project = {
      ...project,
      lastModified: Date.now(),
    };

    const markdown = projectToMarkdown(updatedProject);
    await fileSystemService.writeFile(`${PROJECTS_DIR}/${project.id}.md`, markdown);
  }

  /**
   * Delete a project (does not delete artifacts)
   */
  async deleteProject(projectId: string): Promise<void> {
    await fileSystemService.deleteFile(`${PROJECTS_DIR}/${projectId}.md`);
  }

  /**
   * Load a single project
   */
  async loadProject(projectId: string): Promise<Project | null> {
    try {
      const content = await fileSystemService.readFile(`${PROJECTS_DIR}/${projectId}.md`);
      if (content) {
        return markdownToProject(content);
      }
    } catch {
      // Project not found
    }
    return null;
  }

  // ============ GLOBAL ARTIFACT OPERATIONS ============

  /**
   * Save a requirement to disk (global)
   */
  async saveRequirement(requirement: Requirement): Promise<void> {
    const markdown = requirementToMarkdown(requirement);
    await fileSystemService.writeFile(`${REQUIREMENTS_DIR}/${requirement.id}.md`, markdown);
  }

  /**
   * Load all requirements (global)
   */
  async loadAllRequirements(): Promise<Requirement[]> {
    const requirements: Requirement[] = [];

    try {
      const files = await fileSystemService.listFiles(REQUIREMENTS_DIR);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fileSystemService.readFile(`${REQUIREMENTS_DIR}/${file}`);
          if (content) {
            const requirement = markdownToRequirement(content);
            if (requirement) {
              requirements.push(requirement);
            }
          }
        }
      }
    } catch {
      // Directory might not exist
    }

    return requirements;
  }

  /**
   * Delete a requirement from disk
   */
  async deleteRequirement(requirementId: string): Promise<void> {
    await fileSystemService.deleteFile(`${REQUIREMENTS_DIR}/${requirementId}.md`);
  }

  /**
   * Save a use case to disk (global)
   */
  async saveUseCase(useCase: UseCase): Promise<void> {
    const markdown = convertUseCaseToMarkdown(useCase);
    await fileSystemService.writeFile(`${USECASES_DIR}/${useCase.id}.md`, markdown);
  }

  /**
   * Load all use cases (global)
   */
  async loadAllUseCases(): Promise<UseCase[]> {
    const useCases: UseCase[] = [];

    try {
      const files = await fileSystemService.listFiles(USECASES_DIR);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fileSystemService.readFile(`${USECASES_DIR}/${file}`);
          if (content) {
            const useCase = markdownToUseCase(content);
            if (useCase) {
              useCases.push(useCase);
            }
          }
        }
      }
    } catch {
      // Directory might not exist
    }

    return useCases;
  }

  /**
   * Delete a use case from disk
   */
  async deleteUseCase(useCaseId: string): Promise<void> {
    await fileSystemService.deleteFile(`${USECASES_DIR}/${useCaseId}.md`);
  }

  /**
   * Save a test case to disk (global)
   */
  async saveTestCase(testCase: TestCase): Promise<void> {
    const markdown = testCaseToMarkdown(testCase);
    await fileSystemService.writeFile(`${TESTCASES_DIR}/${testCase.id}.md`, markdown);
  }

  /**
   * Load all test cases (global)
   */
  async loadAllTestCases(): Promise<TestCase[]> {
    const testCases: TestCase[] = [];

    try {
      const files = await fileSystemService.listFiles(TESTCASES_DIR);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fileSystemService.readFile(`${TESTCASES_DIR}/${file}`);
          if (content) {
            const testCase = markdownToTestCase(content);
            if (testCase) {
              testCases.push(testCase);
            }
          }
        }
      }
    } catch {
      // Directory might not exist
    }

    return testCases;
  }

  /**
   * Delete a test case from disk
   */
  async deleteTestCase(testCaseId: string): Promise<void> {
    await fileSystemService.deleteFile(`${TESTCASES_DIR}/${testCaseId}.md`);
  }

  /**
   * Save information to disk (global)
   */
  async saveInformation(info: Information): Promise<void> {
    const markdown = informationToMarkdown(info);
    await fileSystemService.writeFile(`${INFORMATION_DIR}/${info.id}.md`, markdown);
  }

  /**
   * Load all information (global)
   */
  async loadAllInformation(): Promise<Information[]> {
    const infoList: Information[] = [];

    try {
      const files = await fileSystemService.listFiles(INFORMATION_DIR);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fileSystemService.readFile(`${INFORMATION_DIR}/${file}`);
          if (content) {
            const info = markdownToInformation(content);
            if (info) {
              infoList.push(info);
            }
          }
        }
      }
    } catch {
      // Directory might not exist
    }

    return infoList;
  }

  /**
   * Delete information from disk
   */
  async deleteInformation(infoId: string): Promise<void> {
    await fileSystemService.deleteFile(`${INFORMATION_DIR}/${infoId}.md`);
  }

  // ============ LINKS ============

  /**
   * Load global links
   */
  async loadLinks(): Promise<Link[]> {
    try {
      const content = await fileSystemService.readFile(LINKS_FILE);
      if (content) {
        return JSON.parse(content);
      }
    } catch {
      // File doesn't exist
    }
    return [];
  }

  /**
   * Save global links
   */
  async saveLinks(links: Link[]): Promise<void> {
    await fileSystemService.writeFile(LINKS_FILE, JSON.stringify(links, null, 2));
  }

  // ============ USER OPERATIONS ============

  /**
   * Save a user to disk
   */
  async saveUser(user: User): Promise<void> {
    const markdown = userToMarkdown(user);
    await fileSystemService.writeFile(`${USERS_DIR}/${user.id}.md`, markdown);
  }

  /**
   * Load all users
   */
  async loadAllUsers(): Promise<User[]> {
    const users: User[] = [];

    try {
      const files = await fileSystemService.listFiles(USERS_DIR);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fileSystemService.readFile(`${USERS_DIR}/${file}`);
          if (content) {
            const user = markdownToUser(content);
            if (user) {
              users.push(user);
            }
          }
        }
      }
    } catch {
      // Directory might not exist
    }

    return users;
  }

  /**
   * Delete a user from disk
   */
  async deleteUser(userId: string): Promise<void> {
    await fileSystemService.deleteFile(`${USERS_DIR}/${userId}.md`);
  }

  // ============ BULK OPERATIONS ============

  /**
   * Load everything from disk
   */
  async loadAll(): Promise<{
    projects: Project[];
    currentProjectId: string;
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
    links: Link[];
  }> {
    const [projects, requirements, useCases, testCases, information, links, currentProjectId] =
      await Promise.all([
        this.listProjects(),
        this.loadAllRequirements(),
        this.loadAllUseCases(),
        this.loadAllTestCases(),
        this.loadAllInformation(),
        this.loadLinks(),
        this.getCurrentProjectId(),
      ]);

    return {
      projects,
      currentProjectId,
      requirements,
      useCases,
      testCases,
      information,
      links,
    };
  }

  /**
   * Recalculate counters from existing files
   * Call this after loading to ensure counters are in sync
   */
  async recalculateCounters(): Promise<void> {
    const [requirements, useCases, testCases, information] = await Promise.all([
      this.loadAllRequirements(),
      this.loadAllUseCases(),
      this.loadAllTestCases(),
      this.loadAllInformation(),
    ]);

    // Find max number for each type
    let maxReq = 0,
      maxUc = 0,
      maxTc = 0,
      maxInfo = 0;

    for (const req of requirements) {
      const match = req.id.match(/REQ-(\d+)/);
      if (match) maxReq = Math.max(maxReq, parseInt(match[1], 10));
    }

    for (const uc of useCases) {
      const match = uc.id.match(/UC-(\d+)/);
      if (match) maxUc = Math.max(maxUc, parseInt(match[1], 10));
    }

    for (const tc of testCases) {
      const match = tc.id.match(/TC-(\d+)/);
      if (match) maxTc = Math.max(maxTc, parseInt(match[1], 10));
    }

    for (const info of information) {
      const match = info.id.match(/INFO-(\d+)/);
      if (match) maxInfo = Math.max(maxInfo, parseInt(match[1], 10));
    }

    await Promise.all([
      this.setCounter('requirements', maxReq),
      this.setCounter('useCases', maxUc),
      this.setCounter('testCases', maxTc),
      this.setCounter('information', maxInfo),
    ]);
  }
}

export const diskProjectService = new DiskProjectService();
