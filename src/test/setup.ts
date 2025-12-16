import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock debug utility to prevent ReferenceError in tests
// vi.mock must use a static string that vitest can hoist
vi.mock('../utils/debug', () => ({
  debug: {
    log: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  isDebug: () => false,
}));
