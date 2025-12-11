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
 */

import { fileSystemService } from './fileSystemService';
import { realGitService } from './realGitService';
import type { Project, Requirement, UseCase, TestCase, Information, User } from '../types';
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

    // Auto-migrate legacy files
    await this.migrateLegacyProjectFiles();
  }

  /**
   * Migrate legacy project files (ID-based filenames) to Name-based filenames
   */
  async migrateLegacyProjectFiles(): Promise<void> {
    try {
      const files = await fileSystemService.listFiles(PROJECTS_DIR);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const content = await fileSystemService.readFile(`${PROJECTS_DIR}/${file}`);
        if (!content) continue;

        const project = markdownToProject(content);
        if (!project) continue;

        const expectedFilename = `${project.name}.md`;

        // If the current filename is NOT the expected filename
        // This handles cases where filename is the ID, or anything else mismatching
        if (file !== expectedFilename) {
          console.log(`Migrating project file: ${file} -> ${expectedFilename}`);

          // Check if target already differs to avoid overwrite if we have duplicates?
          // For now assume safe migration, or check existence
          if (await this.checkProjectNameExists(project.name, project.id)) {
            console.warn(
              `Cannot migrate ${file} to ${expectedFilename}: Target file already exists`
            );
            continue;
          }

          // Write new file
          await fileSystemService.writeFile(`${PROJECTS_DIR}/${expectedFilename}`, content);

          // Delete old file
          await fileSystemService.deleteFile(`${PROJECTS_DIR}/${file}`);
        }
      }
    } catch (err) {
      console.error('Failed to migrate project files:', err);
    }
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
   * Helper: Find project filename by ID
   */
  private async findProjectFilenameById(id: string): Promise<string | null> {
    try {
      const files = await fileSystemService.listFiles(PROJECTS_DIR);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fileSystemService.readFile(`${PROJECTS_DIR}/${file}`);
          if (content) {
            const project = markdownToProject(content);
            if (project && project.id === id) {
              return file;
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to search project files:', err);
    }
    return null;
  }

  /**
   * Helper: Check if project name exists
   */
  private async checkProjectNameExists(name: string, excludeId?: string): Promise<boolean> {
    try {
      const files = await fileSystemService.listFiles(PROJECTS_DIR);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fileSystemService.readFile(`${PROJECTS_DIR}/${file}`);
          if (content) {
            const project = markdownToProject(content);
            if (project && project.name === name) {
              if (excludeId && project.id === excludeId) {
                continue; // It's the same project
              }
              return true;
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to check project names:', err);
    }
    return false;
  }

  /**
   * Create a new project
   */
  async createProject(name: string, description: string): Promise<Project> {
    if (await this.checkProjectNameExists(name)) {
      throw new Error(`Project with name "${name}" already exists`);
    }

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
    await fileSystemService.writeFile(`${PROJECTS_DIR}/${name}.md`, markdown);

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
    if (await this.checkProjectNameExists(project.name, project.id)) {
      throw new Error(`Project with name "${project.name}" already exists`);
    }

    const oldFilename = await this.findProjectFilenameById(project.id);

    const updatedProject: Project = {
      ...project,
      lastModified: Date.now(),
    };

    const markdown = projectToMarkdown(updatedProject);
    const newFilename = `${project.name}.md`;
    const oldPath = oldFilename ? `${PROJECTS_DIR}/${oldFilename}` : null;
    const newPath = `${PROJECTS_DIR}/${newFilename}`;

    // If filename changed, use git rename to preserve history and auto-commit
    if (oldPath && oldFilename !== newFilename && realGitService.isInitialized()) {
      await realGitService.renameFile(oldPath, newPath, markdown);
    } else {
      // Just write the file (no rename needed)
      await fileSystemService.writeFile(newPath, markdown);

      // If filename changed but git not initialized, delete old file manually
      if (oldFilename && oldFilename !== newFilename) {
        await fileSystemService.deleteFile(`${PROJECTS_DIR}/${oldFilename}`);
      }
    }
  }

  /**
   * Delete a project (does not delete artifacts)
   */
  async deleteProject(projectId: string): Promise<void> {
    const filename = await this.findProjectFilenameById(projectId);
    if (filename) {
      await fileSystemService.deleteFile(`${PROJECTS_DIR}/${filename}`);
    } else {
      console.warn(`Could not find file for project ${projectId} to delete`);
    }
  }

  /**
   * Copy a project with a new name and description
   * Artifacts are global, so the copy just references the same artifact IDs
   */
  async copyProject(
    originalProject: Project,
    newName: string,
    newDescription: string
  ): Promise<Project> {
    // Check if name already exists
    const nameExists = await this.checkProjectNameExists(newName);
    if (nameExists) {
      throw new Error(`A project named "${newName}" already exists`);
    }

    // Create new project ID
    const newId = `proj-${Date.now()}`;

    const newProject: Project = {
      id: newId,
      name: newName,
      description: newDescription,
      lastModified: Date.now(),
      // Copy artifact references
      requirementIds: [...originalProject.requirementIds],
      useCaseIds: [...originalProject.useCaseIds],
      testCaseIds: [...originalProject.testCaseIds],
      informationIds: [...originalProject.informationIds],
    };

    // Save to disk
    const content = projectToMarkdown(newProject);
    const safeName = newName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}.md`;
    await fileSystemService.writeFile(`${PROJECTS_DIR}/${filename}`, content);

    return newProject;
  }

  /**
   * Load a single project
   */
  async loadProject(projectId: string): Promise<Project | null> {
    try {
      const filename = await this.findProjectFilenameById(projectId);
      if (!filename) return null;

      const content = await fileSystemService.readFile(`${PROJECTS_DIR}/${filename}`);
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
  }> {
    const [projects, requirements, useCases, testCases, information, currentProjectId] =
      await Promise.all([
        this.listProjects(),
        this.loadAllRequirements(),
        this.loadAllUseCases(),
        this.loadAllTestCases(),
        this.loadAllInformation(),
        this.getCurrentProjectId(),
      ]);

    return {
      projects,
      currentProjectId,
      requirements,
      useCases,
      testCases,
      information,
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
