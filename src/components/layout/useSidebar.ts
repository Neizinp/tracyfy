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
import { realGitService } from '../../services/realGitService';
import { useFileSystem } from '../../app/providers';

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

  // Check for remote on mount or when filesystem is ready
  const { isReady, refreshStatus } = useFileSystem();
  useEffect(() => {
    if (isReady) {
      realGitService.hasRemote().then(setHasRemote);
    }
  }, [isReady]);

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
      await realGitService.push();
      debug.log('[Sidebar] Push successful');
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Push failed');
    } finally {
      setIsPushing(false);
    }
  }, []);

  const handlePull = useCallback(async () => {
    setIsPulling(true);
    setSyncError(null);
    try {
      const result = await realGitService.pull();
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
  }, []);

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
    realGitService.hasRemote().then(setHasRemote);
  }, []);

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

    // Remote settings modal
    isRemoteSettingsOpen,
    openRemoteSettings,
    closeRemoteSettings,

    // Filesystem status
    refreshStatus,
  };
}
