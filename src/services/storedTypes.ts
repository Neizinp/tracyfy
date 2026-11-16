/**
 * Everything the app stores as one file per item: the artifact kinds from the
 * registry, plus the bookkeeping types that are not artifacts.
 *
 * Users, workflows, custom attribute files and counters go away in step 4 of
 * docs/DESIGN.md; until then they share this one vocabulary.
 */
import { ARTIFACT_KINDS, isKindId, kind, type ArtifactKindId } from '../domain/artifactKinds';

export type StoredType = ArtifactKindId | 'link' | 'user' | 'workflow' | 'customAttribute';

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
  user: { idPrefix: 'USER', folder: 'users', label: 'User' },
  workflow: { idPrefix: 'WF', folder: 'workflows', label: 'Workflow' },
  customAttribute: { idPrefix: 'ATTR', folder: 'custom-attributes', label: 'Custom attribute' },
};

export const STORED_TYPE_IDS = Object.keys(STORED_TYPES) as StoredType[];

/** Human-readable name of a stored type */
export function storedTypeLabel(type: StoredType): string {
  return isKindId(type) ? kind(type).label.singular : STORED_TYPES[type].label;
}
