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
 *   ProjectA.md        # YAML frontmatter + markdown
 *   ProjectB.md
 * /users/
 *   USER-001.md
 * /counters/
 *   requirements.md    # just the number
 *   usecases.md
 *   ...
 * current-project.md   # current project ID
 * current-user.md      # current user ID
 */

import { fileSystemService } from './fileSystemService';
import { realGitService } from './realGitService';
import { debug } from '../utils/debug';
import type { Project, Requirement, UseCase, TestCase, Information, User, Risk } from '../types';
import {
  requirementService,
  useCaseService,
  testCaseService,
  informationService,
  riskService,
  projectService,
  userService,
} from './artifactServices';

const CURRENT_PROJECT_FILE = 'current-project.md';
const CURRENT_USER_FILE = 'current-user.md';

class DiskProjectService {
  /**
   * Initialize directory structure
   */
  async initialize(): Promise<void> {
    // Services handle directory creation on save, but we can ensure they exist
    await fileSystemService.getOrCreateDirectory('requirements');
    await fileSystemService.getOrCreateDirectory('usecases');
    await fileSystemService.getOrCreateDirectory('testcases');
    await fileSystemService.getOrCreateDirectory('information');
    await fileSystemService.getOrCreateDirectory('risks');
    await fileSystemService.getOrCreateDirectory('links');
    await fileSystemService.getOrCreateDirectory('projects');
    await fileSystemService.getOrCreateDirectory('users');
    await fileSystemService.getOrCreateDirectory('counters');
  }

  // ============ COUNTER OPERATIONS ============

  // Map API type names to lowercase filenames for consistency
  private counterFilenameMap: Record<string, string> = {
    requirements: 'requirements',
    useCases: 'usecases',
    testCases: 'testcases',
    information: 'information',
    users: 'users',
    risks: 'risks',
    links: 'links',
    customAttributes: 'custom-attributes',
    workflows: 'workflows',
  };

  /**
   * Get counter value from file
   * File format: just the number, e.g., "42"
   */
  private async getCounter(
    type:
      | 'requirements'
      | 'useCases'
      | 'testCases'
      | 'information'
      | 'users'
      | 'risks'
      | 'links'
      | 'customAttributes'
      | 'workflows'
  ): Promise<number> {
    const filenameBase = this.counterFilenameMap[type] || type.toLowerCase();
    const filename = `counters/${filenameBase}.md`;
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
   * @param skipCommit - If true, skip auto-commit (used by recalculateCounters on app load)
   */
  private async setCounter(
    type:
      | 'requirements'
      | 'useCases'
      | 'testCases'
      | 'information'
      | 'users'
      | 'risks'
      | 'links'
      | 'customAttributes'
      | 'workflows',
    value: number,
    skipCommit: boolean = false
  ): Promise<void> {
    const filenameBase = this.counterFilenameMap[type] || type.toLowerCase();
    const filename = `counters/${filenameBase}.md`;
    await fileSystemService.writeFile(filename, String(value));

    // Auto-commit the counter update (unless skipped, e.g., during recalculation)
    if (!skipCommit) {
      realGitService.commitFile(filename, `Update ${type} counter`).catch(() => {
        // Silently ignore commit errors - counter is still updated locally
      });
    }
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
    type:
      | 'requirements'
      | 'useCases'
      | 'testCases'
      | 'information'
      | 'users'
      | 'risks'
      | 'links'
      | 'customAttributes'
      | 'workflows'
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
      risks: 'RISK',
      links: 'LINK',
      customAttributes: 'ATTR',
      workflows: 'WF',
    };

    return `${prefixMap[type]}-${String(next).padStart(3, '0')}`;
  }

  /**
   * Get multiple artifact IDs at once (batch allocation)
   * More efficient than calling getNextId repeatedly
   */
  async getNextIds(
    type: 'requirements' | 'useCases' | 'testCases' | 'information' | 'users' | 'risks',
    count: number
  ): Promise<string[]> {
    if (count <= 0) return [];

    const current = await this.getCounter(type);
    const nextEnd = current + count;
    await this.setCounter(type, nextEnd);

    const prefixMap = {
      requirements: 'REQ',
      useCases: 'UC',
      testCases: 'TC',
      information: 'INFO',
      users: 'USER',
      risks: 'RISK',
    };

    const ids: string[] = [];
    for (let i = current + 1; i <= nextEnd; i++) {
      ids.push(`${prefixMap[type]}-${String(i).padStart(3, '0')}`);
    }

    return ids;
  }

