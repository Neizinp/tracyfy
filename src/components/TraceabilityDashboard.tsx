/**
 * TraceabilityDashboard Component
 *
 * Provides overview, gap analysis, links, impact, matrix, and graph views.
 * Uses useTraceabilityData hook for data calculations.
 */

import React, { useState, useEffect } from 'react';
import { Link2, CheckCircle2 } from 'lucide-react';
import type { Requirement, UseCase, TestCase, Information, Link, Project } from '../types';
import type { ArtifactType } from './traceability';
import {
  TYPE_COLORS,
  SummaryCard,
  GapItem,
  ImpactAnalysisPanel,
  useTraceabilityData,
} from './traceability';
import { TraceabilityGraph } from './graph/TraceabilityGraph';
import { LinksView } from './LinksView';
import { useUI } from '../app/providers';

type TabType = 'overview' | 'gaps' | 'links' | 'impact' | 'matrix' | 'graph';

// Separate component for Links tab to access useUI hook
const LinksTabContent: React.FC<{
  onSelectArtifact?: (artifactId: string) => void;
  projects: Project[];
}> = ({ onSelectArtifact, projects }) => {
  const { setIsLinkModalOpen } = useUI();

  return (
    <LinksView
      onNavigateToArtifact={(id) => {
        if (onSelectArtifact) onSelectArtifact(id);
      }}
      projects={projects}
      onAdd={() => setIsLinkModalOpen(true)}
    />
  );
};

interface TraceabilityDashboardProps {
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  standaloneLinks?: Link[];
  projects?: Project[];
  initialTab?: TabType;
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

  // Sync activeTab with initialTab when it changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Use the extracted hook for all data calculations
  const {
    selectedTypes,
    setSelectedTypes,
    toggleType,
    allArtifacts,
    stats,
    allLinks,
    filteredGaps,
    totalGaps,
    totalLinked,
    totalArtifacts,
  } = useTraceabilityData({
    requirements,
    useCases,
    testCases,
    information,
    standaloneLinks,
  });

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
            Links ({standaloneLinks.length})
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
                {standaloneLinks.length}
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
                Click on &quot;gaps&quot; counts to see unlinked artifacts. Use the Links tab to
                view all relationships.
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

      {/* Links Tab */}
      {activeTab === 'links' && (
        <LinksTabContent onSelectArtifact={onSelectArtifact} projects={projects} />
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
      {activeTab === 'matrix' && (
        <MatrixView
          allArtifacts={allArtifacts}
          allLinks={allLinks}
          selectedTypes={selectedTypes}
          toggleType={toggleType}
        />
      )}

      {/* Graph Tab */}
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

// Matrix view extracted as separate component for cleaner code
const MatrixView: React.FC<{
  allArtifacts: {
    id: string;
    title: string;
    type: ArtifactType;
    linkedArtifacts: { targetId: string; type: string }[];
  }[];
  allLinks: { sourceId: string; targetId: string; type: string }[];
  selectedTypes: Set<ArtifactType>;
  toggleType: (type: ArtifactType) => void;
}> = ({ allArtifacts, allLinks, selectedTypes, toggleType }) => {
  const MAX_MATRIX_SIZE = 20;
  const unsortedArtifacts =
    selectedTypes.size === 4 ? allArtifacts : allArtifacts.filter((a) => selectedTypes.has(a.type));

  const typeOrder: Record<string, number> = {
    useCase: 0,
    requirement: 1,
    testCase: 2,
    information: 3,
  };

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
    if (!linkMap.has(link.sourceId)) linkMap.set(link.sourceId, new Map());
    linkMap.get(link.sourceId)!.set(link.targetId, link.type);
    if (!linkMap.has(link.targetId)) linkMap.set(link.targetId, new Map());
    if (!linkMap.get(link.targetId)!.has(link.sourceId)) {
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
    const result = symbols[actualType] || { symbol: '•', color: 'var(--color-text-secondary)' };
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
              Showing first {MAX_MATRIX_SIZE} of {allArtifacts.length} artifacts. Use the toggles to
              narrow down.
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
                              row.id === col.id ? 'var(--color-bg-tertiary)' : 'transparent',
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
            <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Legend:</span>
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
};
