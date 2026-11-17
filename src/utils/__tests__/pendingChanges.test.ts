/**
 * Every folder the app stores data in must be shown in the Pending Changes
 * panel - otherwise users end up with uncommitted files they cannot see or
 * commit. (workflows/ was not, until this check existed.)
 */
import { describe, it, expect } from 'vitest';
import { STORED_TYPES } from '../../services/storedTypes';
import { classifyPendingPath } from '../pendingChanges';

const DATA_FOLDERS = [
  ...Object.values(STORED_TYPES).map((c) => c.folder),
  'assets',
  'saved-filters',
];

describe('pending changes coverage', () => {
  it.each(DATA_FOLDERS)('%s/ is shown in the panel', (folder) => {
    expect(classifyPendingPath(`${folder}/X-001.md`)).not.toBeNull();
  });

  it('tracyfy.yaml is shown as the project', () => {
    expect(classifyPendingPath('tracyfy.yaml')).toMatchObject({ type: 'project' });
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
    expect(classifyPendingPath('links/LINK-001.md')).toMatchObject({
      type: 'link',
      id: 'LINK-001',
    });
    expect(classifyPendingPath('README.md')).toBeNull();
  });
});
