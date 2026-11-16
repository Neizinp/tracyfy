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
import type { ArtifactType, UnifiedArtifact, GapInfo } from './types';
import { ALL_TRACE_TYPES, traceTypeOf } from './types';

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
  const [selectedTypes, setSelectedTypes] = useState<Set<ArtifactType>>(new Set(ALL_TRACE_TYPES));

  // Toggle a type on/off
  const toggleType = useCallback((type: ArtifactType) => {
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
    const artifacts: UnifiedArtifact[] = [];
    requirements.forEach((r) =>
      artifacts.push({
        id: r.id,
        title: r.title,
        type: 'requirement',
        linkedArtifacts: r.linkedArtifacts || [],
      })
    );
    useCases.forEach((u) =>
      artifacts.push({
        id: u.id,
        title: u.title,
        type: 'useCase',
        linkedArtifacts: u.linkedArtifacts || [],
      })
    );
    testCases.forEach((t) =>
      artifacts.push({
        id: t.id,
        title: t.title,
        type: 'testCase',
        linkedArtifacts: t.linkedArtifacts || [],
      })
    );
    information.forEach((i) =>
      artifacts.push({
        id: i.id,
        title: i.title,
        type: 'information',
        linkedArtifacts: i.linkedArtifacts || [],
      })
    );
    risks.forEach((r) =>
      artifacts.push({ id: r.id, title: r.title, type: 'risk', linkedArtifacts: [] })
    );
    documents.forEach((d) =>
      artifacts.push({ id: d.id, title: d.title, type: 'document', linkedArtifacts: [] })
    );
    return artifacts;
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
      ALL_TRACE_TYPES.map((type) => [
        type,
        calculateStats(allArtifacts.filter((a) => a.type === type)),
      ])
    ) as Record<ArtifactType, { total: number; linked: number; gaps: number }>;
  }, [allArtifacts, allLinksSet]);

  // Get gap artifacts with issue types, from link files (legacy embedded
  // links are migrated to link files on load - see linkMigrationService).
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
      sourceType: ArtifactType;
      targetType: ArtifactType;
    }[] = [];
    const artifactTypeMap = new Map(allArtifacts.map((a) => [a.id, a.type]));
    const artifactIds = new Set(allArtifacts.map((a) => a.id));

    const getTypeFromId = (id: string): ArtifactType =>
      artifactTypeMap.get(id) ?? traceTypeOf(id) ?? 'requirement';

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

    testCases.forEach((tc) => {
      if (tc.requirementIds) {
        tc.requirementIds.forEach((reqId) => {
          if (artifactIds.has(reqId)) {
            links.push({
              sourceId: tc.id,
              targetId: reqId,
              type: 'verifies',
              sourceType: 'testCase',
              targetType: 'requirement',
            });
          }
        });
      }
    });

    return links;
  }, [allArtifacts, testCases, standaloneLinks]);

  // Filter gaps by selected types
  const filteredGaps = useMemo(() => {
    if (selectedTypes.size === ALL_TRACE_TYPES.length) return gapArtifacts;
    return gapArtifacts.filter((gap) => selectedTypes.has(gap.artifact.type));
  }, [gapArtifacts, selectedTypes]);

  // Computed totals
  const totalGaps = ALL_TRACE_TYPES.reduce((sum, t) => sum + stats[t].gaps, 0);
  const totalLinked = ALL_TRACE_TYPES.reduce((sum, t) => sum + stats[t].linked, 0);
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
