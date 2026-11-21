import { useMemo } from 'react';
import { useAppStore } from '../state';
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
  const artifacts = useAppStore((s) => s.artifacts);
  return useMemo(
    () => ({
      ...artifacts,
      information: artifacts.information.map((i) => ({
        id: i.id,
        title: i.title,
        description: excerpt(i.text),
        isDeleted: i.isDeleted,
      })),
    }),
    [artifacts]
  );
}
