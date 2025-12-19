/**
 * useTraceabilityData Hook
 *
 * Manages traceability data calculations including artifact unification,
 * link analysis, gap detection, and statistics.
 * Extracted from TraceabilityDashboard for better separation of concerns.
 */

import { useState, useMemo, useCallback } from 'react';
import type { Requirement, UseCase, TestCase, Information, Link } from '../../types';
import type { ArtifactType, UnifiedArtifact, GapInfo } from './types';

interface UseTraceabilityDataOptions {
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  standaloneLinks: Link[];
}

export function useTraceabilityData({
  requirements,
  useCases,
  testCases,
  information,
  standaloneLinks,
}: UseTraceabilityDataOptions) {
  // Multi-select type toggles - all selected by default
  const [selectedTypes, setSelectedTypes] = useState<Set<ArtifactType>>(
    new Set(['requirement', 'useCase', 'testCase', 'information'])
  );

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
    return artifacts;
  }, [requirements, useCases, testCases, information]);

  // Build all links set for bi-directional lookup
  const allLinksSet = useMemo(() => {
    const links = new Set<string>();
    allArtifacts.forEach((artifact) => {
      artifact.linkedArtifacts.forEach((link) => {
        links.add(artifact.id);
        links.add(link.targetId);
      });
    });
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

    return {
      requirement: calculateStats(allArtifacts.filter((a) => a.type === 'requirement')),
      useCase: calculateStats(allArtifacts.filter((a) => a.type === 'useCase')),
      testCase: calculateStats(allArtifacts.filter((a) => a.type === 'testCase')),
      information: calculateStats(allArtifacts.filter((a) => a.type === 'information')),
    };
  }, [allArtifacts, allLinksSet]);

  // Get gap artifacts with issue types
  const gapArtifacts = useMemo((): GapInfo[] => {
    const gaps: GapInfo[] = [];
    const artifactIds = new Set(allArtifacts.map((a) => a.id));

    const hasIncomingLink = new Set<string>();
    allArtifacts.forEach((artifact) => {
      artifact.linkedArtifacts.forEach((link) => {
        if (link.targetId) hasIncomingLink.add(link.targetId);
      });
    });

    allArtifacts.forEach((artifact) => {
      const hasOutgoing = artifact.linkedArtifacts.length > 0;
      const hasIncoming = hasIncomingLink.has(artifact.id);

      const orphanLinks = artifact.linkedArtifacts.filter(
        (link) => link.targetId && !artifactIds.has(link.targetId)
      );

      if (orphanLinks.length > 0) {
        gaps.push({
          artifact,
          issueType: 'orphan_link',
          details: `→ ${orphanLinks.map((l) => l.targetId).join(', ')}`,
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
  }, [allArtifacts]);

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

    const getTypeFromId = (id: string): ArtifactType => {
      if (id.startsWith('REQ-')) return 'requirement';
      if (id.startsWith('UC-')) return 'useCase';
      if (id.startsWith('TC-')) return 'testCase';
      if (id.startsWith('INFO-')) return 'information';
      return artifactTypeMap.get(id) || 'requirement';
    };

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

    allArtifacts.forEach((artifact) => {
      artifact.linkedArtifacts.forEach((link) => {
        if (link.type && link.targetId && artifactIds.has(link.targetId)) {
          links.push({
            sourceId: artifact.id,
            targetId: link.targetId,
            type: link.type,
            sourceType: artifact.type,
            targetType: artifactTypeMap.get(link.targetId) || 'requirement',
          });
        }
      });
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
    if (selectedTypes.size === 4) return gapArtifacts;
    return gapArtifacts.filter((gap) => selectedTypes.has(gap.artifact.type));
  }, [gapArtifacts, selectedTypes]);

  // Computed totals
  const totalGaps =
    stats.requirement.gaps + stats.useCase.gaps + stats.testCase.gaps + stats.information.gaps;
  const totalLinked =
    stats.requirement.linked +
    stats.useCase.linked +
    stats.testCase.linked +
    stats.information.linked;
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
