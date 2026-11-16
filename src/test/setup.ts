import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Node >= 25 ships an experimental global `localStorage` that shadows jsdom's and
// is unusable without --localstorage-file. Provide an in-memory Storage instead.
if (typeof globalThis.localStorage?.getItem !== 'function') {
  class MemoryStorage implements Storage {
    private store = new Map<string, string>();
    get length() {
      return this.store.size;
    }
    clear() {
      this.store.clear();
    }
    getItem(key: string) {
      return this.store.has(key) ? this.store.get(key)! : null;
    }
    key(index: number) {
      return [...this.store.keys()][index] ?? null;
    }
    removeItem(key: string) {
      this.store.delete(key);
    }
    setItem(key: string, value: string) {
      this.store.set(key, String(value));
    }
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

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
import React from 'react';

// Mock react-virtuoso
vi.mock('react-virtuoso', () => ({
  TableVirtuoso: ({ data, itemContent, fixedHeaderContent, components, ...props }: any) => {
    const Table = components?.Table || 'table';
    const TableHead = components?.TableHead || 'thead';
    const TableRow = components?.TableRow || 'tr';

    return React.createElement(
      'div',
      props,
      React.createElement(
        Table,
        null,
        React.createElement(TableHead, null, fixedHeaderContent?.()),
        React.createElement(
          'tbody',
          null,
          data.map((item: any, index: number) =>
            React.createElement(TableRow, { key: item.id || index, item }, itemContent(index, item))
          )
        )
      )
    );
  },
}));
