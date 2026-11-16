import { useMemo } from 'react';
import { useGlobalState } from '../app/providers';
import type { ArtifactKindId } from '../domain/artifactKinds';

/** What the link dialog and Links page need to know about an artifact */
export interface LinkableArtifact {
  id: string;
  title: string;
  description?: string;
  isDeleted?: boolean;
}

export type ArtifactsByKind = Record<ArtifactKindId, LinkableArtifact[]>;

const excerpt = (text: string | undefined, max = 100) =>
  !text ? '' : text.length > max ? `${text.substring(0, max)}...` : text;

/** Every artifact in the project, grouped by kind */
export function useLinkableArtifacts(): ArtifactsByKind {
  const g = useGlobalState();
  return useMemo(
    () => ({
      requirement: g.requirements,
      useCase: g.useCases,
      testCase: g.testCases,
      information: g.information.map((i) => ({
        id: i.id,
        title: i.title,
        description: excerpt(i.content || i.text),
        isDeleted: i.isDeleted,
      })),
      risk: g.risks,
      document: g.documents,
    }),
    [g.requirements, g.useCases, g.testCases, g.information, g.risks, g.documents]
  );
}
