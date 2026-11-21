/**
 * useTraceabilityData Hook
 *
 * Manages traceability data calculations including artifact unification,
 * link analysis, gap detection, and statistics. Gaps are violations of the
 * project's traceability rules (src/domain/traceability.ts).
 * Extracted from TraceabilityDashboard for better separation of concerns.
 */

import { useState, useMemo, useCallback } from 'react';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Risk,
  ArtifactDocument,
  Link,
} from '../../types';
import type { UnifiedArtifact, GapInfo } from './types';
import { KIND_IDS, kindOfId, type ArtifactKindId } from '../../domain/artifactKinds';
import { findGaps } from '../../domain/traceability';
import { useAppStore } from '../../state';

interface UseTraceabilityDataOptions {
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  risks?: Risk[];
  documents?: ArtifactDocument[];
  standaloneLinks: Link[];
}

const EMPTY: never[] = [];

export function useTraceabilityData({
  requirements,
  useCases,
  testCases,
  information,
  risks = EMPTY,
  documents = EMPTY,
  standaloneLinks,
}: UseTraceabilityDataOptions) {
  const rules = useAppStore((s) => s.settings.traceability);
  // Multi-select type toggles - all selected by default
  const [selectedTypes, setSelectedTypes] = useState<Set<ArtifactKindId>>(new Set(KIND_IDS));

  // Toggle a type on/off
  const toggleType = useCallback((type: ArtifactKindId) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // Build unified artifacts list
  const allArtifacts = useMemo((): UnifiedArtifact[] => {
    const entry =
      (type: ArtifactKindId) =>
      (a: { id: string; title: string }): UnifiedArtifact => ({ id: a.id, title: a.title, type });
    return [
      ...requirements.map(entry('requirement')),
      ...useCases.map(entry('useCase')),
      ...testCases.map(entry('testCase')),
      ...information.map(entry('information')),
      ...risks.map(entry('risk')),
      ...documents.map(entry('document')),
    ];
  }, [requirements, useCases, testCases, information, risks, documents]);

  // Build all links set for bi-directional lookup
  const allLinksSet = useMemo(() => {
    const links = new Set<string>();
    standaloneLinks.forEach((link) => {
      links.add(link.sourceId);
      links.add(link.targetId);
    });
    return links;
  }, [allArtifacts, standaloneLinks]);

  // Every rule violation, with the artifact it is about
  const gapArtifacts = useMemo((): GapInfo[] => {
    const byId = new Map(allArtifacts.map((a) => [a.id, a]));
    return findGaps(rules, allArtifacts, standaloneLinks).flatMap((gap) => {
      const artifact = byId.get(gap.artifactId);
      return artifact ? [{ artifact, gap }] : [];
    });
  }, [rules, allArtifacts, standaloneLinks]);

  // Per kind: how many there are, how many have a link, how many have a gap
  const stats = useMemo(() => {
    const withGaps = new Set(gapArtifacts.map((g) => g.artifact.id));
    const calculateStats = (artifacts: UnifiedArtifact[]) => ({
      total: artifacts.length,
      linked: artifacts.filter((a) => allLinksSet.has(a.id)).length,
      gaps: artifacts.filter((a) => withGaps.has(a.id)).length,
    });

    return Object.fromEntries(
      KIND_IDS.map((type) => [type, calculateStats(allArtifacts.filter((a) => a.type === type))])
    ) as Record<ArtifactKindId, { total: number; linked: number; gaps: number }>;
  }, [allArtifacts, allLinksSet, gapArtifacts]);

  // Get all links as flat list
  const allLinks = useMemo(() => {
    const links: {
      linkId?: string;
      sourceId: string;
      targetId: string;
      type: string;
      sourceType: ArtifactKindId;
      targetType: ArtifactKindId;
    }[] = [];
    const artifactTypeMap = new Map(allArtifacts.map((a) => [a.id, a.type]));
    const artifactIds = new Set(allArtifacts.map((a) => a.id));

    const getTypeFromId = (id: string): ArtifactKindId =>
      artifactTypeMap.get(id) ?? kindOfId(id) ?? 'requirement';

    standaloneLinks.forEach((link) => {
      if (artifactIds.has(link.sourceId) && artifactIds.has(link.targetId)) {
        links.push({
          linkId: link.id,
          sourceId: link.sourceId,
          targetId: link.targetId,
          type: link.type,
          sourceType: getTypeFromId(link.sourceId),
          targetType: getTypeFromId(link.targetId),
        });
      }
    });

    return links;
  }, [allArtifacts, standaloneLinks]);

  // Filter gaps by selected types
  const filteredGaps = useMemo(() => {
    if (selectedTypes.size === KIND_IDS.length) return gapArtifacts;
    return gapArtifacts.filter((gap) => selectedTypes.has(gap.artifact.type));
  }, [gapArtifacts, selectedTypes]);

  // Computed totals: every gap, and every artifact with a link
  const totalGaps = gapArtifacts.length;
  const totalLinked = KIND_IDS.reduce((sum, t) => sum + stats[t].linked, 0);
  const totalArtifacts = allArtifacts.length;

  return {
    // State
    selectedTypes,
    setSelectedTypes,
    toggleType,

    // Computed data
    allArtifacts,
    allLinksSet,
    stats,
    gapArtifacts,
    allLinks,
    filteredGaps,

    // Totals
    totalGaps,
    totalLinked,
    totalArtifacts,
  };
}
