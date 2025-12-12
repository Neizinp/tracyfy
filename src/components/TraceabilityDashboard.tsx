import React, { useState, useMemo } from 'react';
import { AlertTriangle, Link2, CheckCircle2, XCircle } from 'lucide-react';
import type { Requirement, UseCase, TestCase, Information, ArtifactLink } from '../types';

interface TraceabilityDashboardProps {
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  onSelectArtifact?: (artifactId: string) => void;
}

type ArtifactType = 'requirement' | 'useCase' | 'testCase' | 'information';

interface UnifiedArtifact {
  id: string;
  title: string;
  type: ArtifactType;
  linkedArtifacts: ArtifactLink[];
}

const TYPE_COLORS: Record<ArtifactType, { bg: string; border: string; text: string }> = {
  requirement: {
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.5)',
    text: '#3b82f6',
  },
  useCase: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.5)', text: '#8b5cf6' },
  testCase: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.5)', text: '#22c55e' },
  information: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.5)', text: '#eab308' },
};

// Summary Card Component
const SummaryCard: React.FC<{
  title: string;
  total: number;
  linked: number;
  gaps: number;
  color: { bg: string; border: string; text: string };
  onViewGaps?: () => void;
}> = ({ title, total, linked, gaps, color, onViewGaps }) => {
  const coverage = total > 0 ? Math.round((linked / total) * 100) : 0;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: `1px solid ${color.border}`,
        borderRadius: '8px',
        padding: 'var(--spacing-md)',
        flex: 1,
        minWidth: '200px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h3
          style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: color.text, margin: 0 }}
        >
          {title}
        </h3>
        <span
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          {total}
        </span>
      </div>

      {/* Coverage bar */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Coverage
          </span>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: color.text }}>
            {coverage}%
          </span>
        </div>
        <div
          style={{
            height: '8px',
            backgroundColor: 'var(--color-bg-tertiary)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${coverage}%`,
              backgroundColor: color.text,
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--color-success-light)',
          }}
        >
          <CheckCircle2 size={14} />
          <span>{linked} linked</span>
        </div>
        {gaps > 0 && (
          <button
            type="button"
            onClick={onViewGaps}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--color-warning-light)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <AlertTriangle size={14} />
            <span>{gaps} gaps</span>
          </button>
        )}
      </div>
    </div>
  );
};

type IssueType = 'no_outgoing' | 'no_incoming' | 'orphan_link' | 'unlinked';

interface GapInfo {
  artifact: UnifiedArtifact;
  issueType: IssueType;
  details?: string;
}

const ISSUE_LABELS: Record<IssueType, { label: string; color: string }> = {
  unlinked: { label: 'No links', color: 'var(--color-warning-light)' },
  no_outgoing: { label: 'No outgoing links', color: 'var(--color-warning-light)' },
  no_incoming: { label: 'No incoming links', color: 'var(--color-info-light, #60a5fa)' },
  orphan_link: { label: 'Orphan link', color: 'var(--color-error-light, #f87171)' },
};

// Gap Item Component
const GapItem: React.FC<{
  gap: GapInfo;
  onClick?: () => void;
}> = ({ gap, onClick }) => {
  const colors = TYPE_COLORS[gap.artifact.type];
  const issueInfo = ISSUE_LABELS[gap.issueType];

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        backgroundColor: colors.bg,
        borderRadius: '6px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.bg;
      }}
    >
      <XCircle size={16} style={{ color: issueInfo.color }} />
      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: colors.text }}>
        {gap.artifact.id}
      </span>
      <span
        style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', flex: 1 }}
      >
        {gap.artifact.title}
      </span>
      <span
        style={{
          fontSize: 'var(--font-size-xs)',
          padding: '2px 8px',
          backgroundColor: 'var(--color-bg-tertiary)',
          borderRadius: '4px',
          color: issueInfo.color,
          fontWeight: 500,
        }}
      >
        {issueInfo.label}
      </span>
      {gap.details && (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {gap.details}
        </span>
      )}
    </div>
  );
};

