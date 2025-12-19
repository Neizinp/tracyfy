/**
 * Artifact Services
 *
 * Instances of BaseArtifactService for each artifact type.
 */

import { BaseArtifactService, type ArtifactSerializer } from './baseArtifactService';
import type { Requirement, UseCase, TestCase, Information, Risk, Project, User } from '../types';
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
  projectToMarkdown,
  markdownToProject,
  userToMarkdown,
  markdownToUser,
} from '../utils/markdownUtils';

// Requirements Service
const requirementSerializer: ArtifactSerializer<Requirement> = {
  serialize: requirementToMarkdown,
  deserialize: markdownToRequirement,
};
export const requirementService = new BaseArtifactService<Requirement>(
  'requirements',
  requirementSerializer
);

// Use Cases Service
const useCaseSerializer: ArtifactSerializer<UseCase> = {
  serialize: convertUseCaseToMarkdown,
  deserialize: markdownToUseCase,
};
export const useCaseService = new BaseArtifactService<UseCase>('usecases', useCaseSerializer);

// Test Cases Service
const testCaseSerializer: ArtifactSerializer<TestCase> = {
  serialize: testCaseToMarkdown,
  deserialize: markdownToTestCase,
};
export const testCaseService = new BaseArtifactService<TestCase>('testcases', testCaseSerializer);

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
export const riskService = new BaseArtifactService<Risk>('risks', riskSerializer);

// Projects Service
const projectSerializer: ArtifactSerializer<Project> = {
  serialize: projectToMarkdown,
  deserialize: (content) => markdownToProject(content) as Project | null,
};
export const projectService = new BaseArtifactService<Project>('projects', projectSerializer);

// Users Service
const userSerializer: ArtifactSerializer<User> = {
  serialize: userToMarkdown,
  deserialize: markdownToUser,
};
export const userService = new BaseArtifactService<User>('users', userSerializer);
