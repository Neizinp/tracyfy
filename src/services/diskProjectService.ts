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
 * .git/tracyfy-current-project  # selected project ID (local, not versioned)
 * .git/tracyfy-current-user     # selected user ID (local, not versioned)
 */

import { BaseDiskService } from './baseDiskService';
import { debug } from '../utils/debug';
import { idService } from './idService';
import { ARTIFACT_CONFIG } from '../constants/artifactConfig';
import type {
  Link,
  Project,
  Requirement,
  UseCase,
  TestCase,
  Information,
  Risk,
  ArtifactDocument,
} from '../types';
import {
  ALL_ARTIFACT_SERVICES,
  requirementService,
  useCaseService,
  testCaseService,
  informationService,
  riskService,
  projectService,
  documentService,
} from './artifactServices';
import { diskLinkService } from './diskLinkService';

// Which project/user is selected is local to this clone (each collaborator has
// their own), so it lives inside .git and is never committed or pushed.
const CURRENT_PROJECT_FILE = '.git/tracyfy-current-project';
const CURRENT_USER_FILE = '.git/tracyfy-current-user';
// Older versions stored these in the shared project folder
const LEGACY_CURRENT_PROJECT_FILE = 'current-project.md';
const LEGACY_CURRENT_USER_FILE = 'current-user.md';

class DiskProjectService extends BaseDiskService {
  /**
   * Initialize directory structure
   */
  async initialize(): Promise<void> {
    // Services handle directory creation on save, but we can ensure they exist
    for (const config of Object.values(ARTIFACT_CONFIG)) {
      await this.ensureDirectory(config.folder);
    }
    await this.ensureDirectory('counters');
  }

  // ============ COUNTER OPERATIONS (Delegated to IdService) ============

  /**
   * Get current project ID
   */
  async getCurrentProjectId(): Promise<string> {
    return (
      (await this.readTextFile(CURRENT_PROJECT_FILE)) ||
      this.readTextFile(LEGACY_CURRENT_PROJECT_FILE)
    );
  }

  /**
   * Set current project ID
   */
  async setCurrentProjectId(projectId: string): Promise<void> {
    await this.writeTextFile(CURRENT_PROJECT_FILE, projectId);
  }

  /**
   * Get current user ID
   */
  async getCurrentUserId(): Promise<string> {
    return (
      (await this.readTextFile(CURRENT_USER_FILE)) || this.readTextFile(LEGACY_CURRENT_USER_FILE)
    );
  }

  /**
   * Set current user ID
   */
  async setCurrentUserId(userId: string): Promise<void> {
    await this.writeTextFile(CURRENT_USER_FILE, userId);
  }

  /**
   * Get next artifact ID and increment counter
   */
  async getNextId(type: string): Promise<string> {
    // Standardize key name if legacy camelCase is used
    const standardizedType =
      type === 'useCases' ? 'usecases' : type === 'testCases' ? 'testcases' : type;
    return idService.getNextId(standardizedType);
  }

  /**
   * Get multiple artifact IDs at once (batch allocation)
   */
  async getNextIds(type: string, count: number): Promise<string[]> {
    const standardizedType =
      type === 'useCases' ? 'usecases' : type === 'testCases' ? 'testcases' : type;
    return idService.getNextIds(standardizedType, count);
  }

  /**
   * Get next artifact ID with remote sync (for collaboration)
   */
  async getNextIdWithSync(type: string): Promise<string> {
    const standardizedType =
      type === 'useCases' ? 'usecases' : type === 'testCases' ? 'testcases' : type;
    return idService.getNextIdWithSync(standardizedType);
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
      debug.warn(`Could not find project ${projectId} to delete`);
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
      debug.warn(`Could not find project ${projectId} to restore`);
    }
  }

  /**
   * Permanently delete a project (removes file, auto-commits)
   */
  async permanentDeleteProject(projectId: string): Promise<void> {
    await projectService.delete(projectId, `Project deleted: ${projectId}`);
  }

  /**
   * Load all projects (global)
   */
  async loadAllProjects(): Promise<Project[]> {
    return projectService.loadAll();
  }

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
    documents: ArtifactDocument[];
    links: Link[];
    users: import('../types').User[];
    currentUserId: string;
  }> {
    const [
      projects,
      requirements,
      useCases,
      testCases,
      information,
      risks,
      documents,
      links,
      users,
      currentProjectId,
      currentUserId,
    ] = await Promise.all([
      this.loadAllProjects(),
      requirementService.loadAll(),
      useCaseService.loadAll(),
      testCaseService.loadAll(),
      informationService.loadAll(),
      riskService.loadAll(),
      documentService.loadAll(),
      diskLinkService.getAllLinks(),
      (await import('./artifactServices')).userService.loadAll(),
      this.getCurrentProjectId(),
      this.getCurrentUserId(),
    ]);

    return {
      projects,
      currentProjectId,
      requirements,
      useCases,
      testCases,
      information,
      risks,
      documents,
      links,
      users,
      currentUserId,
    };
  }

  /**
   * Recalculate counters from existing files
   * Call this after loading to ensure counters are in sync
   */
  async recalculateCounters(): Promise<void> {
    // Only ever RAISE counters to cover existing IDs. Lowering them (e.g. after a
    // permanent delete, or when a collaborator's counter is ahead) would hand out
    // IDs again. Sequential so the resulting commits don't run concurrently.
    for (const [key, service] of Object.entries(ALL_ARTIFACT_SERVICES)) {
      const config = ARTIFACT_CONFIG[key];
      if (!config || !config.idPrefix) continue;

      const items = await service.loadAll(true);
      const idRegex = new RegExp(`^${config.idPrefix}-(\\d+)$`);
      let maxId = 0;
      for (const item of items) {
        const match = item.id.match(idRegex);
        if (match) maxId = Math.max(maxId, parseInt(match[1], 10));
      }

      // Writes (and commits) only when the counter actually has to move
      await idService.ensureCounterAtLeast(key, maxId);
    }
  }

  /**
   * Migrate legacy project files (Name-based) to ID-based filenames.
   * This is part of the refactoring to ensure all artifacts use ID as filename.
   */
  async migrateLegacyProjectFiles(): Promise<void> {
    try {
      const files = await this.listFiles('projects');
      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        // If the filename starts with 'proj-', it's already using ID
        if (file.startsWith('proj-')) continue;

        const content = await this.readTextFile(`projects/${file}`);
        if (content) {
          const project = projectService.deserialize(content);
          if (project && project.id) {
            const newPath = `projects/${project.id}.md`;
            const oldPath = `projects/${file}`;

            if (newPath !== oldPath) {
              await this.writeTextFile(newPath, content);
              await this.deleteFile(oldPath);
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
