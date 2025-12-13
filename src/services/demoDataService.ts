/**
 * Demo Data Service
 *
 * Creates a fully-populated demo project with sample artifacts.
 */

import { diskProjectService } from './diskProjectService';
import { diskLinkService } from './diskLinkService';
import { DEMO_PROJECT, DEMO_ARTIFACTS } from '../utils/demoData';
import type { Project, Requirement, UseCase, TestCase, Information } from '../types';

interface CreatedArtifactIds {
  requirements: string[];
  useCases: string[];
  testCases: string[];
  information: string[];
}

/**
 * Create a demo project with all sample artifacts and links.
 * Returns the created project.
 */
export async function createDemoProject(): Promise<Project> {
  const nowDate = new Date();
  const now = nowDate.getTime();
  const createdIds: CreatedArtifactIds = {
    requirements: [],
    useCases: [],
    testCases: [],
    information: [],
  };

  // Use timestamp suffix to allow multiple demo projects
  // Format: Dec13-0824 (no colons or spaces that could cause file issues)
  const timestamp = `${nowDate.toLocaleString('en-US', { month: 'short' })}${nowDate.getDate()}-${String(nowDate.getHours()).padStart(2, '0')}${String(nowDate.getMinutes()).padStart(2, '0')}`;
  const projectName = `${DEMO_PROJECT.name} (${timestamp})`;

  // 1. Create the project
  const project = await diskProjectService.createProject(projectName, DEMO_PROJECT.description);

  // 2. Create requirements
  for (const reqData of DEMO_ARTIFACTS.requirements) {
    const id = await diskProjectService.getNextId('requirements');
    const requirement: Requirement = {
      ...reqData,
      id,
      lastModified: now,
    };
    await diskProjectService.saveRequirement(requirement);
    createdIds.requirements.push(id);
  }

  // 3. Create use cases
  for (const ucData of DEMO_ARTIFACTS.useCases) {
    const id = await diskProjectService.getNextId('useCases');
    const useCase: UseCase = {
      ...ucData,
      id,
      lastModified: now,
    };
    await diskProjectService.saveUseCase(useCase);
    createdIds.useCases.push(id);
  }

  // 4. Create test cases
  for (const tcData of DEMO_ARTIFACTS.testCases) {
    const id = await diskProjectService.getNextId('testCases');
    const testCase: TestCase = {
      ...tcData,
      id,
      lastModified: now,
    };
    await diskProjectService.saveTestCase(testCase);
    createdIds.testCases.push(id);
  }

  // 5. Create information items
  for (const infoData of DEMO_ARTIFACTS.information) {
    const id = await diskProjectService.getNextId('information');
    const information: Information = {
      ...infoData,
      id,
      lastModified: now,
    };
    await diskProjectService.saveInformation(information);
    createdIds.information.push(id);
  }

  // 6. Update project with artifact IDs
  project.requirementIds = createdIds.requirements;
  project.useCaseIds = createdIds.useCases;
  project.testCaseIds = createdIds.testCases;
  project.informationIds = createdIds.information;
  project.lastModified = now;
  await diskProjectService.updateProject(project);

  // 7. Create links between artifacts
  // Links can be global (visible everywhere) or project-specific
  for (const linkDef of DEMO_ARTIFACTS.links) {
    const sourceId = getArtifactId(linkDef.sourceType, linkDef.sourceIndex, createdIds);
    const targetId = getArtifactId(linkDef.targetType, linkDef.targetIndex, createdIds);

    if (sourceId && targetId) {
      // Global links have empty projectIds, project links include this project's ID
      const projectIds = linkDef.scope === 'global' ? [] : [project.id];
      await diskLinkService.createLink(sourceId, targetId, linkDef.type, projectIds);
    }
  }

  return project;
}

/**
 * Get artifact ID from type and index
 */
function getArtifactId(
  type: 'req' | 'uc' | 'tc' | 'info',
  index: number,
  ids: CreatedArtifactIds
): string | null {
  switch (type) {
    case 'req':
      return ids.requirements[index] ?? null;
    case 'uc':
      return ids.useCases[index] ?? null;
    case 'tc':
      return ids.testCases[index] ?? null;
    case 'info':
      return ids.information[index] ?? null;
    default:
      return null;
  }
}
