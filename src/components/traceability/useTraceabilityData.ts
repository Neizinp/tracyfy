/**
 * useTraceabilityData Hook
 *
 * Manages traceability data calculations including artifact unification,
 * link analysis, gap detection, and statistics.
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

  // Calculate coverage stats per type
  const stats = useMemo(() => {
    const calculateStats = (artifacts: UnifiedArtifact[]) => {
      const linked = artifacts.filter((a) => allLinksSet.has(a.id)).length;
      return { total: artifacts.length, linked, gaps: artifacts.length - linked };
    };

    return Object.fromEntries(
      KIND_IDS.map((type) => [type, calculateStats(allArtifacts.filter((a) => a.type === type))])
    ) as Record<ArtifactKindId, { total: number; linked: number; gaps: number }>;
  }, [allArtifacts, allLinksSet]);

  // Get gap artifacts with issue types, from the link files
  const gapArtifacts = useMemo((): GapInfo[] => {
    const gaps: GapInfo[] = [];
    const artifactIds = new Set(allArtifacts.map((a) => a.id));

    const outgoingTargets = new Map<string, string[]>();
    const addOutgoing = (sourceId: string, targetId: string) => {
      if (!targetId) return;
      const list = outgoingTargets.get(sourceId) ?? [];
      list.push(targetId);
      outgoingTargets.set(sourceId, list);
    };
    standaloneLinks.forEach((link) => addOutgoing(link.sourceId, link.targetId));

    const hasIncomingLink = new Set<string>();
    outgoingTargets.forEach((targets) => targets.forEach((t) => hasIncomingLink.add(t)));

    allArtifacts.forEach((artifact) => {
      const targets = outgoingTargets.get(artifact.id) ?? [];
      const hasOutgoing = targets.length > 0;
      const hasIncoming = hasIncomingLink.has(artifact.id);
      const orphanTargets = targets.filter((id) => !artifactIds.has(id));

      if (orphanTargets.length > 0) {
        gaps.push({
          artifact,
          issueType: 'orphan_link',
          details: `→ ${orphanTargets.join(', ')}`,
        });
      } else if (!hasOutgoing && !hasIncoming) {
        gaps.push({ artifact, issueType: 'unlinked' });
      } else if (!hasOutgoing) {
        gaps.push({ artifact, issueType: 'no_outgoing' });
      } else if (!hasIncoming) {
        gaps.push({ artifact, issueType: 'no_incoming' });
      }
    });

    return gaps;
  }, [allArtifacts, standaloneLinks]);

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

  // Computed totals
  const totalGaps = KIND_IDS.reduce((sum, t) => sum + stats[t].gaps, 0);
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
