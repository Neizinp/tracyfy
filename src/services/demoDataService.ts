/**
 * Demo Data Service
 *
 * Fills an empty project with sample artifacts.
 */

import { diskCustomAttributeService } from './diskCustomAttributeService';
import { projectConfigStore } from '../storage/projectConfigStore';
import { withNewAttribute } from '../domain/projectConfig';
import { repository } from '../storage/repository';
import {
  DEMO_PROJECT,
  DEMO_ARTIFACTS,
  DEMO_CUSTOM_ATTRIBUTES,
  createDemoAttributeValues,
} from '../utils/demoData';
import type { Project, Requirement, UseCase, TestCase, Information, Risk } from '../types';
import type { ArtifactKindId } from '../domain/artifactKinds';

interface CreatedArtifactIds {
  requirements: string[];
  useCases: string[];
  testCases: string[];
  information: string[];
  risks: string[];
}

/**
 * Fill the (empty) project folder with sample artifacts and links, and name
 * the project after the demo. Returns the project.
 *
 * Performance optimized: Uses batch ID allocation and parallel saves.
 */
export async function loadDemoData(): Promise<Project> {
  const now = Date.now();
  const createdIds: CreatedArtifactIds = {
    requirements: [],
    useCases: [],
    testCases: [],
    information: [],
    risks: [],
  };

  const projectName = DEMO_PROJECT.name;

  // 0.5 Create custom attribute definitions (if they don't exist)
  const existingDefs = await diskCustomAttributeService.getAllDefinitions();
  const createdAttrIds: string[] = [];

  for (const attrDef of DEMO_CUSTOM_ATTRIBUTES) {
    // Check if attribute with same name already exists
    const existing = existingDefs.find((d) => d.name === attrDef.name);
    if (existing) {
      createdAttrIds.push(existing.id);
    } else {
      try {
        await projectConfigStore.update((config) => {
          const next = withNewAttribute(config, attrDef);
          createdAttrIds.push(next.created.id);
          return next.config;
        });
      } catch (error) {
        console.error('Failed to create custom attribute:', attrDef.name, error);
      }
    }
  }

  // Get custom attribute values for demo artifacts
  const { requirementValues, useCaseValues, testCaseValues } =
    createDemoAttributeValues(createdAttrIds);

  // 1. Name the project
  const project: Project = { name: projectName, description: DEMO_PROJECT.description };
  await repository.saveProject(project);

  // 2. Allocate all IDs at once
  const [reqIds, ucIds, tcIds, infoIds, riskIds] = await Promise.all([
    repository.nextIds('requirement', DEMO_ARTIFACTS.requirements.length),
    repository.nextIds('useCase', DEMO_ARTIFACTS.useCases.length),
    repository.nextIds('testCase', DEMO_ARTIFACTS.testCases.length),
    repository.nextIds('information', DEMO_ARTIFACTS.information.length),
    repository.nextIds('risk', DEMO_ARTIFACTS.risks.length),
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
    ...requirements.map((r) => repository.save('requirement', r)),
    ...useCases.map((u) => repository.save('useCase', u)),
    ...testCases.map((t) => repository.save('testCase', t)),
    ...informationItems.map((i) => repository.save('information', i)),
    ...risks.map((r) => repository.save('risk', r)),
  ]);

  // 5. Create links between artifacts
  for (const linkDef of DEMO_ARTIFACTS.links) {
    const sourceId = getArtifactId(linkDef.sourceType, linkDef.sourceIndex, createdIds);
    const targetId = getArtifactId(linkDef.targetType, linkDef.targetIndex, createdIds);

    if (sourceId && targetId) {
      await repository.createLink(sourceId, targetId, linkDef.type);
    }
  }

  return project;
}

/**
 * Get artifact ID from type and index
 */
function getArtifactId(
  kind: ArtifactKindId,
  index: number,
  ids: CreatedArtifactIds
): string | null {
  const byKind: Partial<Record<ArtifactKindId, string[]>> = {
    requirement: ids.requirements,
    useCase: ids.useCases,
    testCase: ids.testCases,
    information: ids.information,
    risk: ids.risks,
  };
  return byKind[kind]?.[index] ?? null;
}
