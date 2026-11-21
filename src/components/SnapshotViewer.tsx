import React, { useEffect, useState } from 'react';
import { X, FileText, BookOpen, CheckSquare, Info, Loader } from 'lucide-react';
import { realGitService } from '../services/realGitService';
import type { ProjectSnapshot } from '../services/git/gitHistoryService';
import type { Requirement, UseCase, TestCase, Information } from '../types';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { kind } from '../domain/artifactKinds';

interface SnapshotViewerProps {
  isOpen: boolean;
  onClose: () => void;
  commitHash: string;
  baselineName: string;
  timestamp: number;
}

type Tab = 'requirement' | 'useCase' | 'testCase' | 'information';

const TABS: { id: Tab; icon: typeof FileText }[] = [
  { id: 'requirement', icon: FileText },
  { id: 'useCase', icon: BookOpen },
  { id: 'testCase', icon: CheckSquare },
  { id: 'information', icon: Info },
];

export const SnapshotViewer: React.FC<SnapshotViewerProps> = ({
  isOpen,
  onClose,
  commitHash,
  baselineName,
  timestamp,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('requirement');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProjectSnapshot | null>(null);

  useKeyboardShortcuts({
    onClose: onClose,
  });

  useEffect(() => {
    const loadSnapshot = async () => {
      setLoading(true);
      try {
        const snapshot = await realGitService.loadProjectSnapshot(commitHash);
        setData(snapshot);
      } catch (error) {
        console.error('Failed to load snapshot:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      if (commitHash) {
        loadSnapshot();
      } else {
        setLoading(false);
      }
    }
  }, [isOpen, commitHash]);

  if (!isOpen) return null;

  const itemsOf = (tab: Tab): (Requirement | UseCase | TestCase | Information)[] => {
    if (!data) return [];
    return data.artifacts[tab] as (Requirement | UseCase | TestCase | Information)[];
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--color-text-muted)',
          }}
        >
          <Loader className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
          <p>Loading snapshot data...</p>
        </div>
      );
    }

    if (!commitHash) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-danger)' }}>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>Snapshot Not Found</p>
          <p style={{ fontSize: 'var(--font-size-sm)' }}>
            Could not identify the commit hash for this baseline. The baseline might be created
            before tracking was fully initialized.
          </p>
        </div>
      );
    }

    if (!data)
      return <div style={{ padding: '20px', textAlign: 'center' }}>Failed to load data</div>;

    const items = itemsOf(activeTab);

    if (items.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No {kind(activeTab).label.plural.toLowerCase()} found in this snapshot.
        </div>
      );
    }

    // Sort by ID naturally
    const sortedItems = [...items].sort((a, b) =>
      a.id.localeCompare(b.id, undefined, { numeric: true })
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedItems.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '16px',
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>
                {item.title}
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {item.id}
              </span>
            </div>
            {/* Description/Text rendering based on type */}
            <div
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {'text' in item && item.text
                ? item.text
                : 'description' in item
                  ? item.description || ''
                  : ''}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-bg-overlay, #222)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100, // Higher than other modals
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-app)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          width: '900px',
          maxWidth: '95%',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-popover)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-bg-subtle)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>
                Snapshot: {baselineName}
              </h2>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-info-bg)',
                  color: 'var(--color-info-light)',
                  fontSize: 'var(--font-size-xs)',
                  border: '1px solid var(--color-info-border)',
                  fontFamily: 'monospace',
                }}
              >
                {commitHash.substring(0, 7)}
              </span>
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
                marginTop: '4px',
              }}
            >
              {new Date(timestamp).toLocaleString()} • Read-only View
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: activeTab === tab.id ? 'var(--color-bg-app)' : 'transparent',
                border: 'none',
                borderBottom:
                  activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <tab.icon size={18} />
              {kind(tab.id).label.plural}
              {data && (
                <span
                  style={{
                    backgroundColor:
                      activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                    color: activeTab === tab.id ? 'white' : 'var(--color-text-muted)',
                    padding: '0 6px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '10px',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {itemsOf(tab.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
