import React, { useState, useMemo } from 'react';
import { AlertTriangle, Link2, CheckCircle2, XCircle, Plus, Trash2 } from 'lucide-react';
import type { Requirement, UseCase, TestCase, Information, ArtifactLink } from '../types';

interface TraceabilityDashboardProps {
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  onSelectArtifact?: (artifactId: string) => void;
  onAddLink?: (artifactId: string, artifactType: string) => void;
  onRemoveLink?: (artifactId: string, targetId: string) => void;
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
  onAddLink?: () => void;
  onRemoveOrphan?: () => void;
}> = ({ gap, onClick, onAddLink, onRemoveOrphan }) => {
  const colors = TYPE_COLORS[gap.artifact.type];
  const issueInfo = ISSUE_LABELS[gap.issueType];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        backgroundColor: colors.bg,
        borderRadius: '6px',
        transition: 'background-color 0.15s',
      }}
    >
      <XCircle size={16} style={{ color: issueInfo.color }} />
      <span
        onClick={onClick}
        style={{
          fontFamily: 'monospace',
          fontWeight: 600,
          color: colors.text,
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
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
      {/* Quick action buttons */}
      {gap.issueType !== 'orphan_link' && onAddLink && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddLink();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: 'var(--font-size-xs)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
          title="Add a link to this artifact"
        >
          <Plus size={12} />
          Link
        </button>
      )}
      {gap.issueType === 'orphan_link' && onRemoveOrphan && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveOrphan();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            backgroundColor: 'var(--color-error-light, #f87171)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: 'var(--font-size-xs)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
          title="Remove the orphan link"
        >
          <Trash2 size={12} />
          Fix
        </button>
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
  onAddLink,
  onRemoveLink,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'gaps' | 'links' | 'impact' | 'matrix'>(
    'overview'
  );
  const [selectedType, setSelectedType] = useState<ArtifactType | 'all'>('all');
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

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

      {/* Impact Tab */}
      {activeTab === 'impact' && (
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
            Impact Analysis
          </h3>

          {/* Artifact Selector */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Select an artifact to see its connections:
            </label>
            <select
              value={selectedArtifactId || ''}
              onChange={(e) => setSelectedArtifactId(e.target.value || null)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <option value="">-- Select Artifact --</option>
              {allArtifacts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} - {a.title}
                </option>
              ))}
            </select>
          </div>

          {/* Impact Tree */}
          {selectedArtifactId &&
            (() => {
              const selectedArtifact = allArtifacts.find((a) => a.id === selectedArtifactId);
              if (!selectedArtifact) return null;

              // Get direct outgoing links from linkedArtifacts
              const outgoingLinks: { targetId: string; type: string }[] =
                selectedArtifact.linkedArtifacts
                  .filter((l) => l.targetId && allArtifacts.some((a) => a.id === l.targetId))
                  .map((l) => ({ targetId: l.targetId, type: l.type || 'related_to' }));

              // Also add legacy requirementIds from TestCases
              const selectedTestCase = testCases.find((tc) => tc.id === selectedArtifactId);
              if (selectedTestCase?.requirementIds) {
                selectedTestCase.requirementIds.forEach((reqId) => {
                  if (allArtifacts.some((a) => a.id === reqId)) {
                    outgoingLinks.push({ targetId: reqId, type: 'verifies' });
                  }
                });
              }

              // Get direct incoming links from linkedArtifacts
              const incomingLinks: { sourceId: string; type: string; sourceType: ArtifactType }[] =
                allArtifacts
                  .filter((a) => a.linkedArtifacts.some((l) => l.targetId === selectedArtifactId))
                  .map((a) => ({
                    sourceId: a.id,
                    type:
                      a.linkedArtifacts.find((l) => l.targetId === selectedArtifactId)?.type ||
                      'related_to',
                    sourceType: a.type,
                  }));

              // Also add TestCases that have this artifact in requirementIds
              if (selectedArtifact.type === 'requirement') {
                testCases.forEach((tc) => {
                  if (tc.requirementIds?.includes(selectedArtifactId)) {
                    // Only add if not already in incomingLinks
                    if (!incomingLinks.some((l) => l.sourceId === tc.id)) {
                      incomingLinks.push({
                        sourceId: tc.id,
                        type: 'verifies',
                        sourceType: 'testCase',
                      });
                    }
                  }
                });
              }

              const colors = TYPE_COLORS[selectedArtifact.type];

              return (
                <div style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>
                  {/* Selected artifact header */}
                  <div
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      backgroundColor: colors.bg,
                      border: `2px solid ${colors.border}`,
                      borderRadius: '6px',
                      marginBottom: 'var(--spacing-md)',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: colors.text }}>
                      {selectedArtifact.id}
                    </span>
                    <span style={{ marginLeft: '8px', color: 'var(--color-text-secondary)' }}>
                      {selectedArtifact.title}
                    </span>
                  </div>

                  {/* Outgoing links */}
                  {outgoingLinks.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <div
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted)',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Outgoing Links ({outgoingLinks.length})
                      </div>
                      {outgoingLinks.map((link) => {
                        const target = allArtifacts.find((a) => a.id === link.targetId);
                        if (!target) return null;
                        const targetColors = TYPE_COLORS[target.type];
                        return (
                          <div
                            key={link.targetId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 12px',
                              marginLeft: '16px',
                              borderLeft: '2px solid var(--color-border)',
                              cursor: 'pointer',
                            }}
                            onClick={() => setSelectedArtifactId(link.targetId)}
                          >
                            <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                            <span
                              style={{
                                padding: '2px 6px',
                                backgroundColor: 'var(--color-bg-tertiary)',
                                borderRadius: '4px',
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              {(link.type || 'related').replace(/_/g, ' ')}
                            </span>
                            <span
                              style={{
                                fontWeight: 600,
                                color: targetColors.text,
                                padding: '2px 6px',
                                backgroundColor: targetColors.bg,
                                borderRadius: '4px',
                              }}
                            >
                              {link.targetId}
                            </span>
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                              {target.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Incoming links */}
                  {incomingLinks.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted)',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Incoming Links ({incomingLinks.length})
                      </div>
                      {incomingLinks.map((link) => {
                        const source = allArtifacts.find((a) => a.id === link.sourceId);
                        if (!source) return null;
                        const sourceColors = TYPE_COLORS[source.type];
                        return (
                          <div
                            key={link.sourceId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 12px',
                              marginLeft: '16px',
                              borderLeft: '2px solid var(--color-border)',
                              cursor: 'pointer',
                            }}
                            onClick={() => setSelectedArtifactId(link.sourceId)}
                          >
                            <span style={{ color: 'var(--color-text-muted)' }}>←</span>
                            <span
                              style={{
                                padding: '2px 6px',
                                backgroundColor: 'var(--color-bg-tertiary)',
                                borderRadius: '4px',
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              {link.type.replace(/_/g, ' ')}
                            </span>
                            <span
                              style={{
                                fontWeight: 600,
                                color: sourceColors.text,
                                padding: '2px 6px',
                                backgroundColor: sourceColors.bg,
                                borderRadius: '4px',
                              }}
                            >
                              {link.sourceId}
                            </span>
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                              {source.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {outgoingLinks.length === 0 && incomingLinks.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: 'var(--spacing-lg)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      This artifact has no connections.
                    </div>
                  )}
                </div>
              );
            })()}

          {!selectedArtifactId && (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--color-text-muted)',
              }}
            >
              <Link2 size={48} style={{ marginBottom: '12px' }} />
              <p>Select an artifact above to explore its relationships.</p>
            </div>
          )}
        </div>
      )}

      {/* Matrix Tab */}
      {activeTab === 'matrix' &&
        (() => {
          const MAX_MATRIX_SIZE = 20;
          const matrixArtifacts =
            selectedType === 'all'
              ? allArtifacts.slice(0, MAX_MATRIX_SIZE)
              : allArtifacts.filter((a) => a.type === selectedType).slice(0, MAX_MATRIX_SIZE);

          // Build link map for quick lookup
          const linkMap = new Map<string, Map<string, string>>();
          allLinks.forEach((link) => {
            if (!linkMap.has(link.sourceId)) linkMap.set(link.sourceId, new Map());
            linkMap.get(link.sourceId)!.set(link.targetId, link.type);
          });

          const getLinkSymbol = (
            fromId: string,
            toId: string
          ): { symbol: string; color: string } | null => {
            if (fromId === toId) return { symbol: '●', color: 'var(--color-text-muted)' };
            const type = linkMap.get(fromId)?.get(toId);
            if (!type) return null;
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
            return symbols[type] || { symbol: '•', color: 'var(--color-text-secondary)' };
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
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ArtifactType | 'all')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  <option value="all">All Types (max {MAX_MATRIX_SIZE})</option>
                  <option value="requirement">Requirements</option>
                  <option value="useCase">Use Cases</option>
                  <option value="testCase">Test Cases</option>
                  <option value="information">Information</option>
                </select>
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
                  {allArtifacts.length > MAX_MATRIX_SIZE && selectedType === 'all' && (
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
                      filter to narrow down.
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
                                  title={link && row.id !== col.id ? `${row.id} → ${col.id}` : ''}
                                >
                                  {link && (
                                    <span style={{ color: link.color, fontWeight: 600 }}>
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
    </div>
  );
};