  /**
   * Get next artifact ID with remote sync (for collaboration)
   */
  async getNextIdWithSync(
    type:
      | 'requirements'
      | 'useCases'
      | 'testCases'
      | 'information'
      | 'users'
      | 'risks'
      | 'links'
      | 'customAttributes'
      | 'workflows'
  ): Promise<string> {
    try {
      // Pull latest counters from remote (silently fails if no remote)
      await realGitService.pullCounters();
    } catch (err) {
      console.warn('[getNextIdWithSync] Failed to pull counters:', err);
    }

    // Get next ID locally
    const id = await this.getNextId(type);

    try {
      // Push counter update to remote (background, don't block)
      realGitService.pushCounters().catch((err) => {
        console.warn('[getNextIdWithSync] Failed to push counters:', err);
      });
    } catch (err) {
      console.warn('[getNextIdWithSync] Failed to initiate push:', err);
    }

    return id;
  }

  // ============ PROJECT OPERATIONS ============

  /**
   * Load a single project
   */
  async loadProject(projectId: string): Promise<Project | null> {
    return projectService.load(projectId);
  }

  /**
   * Helper: Check if project name exists
   */
  private async checkProjectNameExists(name: string, excludeId?: string): Promise<boolean> {
    const allProjects = await projectService.loadAll();
    return allProjects.some(
      (p) => p.name.toLowerCase() === name.toLowerCase() && p.id !== excludeId
    );
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
      riskIds: [],
      lastModified: Date.now(),
    };

    await projectService.save(project);

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

    const updatedProject: Project = {
      ...project,
      lastModified: Date.now(),
    };

