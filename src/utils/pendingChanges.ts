/**
 * Which uncommitted files the Pending Changes panel shows, and how.
 *
 * Files in AUTO_COMMITTED_FOLDERS are internal bookkeeping and are hidden from
 * the panel, so the code that writes them MUST commit them itself - otherwise
 * they stay uncommitted forever with no way for the user to commit them.
 * Anything else that is not mapped here is also invisible in the panel.
 */
import type { ArtifactChange } from '../types';

export const AUTO_COMMITTED_FOLDERS = ['counters', 'links', 'custom-attributes'] as const;

const FOLDER_TO_TYPE: Record<string, ArtifactChange['type']> = {
  requirements: 'requirement',
  usecases: 'usecase',
  testcases: 'testcase',
  information: 'information',
  risks: 'risk',
  projects: 'project',
  assets: 'asset',
  users: 'user',
  'saved-filters': 'saved-filter',
  documents: 'document',
  workflows: 'workflow',
};

/**
 * Map a repo-relative path to the change shown in the panel,
 * or null if the panel does not show it.
 */
export function classifyPendingPath(
  path: string
): { type: ArtifactChange['type']; id: string; filename: string } | null {
  const parts = path.split('/');
  if (parts.length < 2) return null;
  const [folder, filename] = parts;
  const type = FOLDER_TO_TYPE[folder];
  if (!type) return null;
  // For .md files, strip extension. For assets (images), keep the full filename as id.
  const id = filename.endsWith('.md') ? filename.slice(0, -'.md'.length) : filename;
  return { type, id, filename };
}
