/**
 * One file service per artifact kind, all reading and writing the format in
 * domain/artifactFormat.ts.
 */
import { BaseArtifactService } from './baseArtifactService';
import type {
  ArtifactDocument,
  BaseArtifact,
  Information,
  Requirement,
  Risk,
  TestCase,
  UseCase,
} from '../types';
import { KIND_IDS, type ArtifactKindId } from '../domain/artifactKinds';
import { parseArtifact, serializeArtifact } from '../domain/artifactFormat';

function serviceFor<T extends BaseArtifact>(kindId: ArtifactKindId) {
  return new BaseArtifactService<T>(kindId, {
    serialize: (item) => serializeArtifact(kindId, item),
    deserialize: (id, content) => parseArtifact(kindId, id, content) as T,
  });
}

export const requirementService = serviceFor<Requirement>('requirement');
export const useCaseService = serviceFor<UseCase>('useCase');
export const testCaseService = serviceFor<TestCase>('testCase');
export const informationService = serviceFor<Information>('information');
export const riskService = serviceFor<Risk>('risk');
export const documentService = serviceFor<ArtifactDocument>('document');

const BY_KIND: Record<ArtifactKindId, BaseArtifactService<BaseArtifact>> = {
  requirement: requirementService,
  useCase: useCaseService,
  testCase: testCaseService,
  information: informationService,
  risk: riskService,
  document: documentService,
} as unknown as Record<ArtifactKindId, BaseArtifactService<BaseArtifact>>;

/** The file service of a kind */
export function artifactService(kindId: ArtifactKindId): BaseArtifactService<BaseArtifact> {
  return BY_KIND[kindId];
}

export const ARTIFACT_SERVICES = KIND_IDS.map((k) => BY_KIND[k]);
