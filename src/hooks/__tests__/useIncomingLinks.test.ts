import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIncomingLinks } from '../useIncomingLinks';

describe('useIncomingLinks', () => {
  const emptyProps = {
    targetId: 'REQ-001',
    requirements: [],
    useCases: [],
    testCases: [],
    information: [],
  };

  it('should return empty array when no artifacts link to target', () => {
    const { result } = renderHook(() => useIncomingLinks(emptyProps));
    expect(result.current).toEqual([]);
  });

  it('should find incoming links from requirements', () => {
    const props = {
      ...emptyProps,
      requirements: [
        {
          id: 'REQ-002',
          linkedArtifacts: [{ targetId: 'REQ-001', type: 'depends_on' as const }],
        },
      ],
    };

    const { result } = renderHook(() => useIncomingLinks(props));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      sourceId: 'REQ-002',
      sourceType: 'requirement',
      linkType: 'depends_on',
    });
  });

  it('should find incoming links from use cases', () => {
    const props = {
      ...emptyProps,
      useCases: [
        {
          id: 'UC-001',
          linkedArtifacts: [{ targetId: 'REQ-001', type: 'related_to' as const }],
        },
      ],
    };

    const { result } = renderHook(() => useIncomingLinks(props));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      sourceId: 'UC-001',
      sourceType: 'usecase',
      linkType: 'related_to',
    });
  });

  it('should find incoming links from test cases', () => {
    const props = {
      ...emptyProps,
      testCases: [
        {
          id: 'TC-001',
          linkedArtifacts: [{ targetId: 'REQ-001', type: 'related_to' as const }],
        },
      ],
    };

    const { result } = renderHook(() => useIncomingLinks(props));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      sourceId: 'TC-001',
      sourceType: 'testcase',
      linkType: 'related_to',
    });
  });

  it('should find incoming links from information', () => {
    const props = {
      ...emptyProps,
      information: [
        {
          id: 'INF-001',
          linkedArtifacts: [{ targetId: 'REQ-001', type: 'related_to' as const }],
        },
      ],
    };

    const { result } = renderHook(() => useIncomingLinks(props));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      sourceId: 'INF-001',
      sourceType: 'information',
      linkType: 'related_to',
    });
  });

  it('should find multiple incoming links from different artifact types', () => {
    const props = {
      ...emptyProps,
      requirements: [
        {
          id: 'REQ-002',
          linkedArtifacts: [{ targetId: 'REQ-001', type: 'depends_on' as const }],
        },
      ],
      useCases: [
        {
          id: 'UC-001',
          linkedArtifacts: [{ targetId: 'REQ-001', type: 'related_to' as const }],
        },
      ],
      testCases: [
        {
          id: 'TC-001',
          linkedArtifacts: [{ targetId: 'REQ-001', type: 'related_to' as const }],
        },
      ],
    };

    const { result } = renderHook(() => useIncomingLinks(props));

    expect(result.current).toHaveLength(3);
    expect(result.current.map((l) => l.sourceId)).toContain('REQ-002');
    expect(result.current.map((l) => l.sourceId)).toContain('UC-001');
    expect(result.current.map((l) => l.sourceId)).toContain('TC-001');
  });

  it('should not include outgoing links (only incoming)', () => {
    const props = {
      ...emptyProps,
      targetId: 'REQ-001',
      requirements: [
        {
          id: 'REQ-001',
          linkedArtifacts: [{ targetId: 'REQ-002', type: 'depends_on' as const }],
        },
        {
          id: 'REQ-002',
          linkedArtifacts: [],
        },
      ],
    };

    const { result } = renderHook(() => useIncomingLinks(props));

    // REQ-001 links TO REQ-002, so REQ-002 should not appear as incoming to REQ-001
    expect(result.current).toHaveLength(0);
  });

  it('should handle artifacts with no linkedArtifacts property', () => {
    const props = {
      ...emptyProps,
      requirements: [
        { id: 'REQ-002' }, // No linkedArtifacts
      ],
    };

    const { result } = renderHook(() => useIncomingLinks(props));
    expect(result.current).toEqual([]);
  });
});
