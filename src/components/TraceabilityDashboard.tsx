import React, { useState, useMemo, useEffect } from 'react';
import { Link2, CheckCircle2 } from 'lucide-react';
import type { Requirement, UseCase, TestCase, Information, Link, Project } from '../types';
import type { ArtifactType, UnifiedArtifact, GapInfo } from './traceability';
import { TYPE_COLORS, SummaryCard, GapItem, ImpactAnalysisPanel } from './traceability';
import { TraceabilityGraph } from './graph/TraceabilityGraph';
import { LinksView } from './LinksView';

type TabType = 'overview' | 'gaps' | 'links' | 'impact' | 'matrix' | 'graph';

interface TraceabilityDashboardProps {
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  standaloneLinks?: Link[]; // Links from the new Link entity system
  projects?: Project[]; // Projects for link scope display
  initialTab?: TabType; // Allow external control of initial tab
  onSelectArtifact?: (artifactId: string) => void;
  onAddLink?: (artifactId: string, artifactType: string) => void;
  onRemoveLink?: (artifactId: string, targetId: string) => void;
}

export const TraceabilityDashboard: React.FC<TraceabilityDashboardProps> = ({
  requirements,
  useCases,
  testCases,
  information,
  standaloneLinks = [],
  projects = [],
  initialTab = 'overview',
  onSelectArtifact,
  onAddLink,
  onRemoveLink,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Sync activeTab with initialTab when it changes (e.g., from URL navigation)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Multi-select type toggles - all selected by default
  const [selectedTypes, setSelectedTypes] = useState<Set<ArtifactType>>(
    new Set(['requirement', 'useCase', 'testCase', 'information'])
  );

  // Toggle a type on/off
  const toggleType = (type: ArtifactType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

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
    // Include legacy embedded links
    allArtifacts.forEach((artifact) => {
      artifact.linkedArtifacts.forEach((link) => {
        links.add(artifact.id);
        links.add(link.targetId);
      });
    });
    // Include standalone Link entities (new system)
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

    // Build incoming links set
    const hasIncomingLink = new Set<string>();
    allArtifacts.forEach((artifact) => {
      artifact.linkedArtifacts.forEach((link) => {
        if (link.targetId) hasIncomingLink.add(link.targetId);
      });
    });

    allArtifacts.forEach((artifact) => {
      const hasOutgoing = artifact.linkedArtifacts.length > 0;
      const hasIncoming = hasIncomingLink.has(artifact.id);

      // Check for orphan links (links to non-existent artifacts)
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
      linkId?: string; // Only for standalone links (deletable)
      sourceId: string;
      targetId: string;
      type: string;
      sourceType: ArtifactType;
      targetType: ArtifactType;
    }[] = [];
    const artifactTypeMap = new Map(allArtifacts.map((a) => [a.id, a.type]));
    const artifactIds = new Set(allArtifacts.map((a) => a.id));

    // Helper to determine artifact type from ID
    const getTypeFromId = (id: string): ArtifactType => {
      if (id.startsWith('REQ-')) return 'requirement';
      if (id.startsWith('UC-')) return 'useCase';
      if (id.startsWith('TC-')) return 'testCase';
      if (id.startsWith('INFO-')) return 'information';
      return artifactTypeMap.get(id) || 'requirement';
    };

    // Add standalone Link entities (new system)
    standaloneLinks.forEach((link) => {
      if (artifactIds.has(link.sourceId) && artifactIds.has(link.targetId)) {
        links.push({
          linkId: link.id, // Include ID for deletion
          sourceId: link.sourceId,
          targetId: link.targetId,
          type: link.type,
          sourceType: getTypeFromId(link.sourceId),
          targetType: getTypeFromId(link.targetId),
        });
      }
    });

    // Add links from linkedArtifacts (legacy embedded links)
    allArtifacts.forEach((artifact) => {
      artifact.linkedArtifacts.forEach((link) => {
        // Only include links with valid type and existing target
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

    // Also add legacy requirementIds from TestCases
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
    if (selectedTypes.size === 4) return gapArtifacts; // All types selected
    return gapArtifacts.filter((gap) => selectedTypes.has(gap.artifact.type));
  }, [gapArtifacts, selectedTypes]);

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
    color: isActive ? 'white' : 'var(--color-text-secondary)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: isActive ? 600 : 400,
    fontSize: 'var(--font-size-sm)',
    transition: 'all 0.15s',
  });

  const totalGaps =
    stats.requirement.gaps + stats.useCase.gaps + stats.testCase.gaps + stats.information.gaps;
  const totalLinked =
    stats.requirement.linked +
    stats.useCase.linked +
    stats.testCase.linked +
    stats.information.linked;
  const totalArtifacts = allArtifacts.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header with tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: 'var(--color-bg-tertiary)',
            padding: '4px',
            borderRadius: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={tabStyle(activeTab === 'overview')}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gaps')}
            style={tabStyle(activeTab === 'gaps')}
          >
            Gaps ({totalGaps})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('links')}
            style={tabStyle(activeTab === 'links')}
          >
            Links ({allLinks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('impact')}
            style={tabStyle(activeTab === 'impact')}
          >
            Impact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            style={tabStyle(activeTab === 'matrix')}
          >
            Matrix
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('graph')}
            style={tabStyle(activeTab === 'graph')}
          >
            Graph
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Overall stats */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-lg)',
              padding: 'var(--spacing-lg)',
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                {totalArtifacts}
              </div>
              <div
                style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}
              >
                Total Artifacts
              </div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 700,
                  color: 'var(--color-success-light)',
                }}
              >
                {totalLinked}
              </div>
              <div
                style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}
              >
                Linked
              </div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 700,
                  color: 'var(--color-warning-light)',
                }}
              >
                {totalGaps}
              </div>
              <div
                style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}
              >
                Gaps
              </div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                }}
              >
                {allLinks.length}
              </div>
              <div
                style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}
              >
                Links
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
            <SummaryCard
              title="Requirements"
              total={stats.requirement.total}
              linked={stats.requirement.linked}
              gaps={stats.requirement.gaps}
              color={TYPE_COLORS.requirement}
              onViewGaps={() => {
                setSelectedTypes(new Set(['requirement']));
                setActiveTab('gaps');
              }}
            />
            <SummaryCard
              title="Use Cases"
              total={stats.useCase.total}
              linked={stats.useCase.linked}
              gaps={stats.useCase.gaps}
              color={TYPE_COLORS.useCase}
              onViewGaps={() => {
                setSelectedTypes(new Set(['useCase']));
                setActiveTab('gaps');
              }}
            />
            <SummaryCard
              title="Test Cases"
              total={stats.testCase.total}
              linked={stats.testCase.linked}
              gaps={stats.testCase.gaps}
              color={TYPE_COLORS.testCase}
              onViewGaps={() => {
                setSelectedTypes(new Set(['testCase']));
                setActiveTab('gaps');
              }}
            />
            <SummaryCard
              title="Information"
              total={stats.information.total}
              linked={stats.information.linked}
              gaps={stats.information.gaps}
              color={TYPE_COLORS.information}
              onViewGaps={() => {
                setSelectedTypes(new Set(['information']));
                setActiveTab('gaps');
              }}
            />
          </div>

          {/* Quick Links Legend */}
          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-bg-tertiary)',
              borderRadius: '8px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Link2 size={14} />
                <strong>Tip:</strong>
              </div>
              <span>
                Click on "gaps" counts to see unlinked artifacts. Use the Links tab to view all
                relationships.
              </span>
            </div>
          </div>
        </>
      )}

      {/* Gaps Tab */}
      {activeTab === 'gaps' && (
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            padding: 'var(--spacing-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 'var(--font-size-lg)',
                color: 'var(--color-text-primary)',
              }}
            >
              Unlinked Artifacts ({filteredGaps.length})
            </h3>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { type: 'useCase' as ArtifactType, label: 'UC', color: TYPE_COLORS.useCase.text },
                {
                  type: 'requirement' as ArtifactType,
                  label: 'REQ',
                  color: TYPE_COLORS.requirement.text,
                },
                { type: 'testCase' as ArtifactType, label: 'TC', color: TYPE_COLORS.testCase.text },
                {
                  type: 'information' as ArtifactType,
                  label: 'INFO',
                  color: TYPE_COLORS.information.text,
                },
              ].map(({ type, label, color }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: selectedTypes.has(type)
                      ? `2px solid ${color}`
                      : '2px solid var(--color-border)',
                    backgroundColor: selectedTypes.has(type) ? `${color}20` : 'transparent',
                    color: selectedTypes.has(type) ? color : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {filteredGaps.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--color-text-muted)',
              }}
            >
              <CheckCircle2
                size={48}
                style={{ marginBottom: '12px', color: 'var(--color-success-light)' }}
              />
              <p>All artifacts are linked!</p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
              {filteredGaps.map((gap) => (
                <GapItem
                  key={gap.artifact.id}
                  gap={gap}
                  onClick={onSelectArtifact ? () => onSelectArtifact(gap.artifact.id) : undefined}
                  onAddLink={
                    onAddLink ? () => onAddLink(gap.artifact.id, gap.artifact.type) : undefined
                  }
                  onRemoveOrphan={
                    gap.issueType === 'orphan_link' && onRemoveLink && gap.details
                      ? () => {
                          // Extract first orphan target from details (format: "→ TARGET-ID")
                          const orphanTarget = gap.details?.replace('→ ', '').split(',')[0].trim();
                          if (orphanTarget) onRemoveLink(gap.artifact.id, orphanTarget);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Links Tab - Using LinksView component with edit functionality */}
      {activeTab === 'links' && (
        <LinksView
          onNavigateToArtifact={(id, _type) => {
            if (onSelectArtifact) onSelectArtifact(id);
          }}
          projects={projects}
        />
      )}

      {/* Impact Tab */}
      {activeTab === 'impact' && (
        <ImpactAnalysisPanel
          artifacts={allArtifacts}
          links={standaloneLinks}
          onSelectArtifact={onSelectArtifact}
        />
      )}

      {/* Matrix Tab */}
      {activeTab === 'matrix' &&
        (() => {
          const MAX_MATRIX_SIZE = 20;
          const unsortedArtifacts =
            selectedTypes.size === 4
              ? allArtifacts
              : allArtifacts.filter((a) => selectedTypes.has(a.type));

          // Type priority order: useCase, requirement, testCase, information
          const typeOrder: Record<string, number> = {
            useCase: 0,
            requirement: 1,
            testCase: 2,
            information: 3,
          };

          // Sort by type priority first, then by ID numerically within each type
          const matrixArtifacts = [...unsortedArtifacts]
            .sort((a, b) => {
              const typeCompare = (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
              if (typeCompare !== 0) return typeCompare;
              return a.id.localeCompare(b.id, undefined, { numeric: true });
            })
            .slice(0, MAX_MATRIX_SIZE);

          // Build link map for quick lookup (bidirectional)
          const linkMap = new Map<string, Map<string, string>>();
          allLinks.forEach((link) => {
            // Forward direction
            if (!linkMap.has(link.sourceId)) linkMap.set(link.sourceId, new Map());
            linkMap.get(link.sourceId)!.set(link.targetId, link.type);

            // Reverse direction (for mirroring across diagonal)
            if (!linkMap.has(link.targetId)) linkMap.set(link.targetId, new Map());
            if (!linkMap.get(link.targetId)!.has(link.sourceId)) {
              // Add reverse with indicator (arrow pointing back)
              linkMap.get(link.targetId)!.set(link.sourceId, `←${link.type}`);
            }
          });

          const getLinkSymbol = (
            fromId: string,
            toId: string
          ): { symbol: string; color: string; isReverse?: boolean } | null => {
            if (fromId === toId) return { symbol: '●', color: 'var(--color-text-muted)' };
            const type = linkMap.get(fromId)?.get(toId);
            if (!type) return null;

            // Check if this is a reverse (incoming) link
            const isReverse = type.startsWith('←');
            const actualType = isReverse ? type.substring(1) : type;

            const symbols: Record<string, { symbol: string; color: string }> = {
              parent: { symbol: '↑', color: '#3b82f6' },
              child: { symbol: '↓', color: '#3b82f6' },
              depends_on: { symbol: '◆', color: '#f59e0b' },
              dependency_of: { symbol: '◇', color: '#f59e0b' },
              related_to: { symbol: '↔', color: '#8b5cf6' },
              satisfies: { symbol: '✓', color: '#22c55e' },
              satisfied_by: { symbol: '✓', color: '#22c55e' },
              verifies: { symbol: '✔', color: '#10b981' },
              verified_by: { symbol: '✔', color: '#10b981' },
              implements: { symbol: '▸', color: '#06b6d4' },
              implemented_by: { symbol: '◂', color: '#06b6d4' },
              references: { symbol: '→', color: '#6366f1' },
              referenced_by: { symbol: '←', color: '#6366f1' },
            };
            const result = symbols[actualType] || {
              symbol: '•',
              color: 'var(--color-text-secondary)',
            };
            return { ...result, isReverse };
          };

          return (
            <div
              style={{
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                padding: 'var(--spacing-md)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 'var(--font-size-lg)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Traceability Matrix
                </h3>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    {
                      type: 'useCase' as ArtifactType,
                      label: 'UC',
                      color: TYPE_COLORS.useCase.text,
                    },
                    {
                      type: 'requirement' as ArtifactType,
                      label: 'REQ',
                      color: TYPE_COLORS.requirement.text,
                    },
                    {
                      type: 'testCase' as ArtifactType,
                      label: 'TC',
                      color: TYPE_COLORS.testCase.text,
                    },
                    {
                      type: 'information' as ArtifactType,
                      label: 'INFO',
                      color: TYPE_COLORS.information.text,
                    },
                  ].map(({ type, label, color }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: selectedTypes.has(type)
                          ? `2px solid ${color}`
                          : '2px solid var(--color-border)',
                        backgroundColor: selectedTypes.has(type) ? `${color}20` : 'transparent',
                        color: selectedTypes.has(type) ? color : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {matrixArtifacts.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-xl)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  No artifacts to display in the matrix.
                </div>
              ) : (
                <>
                  {allArtifacts.length > MAX_MATRIX_SIZE && selectedTypes.size === 4 && (
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'rgba(234, 179, 8, 0.1)',
                        borderRadius: '6px',
                        marginBottom: 'var(--spacing-md)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-warning-light)',
                      }}
                    >
                      Showing first {MAX_MATRIX_SIZE} of {allArtifacts.length} artifacts. Use the
                      toggles to narrow down.
                    </div>
                  )}

                  <div style={{ overflowX: 'auto' }}>
                    <table
                      style={{
                        borderCollapse: 'collapse',
                        fontSize: 'var(--font-size-xs)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              padding: '6px 8px',
                              backgroundColor: 'var(--color-bg-tertiary)',
                              border: '1px solid var(--color-border)',
                              fontWeight: 600,
                              textAlign: 'left',
                            }}
                          >
                            From / To
                          </th>
                          {matrixArtifacts.map((col) => (
                            <th
                              key={col.id}
                              style={{
                                padding: '6px 8px',
                                backgroundColor: TYPE_COLORS[col.type].bg,
                                border: '1px solid var(--color-border)',
                                fontWeight: 600,
                                color: TYPE_COLORS[col.type].text,
                                writingMode: 'vertical-rl',
                                textOrientation: 'mixed',
                                maxWidth: '30px',
                              }}
                              title={`${col.id}: ${col.title}`}
                            >
                              {col.id}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrixArtifacts.map((row) => (
                          <tr key={row.id}>
                            <td
                              style={{
                                padding: '6px 8px',
                                backgroundColor: TYPE_COLORS[row.type].bg,
                                border: '1px solid var(--color-border)',
                                fontWeight: 600,
                                color: TYPE_COLORS[row.type].text,
                              }}
                              title={`${row.id}: ${row.title}`}
                            >
                              {row.id}
                            </td>
                            {matrixArtifacts.map((col) => {
                              const link = getLinkSymbol(row.id, col.id);
                              return (
                                <td
                                  key={col.id}
                                  style={{
                                    padding: '4px',
                                    border: '1px solid var(--color-border)',
                                    textAlign: 'center',
                                    backgroundColor:
                                      row.id === col.id
                                        ? 'var(--color-bg-tertiary)'
                                        : 'transparent',
                                    cursor: link && row.id !== col.id ? 'pointer' : 'default',
                                  }}
                                  title={
                                    link && row.id !== col.id
                                      ? link.isReverse
                                        ? `${col.id} → ${row.id} (incoming)`
                                        : `${row.id} → ${col.id}`
                                      : ''
                                  }
                                >
                                  {link && (
                                    <span
                                      style={{
                                        color: link.color,
                                        fontWeight: 600,
                                        opacity: link.isReverse ? 0.5 : 1,
                                      }}
                                    >
                                      {link.symbol}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div
                    style={{
                      marginTop: 'var(--spacing-md)',
                      padding: 'var(--spacing-sm)',
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderRadius: '6px',
                      fontSize: 'var(--font-size-xs)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--spacing-sm)',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      Legend:
                    </span>
                    <span>
                      <span style={{ color: '#3b82f6' }}>↑↓</span> parent/child
                    </span>
                    <span>
                      <span style={{ color: '#22c55e' }}>✓</span> satisfies
                    </span>
                    <span>
                      <span style={{ color: '#10b981' }}>✔</span> verifies
                    </span>
                    <span>
                      <span style={{ color: '#8b5cf6' }}>↔</span> related
                    </span>
                    <span>
                      <span style={{ color: '#f59e0b' }}>◆</span> depends
                    </span>
                    <span>
                      <span style={{ color: '#6366f1' }}>→←</span> references
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })()}
      {activeTab === 'graph' && (
        <TraceabilityGraph
          artifacts={allArtifacts}
          links={allLinks}
          selectedTypes={selectedTypes}
          onSelectArtifact={onSelectArtifact}
          onToggleType={toggleType}
        />
      )}
    </div>
  );
};
