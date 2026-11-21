import { describe, it, expect } from 'vitest';
import { formatId, idNumber, highestIdNumber, nextIds } from '../ids';

describe('ids', () => {
  it('formats and parses IDs of one prefix only', () => {
    expect(formatId('REQ', 12)).toBe('REQ-012');
    expect(formatId('REQ', 1234)).toBe('REQ-1234');
    expect(idNumber('REQ', 'REQ-012')).toBe(12);
    expect(idNumber('REQ', 'UC-012')).toBeNull();
    expect(idNumber('REQ', 'REQ-x')).toBeNull();
  });

  it('the next ID follows the highest existing one, ignoring other names', () => {
    expect(highestIdNumber('REQ', ['REQ-001', 'REQ-042', 'REQ-7', 'UC-100', 'REQ-x'])).toBe(42);
    expect(nextIds('REQ', ['REQ-003', 'REQ-001'], 2)).toEqual(['REQ-004', 'REQ-005']);
    expect(nextIds('UC', [], 1)).toEqual(['UC-001']);
  });
});
