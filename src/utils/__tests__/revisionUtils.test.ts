import { describe, it, expect } from 'vitest';
import { incrementRevision } from '../revisionUtils';

describe('revisionUtils', () => {
    describe('incrementRevision', () => {
        it('should increment "01" to "02"', () => {
            expect(incrementRevision('01')).toBe('02');
        });

        it('should increment "09" to "10"', () => {
            expect(incrementRevision('09')).toBe('10');
        });

        it('should increment "10" to "11"', () => {
            expect(incrementRevision('10')).toBe('11');
        });

        it('should handle invalid input by returning "01"', () => {
            expect(incrementRevision('invalid')).toBe('01');
        });

        it('should handle single digit input "1" to "02"', () => {
            expect(incrementRevision('1')).toBe('02');
        });
    });
});