// Link Row Component
const LinkRow: React.FC<{
  sourceId: string;
  targetId: string;
  linkType: string;
  sourceType: ArtifactType;
  targetType: ArtifactType;
  onClickSource?: () => void;
  onClickTarget?: () => void;
}> = ({ sourceId, targetId, linkType, sourceType, targetType, onClickSource, onClickTarget }) => {
  const sourceColors = TYPE_COLORS[sourceType];
  const targetColors = TYPE_COLORS[targetType];

  return (
    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
      <td style={{ padding: '8px 12px' }}>
        <span
          onClick={onClickSource}
          style={{
            fontFamily: 'monospace',
            fontWeight: 600,
            color: sourceColors.text,
            cursor: onClickSource ? 'pointer' : 'default',
            padding: '2px 6px',
            backgroundColor: sourceColors.bg,
            borderRadius: '4px',
          }}
        >
          {sourceId}
        </span>
      </td>
      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
        <span
          style={{
            padding: '2px 8px',
            backgroundColor: 'var(--color-bg-tertiary)',
            borderRadius: '4px',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {(linkType || 'unknown').replace(/_/g, ' ')}
        </span>
      </td>
      <td style={{ padding: '8px 12px' }}>
        <span
          onClick={onClickTarget}
          style={{
            fontFamily: 'monospace',
            fontWeight: 600,
            color: targetColors.text,
            cursor: onClickTarget ? 'pointer' : 'default',
            padding: '2px 6px',
            backgroundColor: targetColors.bg,
            borderRadius: '4px',
          }}
        >
          {targetId}
        </span>
      </td>
    </tr>
  );
};

export const TraceabilityDashboard: React.FC<TraceabilityDashboardProps> = ({
  requirements,
  useCases,
  testCases,
  information,
  onSelectArtifact,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'gaps' | 'links'>('overview');
  const [selectedType, setSelectedType] = useState<ArtifactType | 'all'>('all');

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
    return links;
  }, [allArtifacts]);

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
      sourceId: string;
      targetId: string;
      type: string;
      sourceType: ArtifactType;
      targetType: ArtifactType;
    }[] = [];
    const artifactTypeMap = new Map(allArtifacts.map((a) => [a.id, a.type]));
    const artifactIds = new Set(allArtifacts.map((a) => a.id));

    // Add links from linkedArtifacts
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
  }, [allArtifacts, testCases]);

  // Filter links by selected type
  const filteredLinks = useMemo(() => {
    if (selectedType === 'all') return allLinks;
    return allLinks.filter((l) => l.sourceType === selectedType || l.targetType === selectedType);
  }, [allLinks, selectedType]);

  // Filter gaps by selected type
  const filteredGaps = useMemo(() => {
    if (selectedType === 'all') return gapArtifacts;
    return gapArtifacts.filter((gap) => gap.artifact.type === selectedType);
  }, [gapArtifacts, selectedType]);

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
        </div>

        {/* Type filter */}
        {(activeTab === 'gaps' || activeTab === 'links') && (
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ArtifactType | 'all')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <option value="all">All Types</option>
            <option value="requirement">Requirements</option>
            <option value="useCase">Use Cases</option>
            <option value="testCase">Test Cases</option>
            <option value="information">Information</option>
          </select>
        )}
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
                setSelectedType('requirement');
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
                setSelectedType('useCase');
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
                setSelectedType('testCase');
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
                setSelectedType('information');
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
          <h3
            style={{
              margin: '0 0 var(--spacing-md) 0',
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-primary)',
            }}
          >
            Unlinked Artifacts ({filteredGaps.length})
          </h3>
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
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Links Tab */}
      {activeTab === 'links' && (
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 'var(--font-size-lg)',
                color: 'var(--color-text-primary)',
              }}
            >
              All Links ({filteredLinks.length})
            </h3>
          </div>
          {filteredLinks.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--color-text-muted)',
              }}
            >
              <Link2 size={48} style={{ marginBottom: '12px' }} />
              <p>No links found for the selected filter.</p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <th
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Source
                    </th>
                    <th
                      style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Link Type
                    </th>
                    <th
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Target
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.map((link, index) => (
                    <LinkRow
                      key={`${link.sourceId}-${link.targetId}-${index}`}
                      sourceId={link.sourceId}
                      targetId={link.targetId}
                      linkType={link.type}
                      sourceType={link.sourceType}
                      targetType={link.targetType}
                      onClickSource={
                        onSelectArtifact ? () => onSelectArtifact(link.sourceId) : undefined
                      }
                      onClickTarget={
                        onSelectArtifact ? () => onSelectArtifact(link.targetId) : undefined
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
