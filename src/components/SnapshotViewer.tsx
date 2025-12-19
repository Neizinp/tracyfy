import React, { useEffect, useState } from 'react';
import { X, FileText, BookOpen, CheckSquare, Info, Loader } from 'lucide-react';
import { realGitService } from '../services/realGitService';
import type { Requirement, UseCase, TestCase, Information } from '../types';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface SnapshotViewerProps {
  isOpen: boolean;
  onClose: () => void;
  commitHash: string;
  baselineName: string;
  timestamp: number;
}

type Tab = 'requirements' | 'usecases' | 'testcases' | 'information';

export const SnapshotViewer: React.FC<SnapshotViewerProps> = ({
  isOpen,
  onClose,
  commitHash,
  baselineName,
  timestamp,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('requirements');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
  } | null>(null);

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

    const getDataForTab = () => {
      switch (activeTab) {
        case 'requirements':
          return data.requirements;
        case 'usecases':
          return data.useCases;
        case 'testcases':
          return data.testCases;
        case 'information':
          return data.information;
      }
    };

    const items = getDataForTab() || [];

    if (items.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No {activeTab} found in this snapshot.
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
              borderRadius: '6px',
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
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          width: '900px',
          maxWidth: '95%',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
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
                  borderRadius: '12px',
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
          {[
            { id: 'requirements', icon: FileText, label: 'Requirements' },
            { id: 'usecases', icon: BookOpen, label: 'Use Cases' },
            { id: 'testcases', icon: CheckSquare, label: 'Test Cases' },
            { id: 'information', icon: Info, label: 'Information' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
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
              {tab.label}
              {data && (
                <span
                  style={{
                    backgroundColor:
                      activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                    color: activeTab === tab.id ? 'white' : 'var(--color-text-muted)',
                    padding: '0 6px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {(() => {
                    switch (tab.id) {
                      case 'requirements':
                        return data.requirements.length;
                      case 'usecases':
                        return data.useCases.length;
                      case 'testcases':
                        return data.testCases.length;
                      case 'information':
                        return data.information.length;
                      default:
                        return 0;
                    }
                  })()}
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
