import { useCallback, useMemo } from 'react';
import { useUI, useGlobalState } from '../app/providers';
import { kindOfId, type ArtifactKindId } from '../domain/artifactKinds';

/**
 * Open any artifact's dialog from its ID. The kind comes from the ID prefix,
 * so every caller (links, search, deep links, relationships) behaves the same.
 * Returns false when no such artifact exists.
 */
export function useOpenArtifact(): (id: string) => boolean {
  const { openModal } = useUI();
  const g = useGlobalState();

  const byKind = useMemo<Record<ArtifactKindId, { id: string }[]>>(
    () => ({
      requirement: g.requirements,
      useCase: g.useCases,
      testCase: g.testCases,
      information: g.information,
      risk: g.risks,
      document: g.documents,
    }),
    [g.requirements, g.useCases, g.testCases, g.information, g.risks, g.documents]
  );

  return useCallback(
    (id: string) => {
      const kind = kindOfId(id);
      const artifact = kind && byKind[kind].find((a) => a.id === id);
      if (!kind || !artifact) return false;
      openModal(kind, true, {
        id,
        type: kind,
        data: artifact as unknown as Record<string, unknown>,
      });
      return true;
    },
    [byKind, openModal]
  );
}
