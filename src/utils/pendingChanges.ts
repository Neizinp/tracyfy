/**
 * Which uncommitted files the Pending Changes panel shows, and how.
 *
 * Everything the app writes must be mapped here: there are no hidden
 * bookkeeping files, so a file the panel does not show could never be
 * committed by the user.
 */
import type { ArtifactChange } from '../types';
import { ARTIFACT_KINDS } from '../domain/artifactKinds';
import { PROJECT_CONFIG_FILE } from '../domain/projectConfig';

/** The project's settings, at the folder root */
export const PROJECT_FILE = PROJECT_CONFIG_FILE;

const FOLDER_TO_TYPE: Record<string, ArtifactChange['type']> = {
  ...Object.fromEntries(ARTIFACT_KINDS.map((k) => [k.folder, k.id])),
  assets: 'asset',
  links: 'link',
  'saved-filters': 'saved-filter',
};

/**
 * Map a repo-relative path to the change shown in the panel,
 * or null if the panel does not show it.
 */
export function classifyPendingPath(
  path: string
): { type: ArtifactChange['type']; id: string; filename: string } | null {
  if (path === PROJECT_FILE) return { type: 'project', id: 'project', filename: PROJECT_FILE };
  const parts = path.split('/');
  if (parts.length < 2) return null;
  const [folder, filename] = parts;
  const type = FOLDER_TO_TYPE[folder];
  if (!type) return null;
  // For .md files, strip extension. For assets (images), keep the full filename as id.
  const id = filename.endsWith('.md') ? filename.slice(0, -'.md'.length) : filename;
  return { type, id, filename };
}
