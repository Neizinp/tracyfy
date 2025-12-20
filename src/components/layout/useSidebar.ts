/**
 * useSidebar Hook
 *
 * Manages sidebar state including:
 * - Resizable width with localStorage persistence
 * - Collapsible sections with localStorage persistence
 * - Remote sync state (push/pull)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { debug } from '../../utils/debug';
import { useFileSystem } from '../../app/providers';
import { realGitService } from '../../services/realGitService';
import type { SyncStatus } from '../../types';

const SIDEBAR_WIDTH_KEY = 'sidebar-width';
const COLLAPSED_SECTIONS_KEY = 'sidebar-collapsed-sections';
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 180;
const MAX_WIDTH = 400;

export function useSidebar() {
  const sidebarRef = useRef<HTMLElement>(null);

  // Width state with localStorage persistence
  const [width, setWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      return saved ? Math.min(Math.max(parseInt(saved, 10), MIN_WIDTH), MAX_WIDTH) : DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  });
  const [isResizing, setIsResizing] = useState(false);

  // Collapsed sections state with localStorage persistence
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Remote sync state
  const [hasRemote, setHasRemote] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isRemoteSettingsOpen, setIsRemoteSettingsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    ahead: false,
    behind: false,
    diverged: false,
  });

  // Check for remote on mount or when filesystem is ready
  const { isReady, refreshStatus, push, pull, hasRemote: checkHasRemote } = useFileSystem();

  // Function to check sync status
  const checkSyncStatus = useCallback(async () => {
    if (!realGitService.isInitialized()) {
      console.log('[useSidebar] Git not initialized, skipping sync status check');
      return;
    }
    try {
      console.log('[useSidebar] Checking sync status...');
      const status = await realGitService.getSyncStatus();
      console.log('[useSidebar] Sync status result:', JSON.stringify(status, null, 2));
      setSyncStatus(status);
    } catch (err) {
      console.error('[useSidebar] Failed to get sync status:', err);
    }
  }, []);

  useEffect(() => {
    if (isReady) {
      console.log('[useSidebar] FileSystem ready, checking for remote...');
      checkHasRemote().then((remote) => {
        console.log('[useSidebar] hasRemote:', remote);
        setHasRemote(remote);
        if (remote) {
          console.log('[useSidebar] Remote found, checking sync status...');
          checkSyncStatus();
        }
      });
    }
  }, [isReady, checkHasRemote, checkSyncStatus]);

  // Listen for git-check events to refresh status
  useEffect(() => {
    const handleGitCheck = () => {
      checkSyncStatus();
    };
    window.addEventListener('git-check', handleGitCheck);
    return () => window.removeEventListener('git-check', handleGitCheck);
  }, [checkSyncStatus]);

  // Listen for git-status-changed events (triggered after commits)
  useEffect(() => {
    const handleStatusChanged = () => {
      checkSyncStatus();
    };
    window.addEventListener('git-status-changed', handleStatusChanged);
    return () => window.removeEventListener('git-status-changed', handleStatusChanged);
  }, [checkSyncStatus]);

  // Poll sync status every 30 seconds to detect new commits
  useEffect(() => {
    if (!hasRemote) return;

    const interval = setInterval(() => {
      checkSyncStatus();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [hasRemote, checkSyncStatus]);

  // Save collapsed sections to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify([...collapsedSections]));
    } catch {
      // Ignore in test environment
    }
  }, [collapsedSections]);

  // Save width to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
    } catch {
      // Ignore in test environment
    }
  }, [width]);

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const handlePush = useCallback(async () => {
    setIsPushing(true);
    setSyncError(null);
    try {
      await push();
      debug.log('[Sidebar] Push successful');
      await checkSyncStatus(); // Refresh status after push
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Push failed');
    } finally {
      setIsPushing(false);
    }
  }, [push, checkSyncStatus]);

  const handlePull = useCallback(async () => {
    setIsPulling(true);
    setSyncError(null);
    try {
      const result = await pull();
      if (!result.success && result.conflicts.length > 0) {
        setSyncError(`Merge conflicts in: ${result.conflicts.join(', ')}`);
      } else {
        debug.log('[Sidebar] Pull successful');
        await checkSyncStatus(); // Refresh status after pull
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Pull failed');
    } finally {
      setIsPulling(false);
    }
  }, [pull, checkSyncStatus]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
      setWidth(newWidth);
    },
    [isResizing]
  );

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Attach/detach mouse listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const openRemoteSettings = useCallback(() => {
    setIsRemoteSettingsOpen(true);
  }, []);

  const closeRemoteSettings = useCallback(() => {
    setIsRemoteSettingsOpen(false);
    // Check remote status after settings close
    checkHasRemote().then(setHasRemote);
  }, [checkHasRemote]);

  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  return {
    // Refs
    sidebarRef,

    // Width/resize
    width,
    isResizing,
    startResizing,

    // Sections
    collapsedSections,
    toggleSection,

    // Remote sync
    hasRemote,
    isPushing,
    isPulling,
    syncError,
    clearSyncError,
    handlePush,
    handlePull,
    syncStatus,
    checkSyncStatus,

    // Remote settings modal
    isRemoteSettingsOpen,
    openRemoteSettings,
    closeRemoteSettings,

    // Filesystem status
    refreshStatus,
  };
}
