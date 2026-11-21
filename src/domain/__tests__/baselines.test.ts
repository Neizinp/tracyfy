import { describe, it, expect } from 'vitest';
import { baselineNameError } from '../baselines';

describe('baseline names are git tag names', () => {
  it('accepts version-like names', () => {
    for (const name of ['1.0', 'v2.1.3', 'release-2026', 'sprint/12']) {
      expect(baselineNameError(name)).toBeNull();
    }
  });

  it('rejects names git cannot store as a tag, and duplicates', () => {
    for (const name of ['', 'Release 1', 'a..b', 'x~1', 'v1:2', '-x', 'v1.', 'v1.lock']) {
      expect(baselineNameError(name)).not.toBeNull();
    }
    expect(baselineNameError('1.0', ['1.0'])).toMatch(/already/);
  });
});
