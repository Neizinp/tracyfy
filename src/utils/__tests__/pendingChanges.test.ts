/**
 * Every folder the app stores data in must either be shown in the Pending
 * Changes panel or be committed automatically by the code that writes it -
 * otherwise users end up with uncommitted files they cannot see or commit.
 * (workflows/ was neither, until this check existed.)
 */
import { describe, it, expect } from 'vitest';
import { STORED_TYPES } from '../../services/storedTypes';
import { classifyPendingPath, AUTO_COMMITTED_FOLDERS } from '../pendingChanges';

const DATA_FOLDERS = [
  ...Object.values(STORED_TYPES).map((c) => c.folder),
  'assets',
  'saved-filters',
];

describe('pending changes coverage', () => {
  it.each(DATA_FOLDERS)('%s/ is shown in the panel or auto-committed', (folder) => {
    const shown = classifyPendingPath(`${folder}/X-001.md`) !== null;
    const autoCommitted = (AUTO_COMMITTED_FOLDERS as readonly string[]).includes(folder);
    expect(shown || autoCommitted).toBe(true);
  });

  it('maps paths to the change shown in the panel', () => {
    expect(classifyPendingPath('requirements/REQ-001.md')).toEqual({
      type: 'requirement',
      id: 'REQ-001',
      filename: 'REQ-001.md',
    });
    expect(classifyPendingPath('assets/1234-abcd.png')).toMatchObject({
      type: 'asset',
      id: '1234-abcd.png',
    });
    expect(classifyPendingPath('workflows/WF-001.md')).toMatchObject({ type: 'workflow' });
    expect(classifyPendingPath('links/LINK-001.md')).toBeNull();
    expect(classifyPendingPath('README.md')).toBeNull();
  });
});
