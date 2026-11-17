/**
 * Artifact Services
 *
 * Instances of BaseArtifactService for each artifact type.
 */

import { BaseArtifactService, type ArtifactSerializer } from './baseArtifactService';
import type { StoredType } from './storedTypes';
import type { Requirement, UseCase, TestCase, Information, Risk } from '../types';
import {
  requirementToMarkdown,
  markdownToRequirement,
  convertUseCaseToMarkdown,
  markdownToUseCase,
  testCaseToMarkdown,
  markdownToTestCase,
  informationToMarkdown,
  markdownToInformation,
  riskToMarkdown,
  markdownToRisk,
} from '../utils/markdownUtils';

// Requirements Service
const requirementSerializer: ArtifactSerializer<Requirement> = {
  serialize: requirementToMarkdown,
  deserialize: markdownToRequirement,
};
export const requirementService = new BaseArtifactService<Requirement>(
  'requirement',
  requirementSerializer
);

// Use Cases Service
const useCaseSerializer: ArtifactSerializer<UseCase> = {
  serialize: convertUseCaseToMarkdown,
  deserialize: markdownToUseCase,
};
export const useCaseService = new BaseArtifactService<UseCase>('useCase', useCaseSerializer);

// Test Cases Service
const testCaseSerializer: ArtifactSerializer<TestCase> = {
  serialize: testCaseToMarkdown,
  deserialize: markdownToTestCase,
};
export const testCaseService = new BaseArtifactService<TestCase>('testCase', testCaseSerializer);

// Information Service
const informationSerializer: ArtifactSerializer<Information> = {
  serialize: informationToMarkdown,
  deserialize: markdownToInformation,
};
export const informationService = new BaseArtifactService<Information>(
  'information',
  informationSerializer
);

// Risks Service
const riskSerializer: ArtifactSerializer<Risk> = {
  serialize: riskToMarkdown,
  deserialize: markdownToRisk,
};
export const riskService = new BaseArtifactService<Risk>('risk', riskSerializer);

// Registry of all artifact services for generic iteration
import { diskLinkService } from './diskLinkService';
import { diskWorkflowService } from './diskWorkflowService';
import { diskCustomAttributeService } from './diskCustomAttributeService';
import { documentService } from './documentService';
export { documentService };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ALL_ARTIFACT_SERVICES: Record<StoredType, BaseArtifactService<any>> = {
  requirement: requirementService,
  useCase: useCaseService,
  testCase: testCaseService,
  information: informationService,
  risk: riskService,
  link: diskLinkService,
  workflow: diskWorkflowService,
  customAttribute: diskCustomAttributeService,
  document: documentService,
};
