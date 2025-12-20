import React, { useState, useEffect } from 'react';
import { X, Globe, Key, Check, AlertCircle, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { realGitService } from '../services/realGitService';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const AUTO_SYNC_KEY = 'tracyfy-auto-sync';

export interface RemoteSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemoteSettingsModal: React.FC<RemoteSettingsModalProps> = ({ isOpen, onClose }) => {
  const [remoteUrl, setRemoteUrl] = useState('');
  const [token, setToken] = useState('');
  const [existingRemotes, setExistingRemotes] = useState<{ name: string; url: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [autoSync, setAutoSync] = useState(() => {
    try {
      return localStorage.getItem(AUTO_SYNC_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Close modal on Escape key
  useKeyboardShortcuts({ onClose });

  // Load existing remotes on open
  useEffect(() => {
    if (isOpen) {
      loadRemotes();
      // Load saved token
      const savedToken = realGitService.getAuthToken();
      if (savedToken) {
        setToken(savedToken);
      }
    }
  }, [isOpen]);

  // Persist autoSync setting
  const handleAutoSyncChange = (enabled: boolean) => {
    setAutoSync(enabled);
    try {
      localStorage.setItem(AUTO_SYNC_KEY, String(enabled));
      // Dispatch event so sidebar can react
      window.dispatchEvent(new CustomEvent('auto-sync-changed', { detail: { enabled } }));
    } catch {
      // Ignore localStorage errors
    }
  };

  const loadRemotes = async () => {
    const remotes = await realGitService.getRemotes();
    setExistingRemotes(remotes);
    if (remotes.length > 0) {
      setRemoteUrl(remotes[0].url);
    }
  };

  const handleAddRemote = async () => {
    if (!remoteUrl.trim()) {
      setError('Please enter a remote URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Remove existing origin if any
      const hasOrigin = existingRemotes.some((r) => r.name === 'origin');
      if (hasOrigin) {
        await realGitService.removeRemote('origin');
      }

      // Add new remote
      await realGitService.addRemote('origin', remoteUrl.trim());

      // Save token if provided
      if (token.trim()) {
        await realGitService.setAuthToken(token.trim());
      }

      setSuccess('Remote added successfully!');
      await loadRemotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add remote');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!token.trim()) {
      setError('Please enter an authentication token');
      return;
    }

    setIsTesting(true);
    setError(null);
    setSuccess(null);

    try {
      // Save token first
      await realGitService.setAuthToken(token.trim());

      // Try to fetch
      await realGitService.fetch('origin');
      setSuccess('Connection successful!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleRemoveRemote = async (name: string) => {
    try {
      await realGitService.removeRemote(name);
      await realGitService.clearAuthToken();
      await loadRemotes();
      setRemoteUrl('');
      setToken('');
      setSuccess('Remote removed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove remote');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '12px',
          padding: 'var(--spacing-lg)',
          width: '500px',
          maxWidth: '90vw',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Globe size={20} />
            Remote Repository Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Support Alert */}
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            color: '#60a5fa',
            marginBottom: 'var(--spacing-md)',
            fontSize: 'var(--font-size-sm)',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong>Remote Sync Recommendation</strong>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>
              Native Git operations (Push/Pull) are best supported in the desktop app. If you are
              using the browser, we recommend switching to the Electron version for reliable
              synchronization.
            </p>
          </div>
        </div>

        {/* Existing remotes */}
        {existingRemotes.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                marginBottom: '4px',
                display: 'block',
              }}
            >
              Configured Remotes
            </label>
            {existingRemotes.map((remote) => (
              <div
                key={remote.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderRadius: '6px',
                  marginBottom: '4px',
                }}
              >
                <div>
                  <strong>{remote.name}</strong>
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {remote.url}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveRemote(remote.name)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-error)',
                    padding: '4px',
                  }}
                  title="Remove remote"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Remote URL input */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: '4px',
              display: 'block',
            }}
          >
            Remote URL
          </label>
          <input
            type="text"
            value={remoteUrl}
            onChange={(e) => setRemoteUrl(e.target.value)}
            placeholder="https://github.com/username/repo.git"
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
            }}
          />
        </div>

        {/* Token input */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: '4px',
              display: 'block',
            }}
          >
            <Key size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Personal Access Token (GitHub/GitLab)
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
            }}
          />
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              marginTop: '4px',
            }}
          >
            Token is stored securely using OS-level encryption in the desktop app.
          </div>
        </div>

        {/* Auto Sync Toggle */}
        {existingRemotes.length > 0 && (
          <div
            style={{
              marginBottom: 'var(--spacing-md)',
              padding: '12px',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} />
                Auto Sync
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  marginTop: '2px',
                }}
              >
                Automatically sync with remote after every commit
              </div>
            </div>
            <label
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '44px',
                height: '24px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => handleAutoSyncChange(e.target.checked)}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: autoSync ? 'var(--color-accent)' : 'var(--color-border)',
                  borderRadius: '24px',
                  transition: 'background-color 0.2s',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: autoSync ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: 'left 0.2s',
                }}
              />
            </label>
          </div>
        )}

        {/* Error/Success messages */}
        {error && (
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
              border: '1px solid var(--color-error)',
              borderRadius: '6px',
              color: 'var(--color-error)',
              marginBottom: 'var(--spacing-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
              border: '1px solid var(--color-success)',
              borderRadius: '6px',
              color: 'var(--color-success)',
              marginBottom: 'var(--spacing-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Check size={16} />
            {success}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !existingRemotes.length}
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text-primary)',
              cursor: isTesting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isTesting || !existingRemotes.length ? 0.6 : 1,
            }}
          >
            {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Test Connection
          </button>
          <button
            onClick={handleAddRemote}
            disabled={isLoading}
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--color-accent)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
            {existingRemotes.length > 0 ? 'Update Remote' : 'Add Remote'}
          </button>
        </div>
      </div>
    </div>
  );
};
