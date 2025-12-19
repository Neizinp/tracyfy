import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudUpload, CloudDownload, AlertCircle, RefreshCw } from 'lucide-react';
import { realGitService } from '../../services/realGitService';
import type { SyncStatus, CommitInfo } from '../../types';
import { headerButtonStyle } from './layoutStyles';
import { debug } from '../../utils/debug';

export const GitSyncStatus: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>({
    ahead: false,
    behind: false,
    diverged: false,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasRemote, setHasRemote] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const checkStatus = useCallback(async () => {
    if (!realGitService.isInitialized()) return;

    // Check if remote exists
    const remotes = await realGitService.getRemotes();
    const remoteExists = remotes.length > 0;
    setHasRemote(remoteExists);

    if (!remoteExists) return;

    const newStatus = await realGitService.getSyncStatus();
    setStatus(newStatus);
  }, []);

  useEffect(() => {
    checkStatus();

    // Listen for manual check requests
    const handleManualCheck = () => {
      debug.log('[GitSyncStatus] Manual check requested');
      checkStatus();
    };
    window.addEventListener('git-check', handleManualCheck);

    // Poll every 2 minutes
    const interval = setInterval(checkStatus, 120000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('git-check', handleManualCheck);
    };
  }, [checkStatus]);

  // Handle outside click to close details
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSync = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      debug.log('[GitSyncStatus] Starting sync...');
      // 1. Fetch
      await realGitService.fetch();

      // 2. If behind, pull
      const currentStatus = await realGitService.getSyncStatus();
      if (currentStatus.behind || currentStatus.diverged) {
        await realGitService.pull();
      }

      // 3. If ahead, push
      if (currentStatus.ahead) {
        await realGitService.push();
      }

      await checkStatus();
      debug.log('[GitSyncStatus] Sync complete');
      setShowDetails(false);
    } catch (error) {
      console.error('[GitSyncStatus] Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!hasRemote) return null;

  const getIcon = () => {
    if (status.diverged)
      return (
        <AlertCircle
          size={18}
          className="text-error"
          color="var(--color-error)"
          data-testid="sync-icon-diverged"
        />
      );
    if (status.ahead && status.behind)
      return <RefreshCw size={18} data-testid="sync-icon-diverged" />;
    if (status.ahead)
      return <CloudUpload size={18} color="var(--color-accent)" data-testid="sync-icon-ahead" />;
    if (status.behind)
      return <CloudDownload size={18} color="var(--color-accent)" data-testid="sync-icon-behind" />;
    return <Cloud size={18} color="var(--color-text-muted)" data-testid="sync-icon-synced" />;
  };

  const getTooltip = () => {
    if (status.diverged) return 'Local and remote have diverged. Manual resolution required.';
    if (status.ahead) return 'Local changes waiting to be pushed.';
    if (status.behind) return 'Remote changes available. Pull required.';
    return 'Synchronized with remote.';
  };

  const renderCommitList = (commits: CommitInfo[] | undefined, title: string) => {
    if (!commits || commits.length === 0) return null;
    return (
      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title} ({commits.length})
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            maxHeight: '160px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {commits.map((c) => (
            <div
              key={c.hash}
              style={{
                fontSize: '11px',
                padding: '6px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-bg-app)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--color-text-primary)',
                }}
              >
                {c.message}
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '10px', marginTop: '2px' }}>
                {c.author} • {new Date(c.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        disabled={isSyncing}
        style={{
          ...headerButtonStyle,
          gap: '6px',
          opacity: isSyncing ? 0.7 : 1,
          backgroundColor: showDetails ? 'var(--color-bg-hover)' : 'transparent',
        }}
        title={`${getTooltip()} (Click for details)`}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {getIcon()}
          {isSyncing && (
            <div
              style={{
                position: 'absolute',
                inset: -2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'spin 2s linear infinite',
              }}
            >
              <RefreshCw size={12} />
            </div>
          )}
        </div>
        <span style={{ fontSize: '12px' }}>
          {isSyncing
            ? 'Syncing...'
            : status.behind
              ? 'Update Avail.'
              : status.ahead
                ? 'Push Pending'
                : 'Synced'}
        </span>
      </button>

      {showDetails && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '300px',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            padding: '12px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
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
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Git Sync Details</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                data-testid="manual-refresh-button"
                onClick={async (e) => {
                  e.stopPropagation();
                  setIsSyncing(true);
                  try {
                    debug.log('[GitSyncStatus] Manual refresh (fetch) requested');
                    await realGitService.fetch();
                    await checkStatus();
                  } finally {
                    setIsSyncing(false);
                  }
                }}
                disabled={isSyncing}
                style={{
                  ...headerButtonStyle,
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-bg-hover)',
                }}
                title="Check for remote updates (Fetch)"
              >
                <RefreshCw size={14} className={isSyncing ? 'spin-animation' : ''} />
              </button>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                data-testid="sync-now-button"
                style={{
                  ...headerButtonStyle,
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  padding: '4px 8px',
                  fontSize: '11px',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>

          {!status.ahead && !status.behind && !status.diverged ? (
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                color: 'var(--color-text-muted)',
                fontSize: '12px',
              }}
            >
              Your repository is up to date.
            </div>
          ) : (
            <>
              {renderCommitList(status.behindCommits, 'Incoming (Pull)')}
              {renderCommitList(status.aheadCommits, 'Outgoing (Push)')}
            </>
          )}

          <div
            style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid var(--color-border)',
              fontSize: '10px',
              color: 'var(--color-text-muted)',
            }}
          >
            Polling every 2 minutes. Click Sync Now to refresh immediately.
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .text-error { color: var(--color-error); }
      `}</style>
    </div>
  );
};
