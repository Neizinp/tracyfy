/**
 * Which uncommitted files the Pending Changes panel shows, and how.
 *
 * Files in AUTO_COMMITTED_FOLDERS are internal bookkeeping and are hidden from
 * the panel, so the code that writes them MUST commit them itself - otherwise
 * they stay uncommitted forever with no way for the user to commit them.
 * Anything else that is not mapped here is also invisible in the panel.
 */
import type { ArtifactChange } from '../types';
import { ARTIFACT_KINDS } from '../domain/artifactKinds';

/** The project's name and description, at the folder root */
export const PROJECT_FILE = 'project.md';

export const AUTO_COMMITTED_FOLDERS = ['custom-attributes'] as const;

const FOLDER_TO_TYPE: Record<string, ArtifactChange['type']> = {
  ...Object.fromEntries(ARTIFACT_KINDS.map((k) => [k.folder, k.id])),
  assets: 'asset',
  links: 'link',
  'saved-filters': 'saved-filter',
  workflows: 'workflow',
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
