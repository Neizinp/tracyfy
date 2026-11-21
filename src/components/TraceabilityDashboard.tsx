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
import { notifyError, useAppStore } from '../state';

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
  const markLinkReviewed = useAppStore((s) => s.markLinkReviewed);

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

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'gaps', label: `Gaps (${totalGaps})` },
    { id: 'links', label: `Links (${standaloneLinks.length})` },
    { id: 'impact', label: 'Impact' },
    { id: 'matrix', label: 'Matrix' },
    { id: 'graph', label: 'Graph' },
  ];

  const stat = (value: number, label: string, tone: string) => (
    <div className="tf-dashboard-stat" data-tone={tone}>
      <div className="tf-dashboard-stat-value">{value}</div>
      <div className="tf-dashboard-stat-label">{label}</div>
    </div>
  );

  return (
    <div className="tf-dashboard">
      <div className="tf-dashboard-header">
        <div className="tf-dashboard-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className="tf-dashboard-tab"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="tf-dashboard-stats">
            {stat(totalArtifacts, 'Total Artifacts', 'primary')}
            {stat(totalLinked, 'Linked', 'success')}
            {stat(totalGaps, 'Gaps', 'warning')}
            {stat(standaloneLinks.length, 'Links', 'accent')}
          </div>

          {/* Summary Cards */}
          <div className="tf-dashboard-cards">
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

          <div className="tf-dashboard-tip">
            <span className="tf-dashboard-tip-label">
              <Link2 size={14} />
              <strong>Tip:</strong>
            </span>
            <span>
              Gaps are artifacts that break a traceability rule (see Traceability Rules), such as a
              requirement no test case verifies. Use the Links tab to view all relationships.
            </span>
          </div>
        </>
      )}

      {/* Gaps Tab */}
      {activeTab === 'gaps' && (
        <div className="tf-dashboard-gaps">
          <div className="tf-dashboard-gaps-header">
            <h3>Gaps ({filteredGaps.length})</h3>
            <TypeFilterButtons selectedTypes={selectedTypes} onToggle={toggleType} />
          </div>
          {filteredGaps.length === 0 ? (
            <div className="tf-dashboard-no-gaps">
              <CheckCircle2 size={48} />
              <p>No gaps: every traceability rule is met.</p>
            </div>
          ) : (
            <div className="tf-dashboard-gap-list">
              {filteredGaps.map((gap, i) => (
                <GapItem
                  key={`${gap.artifact.id}-${i}`}
                  gap={gap}
                  onClick={onSelectArtifact ? () => onSelectArtifact(gap.artifact.id) : undefined}
                  onAddLink={
                    onAddLink ? () => onAddLink(gap.artifact.id, gap.artifact.type) : undefined
                  }
                  onMarkReviewed={
                    gap.gap.issue === 'suspect'
                      ? () =>
                          markLinkReviewed((gap.gap as { linkId: string }).linkId).catch((err) =>
                            notifyError('Could not mark the link reviewed', err)
                          )
                      : undefined
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
