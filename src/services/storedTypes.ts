/**
 * Everything the app stores as one file per item: the artifact kinds from the
 * registry, plus the bookkeeping types that are not artifacts.
 *
 * Workflows go away in step 7 of docs/DESIGN.md (P6); until then they share
 * this one vocabulary.
 */
import { ARTIFACT_KINDS, isKindId, kind, type ArtifactKindId } from '../domain/artifactKinds';

export type StoredType = ArtifactKindId | 'link' | 'workflow';

export interface StoredTypeConfig {
  idPrefix: string;
  folder: string;
  label: string;
}

export const STORED_TYPES: Record<StoredType, StoredTypeConfig> = {
  ...(Object.fromEntries(
    ARTIFACT_KINDS.map((k) => [
      k.id,
      { idPrefix: k.prefix, folder: k.folder, label: k.label.singular },
    ])
  ) as Record<ArtifactKindId, StoredTypeConfig>),
  link: { idPrefix: 'LINK', folder: 'links', label: 'Link' },
  workflow: { idPrefix: 'WF', folder: 'workflows', label: 'Workflow' },
};

export const STORED_TYPE_IDS = Object.keys(STORED_TYPES) as StoredType[];

/** Human-readable name of a stored type */
export function storedTypeLabel(type: StoredType): string {
  return isKindId(type) ? kind(type).label.singular : STORED_TYPES[type].label;
}
