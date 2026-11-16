/**
 * Disk-based Project Service
 *
 * One folder (git repository) is one project. Everything in it belongs to it.
 *
 * Directory structure:
 * /project.md          # project name and description
 * /requirements/REQ-001.md
 * /usecases/UC-001.md
 * /testcases/TC-001.md
 * /information/INFO-001.md
 * /users/USER-001.md
 * /counters/requirements.md    # just the number
 * .git/tracyfy-current-user    # selected user ID (local, not versioned)
 */

import { BaseDiskService } from './baseDiskService';
import { idService } from './idService';
import { STORED_TYPES, STORED_TYPE_IDS, type StoredType } from './storedTypes';
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
  documentService,
} from './artifactServices';
import { diskLinkService } from './diskLinkService';
import { fileSystemService } from './fileSystemService';
import { projectToMarkdown, markdownToProject } from '../utils/markdownUtils';
import { PROJECT_FILE } from '../utils/pendingChanges';

// Which user is selected is local to this clone (each collaborator has their
// own), so it lives inside .git and is never committed or pushed.
const CURRENT_USER_FILE = '.git/tracyfy-current-user';

class DiskProjectService extends BaseDiskService {
  /**
   * Initialize directory structure
   */
  async initialize(): Promise<void> {
    // Services handle directory creation on save, but we can ensure they exist
    for (const config of Object.values(STORED_TYPES)) {
      await this.ensureDirectory(config.folder);
    }
    await this.ensureDirectory('counters');
  }

  // ============ COUNTER OPERATIONS (Delegated to IdService) ============

  /**
   * Get current user ID
   */
  async getCurrentUserId(): Promise<string> {
    return this.readTextFile(CURRENT_USER_FILE);
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
  async getNextId(type: StoredType): Promise<string> {
    return idService.getNextId(type);
  }

  /**
   * Get multiple artifact IDs at once (batch allocation)
   */
  async getNextIds(type: StoredType, count: number): Promise<string[]> {
    return idService.getNextIds(type, count);
  }

  /**
   * Get next artifact ID with remote sync (for collaboration)
   */
  async getNextIdWithSync(type: StoredType): Promise<string> {
    return idService.getNextIdWithSync(type);
  }

  // ============ PROJECT ============

  /**
   * The project in this folder. Without a project.md the folder name is used.
   */
  async loadProject(): Promise<Project> {
    const content = await this.readTextFile(PROJECT_FILE);
    return (
      (content && markdownToProject(content)) || {
        name: fileSystemService.getDirectoryName() || 'Untitled project',
        description: '',
      }
    );
  }

  /**
   * Save the project's name and description (shows up in Pending Changes)
   */
  async saveProject(project: Project): Promise<void> {
    await this.writeTextFile(PROJECT_FILE, projectToMarkdown(project));
  }

  /**
   * Load everything from disk
   */
  async loadAll(): Promise<{
    project: Project;
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
      project,
      requirements,
      useCases,
      testCases,
      information,
      risks,
      documents,
      links,
      users,
      currentUserId,
    ] = await Promise.all([
      this.loadProject(),
      requirementService.loadAll(),
      useCaseService.loadAll(),
      testCaseService.loadAll(),
      informationService.loadAll(),
      riskService.loadAll(),
      documentService.loadAll(),
      diskLinkService.getAllLinks(),
      (await import('./artifactServices')).userService.loadAll(),
      this.getCurrentUserId(),
    ]);

    return {
      project,
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
    for (const key of STORED_TYPE_IDS) {
      const config = STORED_TYPES[key];
      const items = await ALL_ARTIFACT_SERVICES[key].loadAll(true);
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
}

export const diskProjectService = new DiskProjectService();
