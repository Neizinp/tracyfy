/**
 * useCustomAttributes reads the definitions from the store (loaded from
 * tracyfy.yaml) and filters them by artifact kind.
 */
import { describe, it, expect } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import type { CustomAttributeDefinition } from '../../types/customAttributes';
import { StoreProvider, createAppStore, type AppState } from '../../state';
import { useCustomAttributes } from '../useCustomAttributes';

const definitions: CustomAttributeDefinition[] = [
  {
    id: 'ATTR-001',
    name: 'Target Release',
    type: 'dropdown',
    description: 'Target release version',
    options: ['v1.0', 'v1.1', 'v2.0'],
    appliesTo: ['requirement', 'useCase'],
    required: false,
  },
  {
    id: 'ATTR-002',
    name: 'Safety Critical',
    type: 'checkbox',
    description: '',
    appliesTo: ['requirement', 'testCase'],
    required: true,
  },
  {
    id: 'ATTR-003',
    name: 'Priority Score',
    type: 'number',
    description: 'Numeric priority',
    appliesTo: ['requirement'],
    required: false,
  },
];

function renderWith(state: Partial<AppState>) {
  const store = createAppStore();
  store.setState(state);
  return renderHook(() => useCustomAttributes(), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(StoreProvider, { store, children }),
  }).result;
}

describe('useCustomAttributes', () => {
  it('is loading until a folder is open', () => {
    const result = renderWith({ isReady: false });
    expect(result.current.loading).toBe(true);
    expect(result.current.definitions).toEqual([]);
  });

  it('returns the definitions of the open project', () => {
    const result = renderWith({ isReady: true, attributeDefinitions: definitions });
    expect(result.current.loading).toBe(false);
    expect(result.current.definitions).toEqual(definitions);
  });

  it('returns only the definitions that apply to a kind', () => {
    const result = renderWith({ isReady: true, attributeDefinitions: definitions });
    const ids = (kind: Parameters<typeof result.current.getDefinitionsForType>[0]) =>
      result.current.getDefinitionsForType(kind).map((d) => d.id);

    expect(ids('requirement')).toEqual(['ATTR-001', 'ATTR-002', 'ATTR-003']);
    expect(ids('useCase')).toEqual(['ATTR-001']);
    expect(ids('testCase')).toEqual(['ATTR-002']);
    expect(ids('information')).toEqual([]);
  });
});
