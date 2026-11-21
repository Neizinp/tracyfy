/**
 * TraceabilityDashboard Component
 *
 * Provides overview, gap analysis, links, impact, matrix, and graph views.
 * Uses useTraceabilityData hook for data calculations.
 */

import React, { useState, useEffect } from 'react';
import { Link2, CheckCircle2 } from 'lucide-react';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Risk,
  ArtifactDocument,
  Link,
} from '../types';
import {
  TypeFilterButtons,
  SummaryCard,
  GapItem,
  ImpactAnalysisPanel,
  useTraceabilityData,
  MatrixView,
} from './traceability';
import { TraceabilityGraph } from './graph/TraceabilityGraph';
import { ARTIFACT_KINDS, kind } from '../domain/artifactKinds';
import { LinksView } from './LinksView';
import { useAppStore } from '../state';

type TabType = 'overview' | 'gaps' | 'links' | 'impact' | 'matrix' | 'graph';

// Separate component for the Links tab, which opens the link dialog
const LinksTabContent: React.FC<{
  onSelectArtifact?: (artifactId: string) => void;
}> = ({ onSelectArtifact }) => {
  const openLinkDialog = useAppStore((s) => s.openLinkDialog);

  return (
    <LinksView
      onNavigateToArtifact={(id) => {
        if (onSelectArtifact) onSelectArtifact(id);
      }}
      onAdd={() => openLinkDialog(null)}
    />
  );
};

interface TraceabilityDashboardProps {
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  risks?: Risk[];
  documents?: ArtifactDocument[];
  standaloneLinks?: Link[];
  initialTab?: TabType;
  onSelectArtifact?: (artifactId: string) => void;
  onAddLink?: (artifactId: string, artifactType: string) => void;
  /** Removes the link with this ID (an orphan link) */
  onRemoveLink?: (linkId: string) => void;
}

export const TraceabilityDashboard: React.FC<TraceabilityDashboardProps> = ({
  requirements,
  useCases,
  testCases,
  information,
  risks = [],
  documents = [],
  standaloneLinks = [],
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
    risks,
    documents,
    standaloneLinks,
  });

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
    color: isActive ? 'white' : 'var(--color-text-secondary)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
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
            borderRadius: 'var(--radius-md)',
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
              borderRadius: 'var(--radius-md)',
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
            {ARTIFACT_KINDS.map(({ id: type, label: { plural: label } }) => (
              <SummaryCard
                key={type}
                title={label}
                total={stats[type].total}
                linked={stats[type].linked}
                gaps={stats[type].gaps}
                color={kind(type).color}
                onViewGaps={() => {
                  setSelectedTypes(new Set([type]));
                  setActiveTab('gaps');
                }}
              />
            ))}
          </div>

          {/* Quick Links Legend */}
          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-bg-tertiary)',
              borderRadius: 'var(--radius-md)',
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
                Gaps are artifacts that break a traceability rule (tracyfy.yaml), such as a
                requirement no test case verifies. Use the Links tab to view all relationships.
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
            borderRadius: 'var(--radius-md)',
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
              Gaps ({filteredGaps.length})
            </h3>
            <TypeFilterButtons selectedTypes={selectedTypes} onToggle={toggleType} />
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
              <p>No gaps: every traceability rule is met.</p>
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
              {filteredGaps.map((gap, i) => (
                <GapItem
                  key={`${gap.artifact.id}-${i}`}
                  gap={gap}
                  onClick={onSelectArtifact ? () => onSelectArtifact(gap.artifact.id) : undefined}
                  onAddLink={
                    onAddLink ? () => onAddLink(gap.artifact.id, gap.artifact.type) : undefined
                  }
                  onRemoveOrphan={
                    gap.gap.issue === 'orphan_link' && onRemoveLink
                      ? () => onRemoveLink((gap.gap as { linkId: string }).linkId)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Links Tab */}
      {activeTab === 'links' && <LinksTabContent onSelectArtifact={onSelectArtifact} />}

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
