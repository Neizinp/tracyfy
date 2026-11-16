import { useMemo } from 'react';
import { useGlobalState } from '../app/providers';
import type { ArtifactsByType } from '../constants/linkableArtifacts';

const excerpt = (text: string | undefined, max = 100) =>
  !text ? '' : text.length > max ? `${text.substring(0, max)}...` : text;

/** All linkable artifacts (every project), grouped by type */
export function useLinkableArtifacts(): ArtifactsByType {
  const g = useGlobalState();
  return useMemo(
    () => ({
      requirement: g.globalRequirements,
      usecase: g.globalUseCases,
      testcase: g.globalTestCases,
      information: g.globalInformation.map((i) => ({
        id: i.id,
        title: i.title,
        description: excerpt(i.content || i.text),
        isDeleted: i.isDeleted,
      })),
      risk: g.globalRisks,
      document: g.globalDocuments,
    }),
    [
      g.globalRequirements,
      g.globalUseCases,
      g.globalTestCases,
      g.globalInformation,
      g.globalRisks,
      g.globalDocuments,
    ]
  );
}
