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
import { useAppStore } from '../../state';

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

  // Remote sync: the state lives in the store; only the button states are local
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isRemoteSettingsOpen, setIsRemoteSettingsOpen] = useState(false);
  const hasRemote = useAppStore((s) => s.hasRemote);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const autoSync = useAppStore((s) => s.autoSync);
  const syncError = useAppStore((s) => s.syncError);
  const setSyncError = useAppStore((s) => s.setSyncError);
  const checkSyncStatus = useAppStore((s) => s.checkSync);
  const refreshStatus = useAppStore((s) => s.refreshStatus);
  const push = useAppStore((s) => s.push);
  const pull = useAppStore((s) => s.pull);

  // Commits made elsewhere (a colleague's push) only show up by asking again
  useEffect(() => {
    if (!hasRemote || autoSync) return;
    const interval = setInterval(() => void checkSyncStatus(), 30_000);
    return () => clearInterval(interval);
  }, [hasRemote, autoSync, checkSyncStatus]);

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
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Push failed');
    } finally {
      setIsPushing(false);
    }
  }, [push, setSyncError]);

  const handlePull = useCallback(async () => {
    setIsPulling(true);
    setSyncError(null);
    try {
      const result = await pull();
      if (!result.success && result.conflicts.length > 0) {
        setSyncError(`Merge conflicts in: ${result.conflicts.join(', ')}`);
      } else {
        debug.log('[Sidebar] Pull successful');
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Pull failed');
    } finally {
      setIsPulling(false);
    }
  }, [pull, setSyncError]);

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
    // A remote may have been added or removed
    void checkSyncStatus();
  }, [checkSyncStatus]);

  const clearSyncError = useCallback(() => setSyncError(null), [setSyncError]);

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
    autoSync,

    // Remote settings modal
    isRemoteSettingsOpen,
    openRemoteSettings,
    closeRemoteSettings,

    // Filesystem status
    refreshStatus,
  };
}
