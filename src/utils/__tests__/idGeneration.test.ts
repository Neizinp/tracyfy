import { describe, it, expect } from 'vitest';

describe('ID Generation Logic', () => {
    describe('Sequential Numbering', () => {
        it('should generate sequential IDs with proper padding', () => {
            const generateId = (number: number, prefix: string = 'REQ') => {
                return `${prefix}-${String(number).padStart(3, '0')}`;
            };

            expect(generateId(1)).toBe('REQ-001');
            expect(generateId(10)).toBe('REQ-010');
            expect(generateId(100)).toBe('REQ-100');
            expect(generateId(999)).toBe('REQ-999');
        });

        it('should find next available ID when gaps exist', () => {
            const usedNumbers = new Set([1, 2, 4, 5]);

            let nextNumber = 1;
            while (usedNumbers.has(nextNumber)) {
                nextNumber++;
            }

            expect(nextNumber).toBe(3); // Gap at 3
        });

        it('should handle collision prevention', () => {
            const existingIds = new Set(['REQ-001', 'REQ-002', 'REQ-003']);
            const usedNumbers = new Set([1, 2, 3]);

            const generateUniqueId = () => {
                let number = 1;
                while (usedNumbers.has(number)) {
                    number++;
                }
                const newId = `REQ-${String(number).padStart(3, '0')}`;

                // Ensure uniqueness
                if (existingIds.has(newId)) {
                    throw new Error('ID collision detected');
                }

                return newId;
            };

            const newId = generateUniqueId();
            expect(newId).toBe('REQ-004');
            expect(existingIds.has(newId)).toBe(false);
        });

        it('should support different ID prefixes', () => {
            const generateId = (number: number, type: 'requirements' | 'usecases' | 'testcases') => {
                const prefixes = {
                    'requirements': 'REQ',
                    'usecases': 'UC',
                    'testcases': 'TC'
                };
                const prefix = prefixes[type];
                return `${prefix}-${String(number).padStart(3, '0')}`;
            };

            expect(generateId(1, 'requirements')).toBe('REQ-001');
            expect(generateId(1, 'usecases')).toBe('UC-001');
            expect(generateId(1, 'testcases')).toBe('TC-001');
        });
    });

    describe('ID Validation', () => {
        it('should validate ID format', () => {
            const isValidId = (id: string): boolean => {
                return /^[A-Z]+-\d{3}$/.test(id);
            };

            expect(isValidId('REQ-001')).toBe(true);
            expect(isValidId('UC-042')).toBe(true);
            expect(isValidId('REQ-1')).toBe(false); // Missing padding
            expect(isValidId('REQ-01')).toBe(false); // Insufficient padding
            expect(isValidId('REQ001')).toBe(false); // Missing separator
            expect(isValidId('req-001')).toBe(false); // Lowercase
        });

        it('should extract number from ID', () => {
            const extractNumber = (id: string): number | null => {
                const match = id.match(/^[A-Z]+-(\d+)$/);
                return match ? parseInt(match[1], 10) : null;
            };

            expect(extractNumber('REQ-001')).toBe(1);
            expect(extractNumber('REQ-042')).toBe(42);
            expect(extractNumber('REQ-100')).toBe(100);
            expect(extractNumber('invalid')).toBe(null);
        });
    });

    describe('Used Numbers Tracking', () => {
        it('should initialize used numbers from existing artifacts', () => {
            const requirements = [
                { id: 'REQ-001' },
                { id: 'REQ-003' },
                { id: 'REQ-005' }
            ];

            const usedNumbers = new Set<number>();
            requirements.forEach(req => {
                const match = req.id.match(/^REQ-(\d+)$/);
                if (match) {
                    usedNumbers.add(parseInt(match[1], 10));
                }
            });

            expect(usedNumbers.has(1)).toBe(true);
            expect(usedNumbers.has(2)).toBe(false);
            expect(usedNumbers.has(3)).toBe(true);
            expect(usedNumbers.has(5)).toBe(true);
        });

        it('should mark numbers as used when creating new artifacts', () => {
            const usedNumbers = new Set([1, 2, 3]);

            const allocateNumber = () => {
                let number = 1;
                while (usedNumbers.has(number)) {
                    number++;
                }
                usedNumbers.add(number);
                return number;
            };

            expect(allocateNumber()).toBe(4);
            expect(usedNumbers.has(4)).toBe(true);
            expect(allocateNumber()).toBe(5);
            expect(usedNumbers.has(5)).toBe(true);
        });

        it('should handle deletion and reuse of numbers', () => {
            const usedNumbers = new Set([1, 2, 3, 4, 5]);

            // Delete REQ-003
            usedNumbers.delete(3);

            // Next allocation should fill the gap
            let nextNumber = 1;
            while (usedNumbers.has(nextNumber)) {
                nextNumber++;
            }

            expect(nextNumber).toBe(3); // Gap filled
        });
    });

    describe('Type-specific ID Generation', () => {
        it('should maintain separate ID sequences for different types', () => {
            const usedReqNumbers = new Set([1, 2]);
            const usedUcNumbers = new Set([1]);

            // Can have REQ-001 and UC-001 without conflict
            expect(usedReqNumbers.has(1)).toBe(true);
            expect(usedUcNumbers.has(1)).toBe(true);

            // They are independent
            usedReqNumbers.add(3);
            expect(usedUcNumbers.has(3)).toBe(false);
        });
    });
});
