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
      requirement: g.requirements,
      usecase: g.useCases,
      testcase: g.testCases,
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
