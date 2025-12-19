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
