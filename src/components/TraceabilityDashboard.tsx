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
  MatrixView,
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