    await projectService.save(updatedProject);
  }

  /**
   * Soft-delete a project (sets isDeleted flag, does not remove file)
   */
  async deleteProject(projectId: string): Promise<void> {
    const project = await this.loadProject(projectId);
    if (project) {
      project.isDeleted = true;
      project.lastModified = Date.now();
      await this.updateProject(project);
    } else {
      console.warn(`Could not find project ${projectId} to delete`);
    }
  }

  /**
   * Restore a soft-deleted project
   */
  async restoreProject(projectId: string): Promise<void> {
    const project = await this.loadProject(projectId);
    if (project) {
      project.isDeleted = false;
      project.lastModified = Date.now();
      await this.updateProject(project);
    } else {
      console.warn(`Could not find project ${projectId} to restore`);
    }
  }

  /**
   * Permanently delete a project (removes file, auto-commits)
   */
  async permanentDeleteProject(projectId: string): Promise<void> {
    await projectService.delete(projectId, `Project deleted: ${projectId}`);
  }

  /**
   * Copy a project with a new name and description
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

    const newId = `proj-${Date.now()}`;

    const newProject: Project = {
      id: newId,
      name: newName,
      description: newDescription,
      lastModified: Date.now(),
      requirementIds: [...originalProject.requirementIds],
      useCaseIds: [...originalProject.useCaseIds],
      testCaseIds: [...originalProject.testCaseIds],
      informationIds: [...originalProject.informationIds],
      riskIds: [...(originalProject.riskIds || [])],
    };

    await projectService.save(newProject);
    return newProject;
  }

  /**
   * Load all projects (global)
   */
  async loadAllProjects(): Promise<Project[]> {
    return projectService.loadAll();
  }

  // ============ GLOBAL ARTIFACT OPERATIONS ============

  /**
   * Save a requirement to disk (global)
   */
  async saveRequirement(requirement: Requirement): Promise<void> {
    await requirementService.save(requirement);
  }

  /**
   * Load all requirements (global)
   */
  async loadAllRequirements(): Promise<Requirement[]> {
    return requirementService.loadAll();
  }

  /**
   * Delete a requirement from disk
   */
  async deleteRequirement(requirementId: string): Promise<void> {
    await requirementService.delete(requirementId);
  }

  /**
   * Save a use case to disk (global)
   */
  async saveUseCase(useCase: UseCase): Promise<void> {
    await useCaseService.save(useCase);
  }

  /**
   * Load all use cases (global)
   */
  async loadAllUseCases(): Promise<UseCase[]> {
    return useCaseService.loadAll();
  }

  /**
   * Delete a use case from disk
   */
  async deleteUseCase(useCaseId: string): Promise<void> {
    await useCaseService.delete(useCaseId);
  }

  /**
   * Save a test case to disk (global)
   */
  async saveTestCase(testCase: TestCase): Promise<void> {
    await testCaseService.save(testCase);
  }

  /**
   * Load all test cases (global)
   */
  async loadAllTestCases(): Promise<TestCase[]> {
    return testCaseService.loadAll();
  }

  /**
   * Delete a test case from disk
   */
  async deleteTestCase(testCaseId: string): Promise<void> {
    await testCaseService.delete(testCaseId);
  }

  /**
   * Save information to disk (global)
   */
  async saveInformation(info: Information): Promise<void> {
    await informationService.save(info);
  }

  /**
   * Load all information (global)
   */
  async loadAllInformation(): Promise<Information[]> {
    return informationService.loadAll();
  }

  /**
   * Delete information from disk
   */
  async deleteInformation(infoId: string): Promise<void> {
    await informationService.delete(infoId);
  }

  // ============ RISK OPERATIONS ============

  /**
   * Save a risk to disk (global)
   */
  async saveRisk(risk: Risk): Promise<void> {
    await riskService.save(risk);
  }

  /**
   * Load all risks (global)
   */
  async loadAllRisks(): Promise<Risk[]> {
    return riskService.loadAll();
  }

  /**
   * Delete a risk from disk
   */
  async deleteRisk(riskId: string): Promise<void> {
    await riskService.delete(riskId);
  }

  // ============ USER OPERATIONS ============

  /**
   * Save a user to disk
   */
  async saveUser(user: User): Promise<void> {
    await userService.save(user);
  }

  /**
   * Load all users
   */
  async loadAllUsers(): Promise<User[]> {
    return userService.loadAll();
  }

  /**
   * Delete a user from disk
   */
  async deleteUser(userId: string): Promise<void> {
    await userService.delete(userId);
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
    risks: Risk[];
  }> {
    const [projects, requirements, useCases, testCases, information, risks, currentProjectId] =
      await Promise.all([
        this.loadAllProjects(),
        this.loadAllRequirements(),
        this.loadAllUseCases(),
        this.loadAllTestCases(),
        this.loadAllInformation(),
        this.loadAllRisks(),
        this.getCurrentProjectId(),
      ]);

    return {
      projects,
      currentProjectId,
      requirements,
      useCases,
      testCases,
      information,
      risks,
    };
  }

  /**
   * Recalculate counters from existing files
   * Call this after loading to ensure counters are in sync
   */
  async recalculateCounters(): Promise<void> {
    const [requirements, useCases, testCases, information, risks] = await Promise.all([
      this.loadAllRequirements(),
      this.loadAllUseCases(),
      this.loadAllTestCases(),
      this.loadAllInformation(),
      this.loadAllRisks(),
    ]);

    // Find max number for each type
    let maxReq = 0,
      maxUc = 0,
      maxTc = 0,
      maxInfo = 0,
      maxRisk = 0;

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

    for (const risk of risks) {
      const match = risk.id.match(/RISK-(\d+)/);
      if (match) maxRisk = Math.max(maxRisk, parseInt(match[1], 10));
    }

    // Skip commits here - this is just syncing local counters from existing files
    await Promise.all([
      this.setCounter('requirements', maxReq, true),
      this.setCounter('useCases', maxUc, true),
      this.setCounter('testCases', maxTc, true),
      this.setCounter('information', maxInfo, true),
      this.setCounter('risks', maxRisk, true),
    ]);
  }

  /**
   * Migrate legacy project files (Name-based) to ID-based filenames.
   * This is part of the refactoring to ensure all artifacts use ID as filename.
   */
  async migrateLegacyProjectFiles(): Promise<void> {
    try {
      const files = await fileSystemService.listFiles('projects');
      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        // If the filename starts with 'proj-', it's already using ID
        if (file.startsWith('proj-')) continue;

        const content = await fileSystemService.readFile(`projects/${file}`);
        if (content) {
          const project = projectService.deserialize(content);
          if (project && project.id) {
            const newPath = `projects/${project.id}.md`;
            const oldPath = `projects/${file}`;

            if (newPath !== oldPath) {
              await fileSystemService.writeFile(newPath, content);
              await fileSystemService.deleteFile(oldPath);
              debug.log(`[Migration] Migrated project ${file} to ${project.id}.md`);
            }
          }
        }
      }
    } catch (err) {
      debug.log('[Migration] Failed to migrate project files:', err);
    }
  }
}

export const diskProjectService = new DiskProjectService();
