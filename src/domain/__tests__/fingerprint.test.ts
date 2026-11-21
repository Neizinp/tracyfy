import { describe, it, expect } from 'vitest';
import { fingerprint, fingerprintsOf } from '../fingerprint';

const req = { title: 'Login', text: 'The system shall log in.', status: 'draft', priority: 'low' };

describe('fingerprint', () => {
  it('changes with the title or a text field', () => {
    expect(fingerprint('requirement', { ...req, text: 'Other' })).not.toBe(
      fingerprint('requirement', req)
    );
    expect(fingerprint('requirement', { ...req, title: 'Logout' })).not.toBe(
      fingerprint('requirement', req)
    );
  });

  it('ignores metadata, whitespace at the ends and line endings', () => {
    const same = {
      ...req,
      status: 'approved',
      priority: 'high',
      text: ' The system shall log in.\r\n',
    };
    expect(fingerprint('requirement', same)).toBe(fingerprint('requirement', req));
  });

  it('a field left out counts as its default, as when the file is read back', () => {
    expect(fingerprint('requirement', req)).toBe(
      fingerprint('requirement', { ...req, category: 'technical' })
    );
  });

  it('looks up any artifact by ID; deleted or unknown ones have none', () => {
    const of = fingerprintsOf({
      requirement: [
        { id: 'REQ-001', ...req },
        { id: 'REQ-002', ...req, isDeleted: true },
      ],
    });
    expect(of('REQ-001')).toBe(fingerprint('requirement', req));
    expect(of('REQ-002')).toBeUndefined();
    expect(of('UC-404')).toBeUndefined();
  });
});
