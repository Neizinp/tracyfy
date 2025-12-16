/**
 * Demo Data Service
 *
 * Creates a fully-populated demo project with sample artifacts.
 */

import { diskProjectService } from './diskProjectService';
import { diskLinkService } from './diskLinkService';
import { diskCustomAttributeService } from './diskCustomAttributeService';
import {
  DEMO_PROJECT,
  DEMO_ARTIFACTS,
  DEMO_CUSTOM_ATTRIBUTES,
  createDemoAttributeValues,
} from '../utils/demoData';
import type { Project, Requirement, UseCase, TestCase, Information, Risk } from '../types';

interface CreatedArtifactIds {
  requirements: string[];
  useCases: string[];
  testCases: string[];
  information: string[];
  risks: string[];
}

/**
 * Create a demo project with all sample artifacts and links.
 * Returns the created project.
 *
 * Performance optimized: Uses batch ID allocation and parallel saves.
 */
export async function createDemoProject(): Promise<Project> {
  const now = Date.now();
  const createdIds: CreatedArtifactIds = {
    requirements: [],
    useCases: [],
    testCases: [],
    information: [],
    risks: [],
  };

  // Use the simple demo project name
  const projectName = DEMO_PROJECT.name;

  // 0. Ensure a demo user exists and is selected
  const existingUsers = await diskProjectService.loadAllUsers();
  let demoUser = existingUsers.find((u) => u.name === 'Demo User');
  if (!demoUser) {
    const userId = await diskProjectService.getNextId('users');
    demoUser = {
      id: userId,
      name: 'Demo User',
      dateCreated: now,
      lastModified: now,
    };
    await diskProjectService.saveUser(demoUser);
  }
  // Set as current user so editing works
  await diskProjectService.setCurrentUserId(demoUser.id);

  // 0.5 Create custom attribute definitions (if they don't exist)
  const existingDefs = await diskCustomAttributeService.getAllDefinitions();
  const createdAttrIds: string[] = [];

  for (const attrDef of DEMO_CUSTOM_ATTRIBUTES) {
    // Check if attribute with same name already exists
    const existing = existingDefs.find((d) => d.name === attrDef.name);
    if (existing) {
      createdAttrIds.push(existing.id);
    } else {
      const newDef = await diskCustomAttributeService.createDefinition(attrDef);
      createdAttrIds.push(newDef.id);
    }
  }

  // Get custom attribute values for demo artifacts
  const { requirementValues, useCaseValues, testCaseValues } =
    createDemoAttributeValues(createdAttrIds);

  // 1. Create the project
  const project = await diskProjectService.createProject(projectName, DEMO_PROJECT.description);

  // 2. Batch allocate all IDs at once (single disk write per type)
  const [reqIds, ucIds, tcIds, infoIds, riskIds] = await Promise.all([
    diskProjectService.getNextIds('requirements', DEMO_ARTIFACTS.requirements.length),
    diskProjectService.getNextIds('useCases', DEMO_ARTIFACTS.useCases.length),
    diskProjectService.getNextIds('testCases', DEMO_ARTIFACTS.testCases.length),
    diskProjectService.getNextIds('information', DEMO_ARTIFACTS.information.length),
    diskProjectService.getNextIds('risks', DEMO_ARTIFACTS.risks.length),
  ]);

  createdIds.requirements = reqIds;
  createdIds.useCases = ucIds;
  createdIds.testCases = tcIds;
  createdIds.information = infoIds;
  createdIds.risks = riskIds;

  // 3. Prepare all artifacts with their IDs and custom attribute values
  const requirements: Requirement[] = DEMO_ARTIFACTS.requirements.map((reqData, i) => ({
    ...reqData,
    id: reqIds[i],
    lastModified: now,
    customAttributes: requirementValues[i] || [],
  }));

  const useCases: UseCase[] = DEMO_ARTIFACTS.useCases.map((ucData, i) => ({
    ...ucData,
    id: ucIds[i],
    lastModified: now,
    customAttributes: useCaseValues[i] || [],
  }));

  const testCases: TestCase[] = DEMO_ARTIFACTS.testCases.map((tcData, i) => ({
    ...tcData,
    id: tcIds[i],
    lastModified: now,
    customAttributes: testCaseValues[i] || [],
  }));

  const informationItems: Information[] = DEMO_ARTIFACTS.information.map((infoData, i) => ({
    ...infoData,
    id: infoIds[i],
    lastModified: now,
  }));

  const risks: Risk[] = DEMO_ARTIFACTS.risks.map((riskData, i) => ({
    ...riskData,
    id: riskIds[i],
    lastModified: now,
  }));

  // 4. Save all artifacts in parallel
  await Promise.all([
    ...requirements.map((r) => diskProjectService.saveRequirement(r)),
    ...useCases.map((u) => diskProjectService.saveUseCase(u)),
    ...testCases.map((t) => diskProjectService.saveTestCase(t)),
    ...informationItems.map((i) => diskProjectService.saveInformation(i)),
    ...risks.map((r) => diskProjectService.saveRisk(r)),
  ]);

  // 5. Update project with artifact IDs
  project.requirementIds = createdIds.requirements;
  project.useCaseIds = createdIds.useCases;
  project.testCaseIds = createdIds.testCases;
  project.informationIds = createdIds.information;
  project.riskIds = createdIds.risks;
  project.lastModified = now;
  await diskProjectService.updateProject(project);

  // 6. Create links between artifacts SEQUENTIALLY to avoid race condition on counter file
  // Note: Promise.all() was causing all links to get the same ID because getNextId()
  // reads/writes a counter file, and parallel calls all read the same counter value.
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
  type: 'req' | 'uc' | 'tc' | 'info' | 'risk',
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
    case 'risk':
      return ids.risks[index] ?? null;
    default:
      return null;
  }
}
