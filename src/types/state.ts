import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Risk,
  ArtifactDocument,
} from './artifact';
import type { ArtifactKindId } from '../domain/artifactKinds';

/** The TypeScript type of each kind of artifact */
export interface ArtifactByKind {
  requirement: Requirement;
  useCase: UseCase;
  testCase: TestCase;
  information: Information;
  risk: Risk;
  document: ArtifactDocument;
}

/** Every artifact in the project, by kind */
export type ArtifactsByKind = { [K in ArtifactKindId]: ArtifactByKind[K][] };
