/**
 * Disk-based Project Service
 *
 * One folder (git repository) is one project. Everything in it belongs to it.
 *
 * Directory structure:
 * /tracyfy.yaml        # project settings: name, description, custom attributes
 * /<folder of each kind>/<ID>.md   # see domain/artifactKinds.ts
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
import type { FileProblem } from './baseArtifactService';
import { projectConfigStore } from '../storage/projectConfigStore';
import { projectOf } from '../domain/projectConfig';

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

  // ============ PROJECT ============

  /** The project in this folder (tracyfy.yaml; the folder name if there is none) */
  async loadProject(): Promise<Project> {
    return projectOf(await projectConfigStore.load());
  }

  /** Save the project's name and description (shows up in Pending Changes) */
  async saveProject(project: Project): Promise<void> {
    await projectConfigStore.update((config) => ({
      ...config,
      name: project.name,
      description: project.description,
    }));
  }

  /** Load everything from disk, and every file that could not be read */
  async loadAll(): Promise<{
    project: Project;
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
    risks: Risk[];
    documents: ArtifactDocument[];
    links: Link[];
    problems: FileProblem[];
  }> {
    const [project, requirements, useCases, testCases, information, risks, documents, links] =
      await Promise.all([
        this.loadProject(),
        requirementService.loadAllWithProblems(),
        useCaseService.loadAllWithProblems(),
        testCaseService.loadAllWithProblems(),
        informationService.loadAllWithProblems(),
        riskService.loadAllWithProblems(),
        documentService.loadAllWithProblems(),
        diskLinkService.loadAllWithProblems(),
      ]);
    const loaded = [requirements, useCases, testCases, information, risks, documents, links];

    return {
      project,
      requirements: requirements.items,
      useCases: useCases.items,
      testCases: testCases.items,
      information: information.items,
      risks: risks.items,
      documents: documents.items,
      links: links.items,
      problems: loaded.flatMap((l) => l.problems),
    };
  }
}

export const diskProjectService = new DiskProjectService();
