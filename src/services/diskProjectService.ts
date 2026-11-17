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
 * .git/tracyfy-current-user    # selected user ID (local, not versioned)
 */

import { BaseDiskService } from './baseDiskService';
import { STORED_TYPES } from './storedTypes';
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
  }

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
}

export const diskProjectService = new DiskProjectService();
