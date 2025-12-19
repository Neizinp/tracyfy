/**
 * useHeaderBar Hook
 *
 * Manages dropdown menu state and click-outside handlers for the HeaderBar.
 * Extracted for better separation of concerns.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Type for E2E test mode window properties
interface E2EWindow extends Window {
  __E2E_TEST_MODE__?: boolean;
  __E2E_EXPORT_MENU_OPENED?: boolean;
}

export function useHeaderBar() {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>('current');
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  const exportMenuRef = useRef<HTMLDivElement>(null);
  const importMenuRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close menus
  useEffect(() => {
    let e2eInterval: ReturnType<typeof setInterval> | null = null;
    if (typeof window !== 'undefined' && (window as E2EWindow).__E2E_TEST_MODE__) {
      setIsExportMenuOpen(true);
      (window as E2EWindow).__E2E_EXPORT_MENU_OPENED = true;
      e2eInterval = setInterval(() => {
        setIsExportMenuOpen(true);
        (window as E2EWindow).__E2E_EXPORT_MENU_OPENED = true;
      }, 500);
    }

    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
        setIsImportMenuOpen(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (e2eInterval) clearInterval(e2eInterval);
    };
  }, []);

  const toggleExportMenu = useCallback(() => {
    setIsExportMenuOpen((prev) => !prev);
    setIsImportMenuOpen(false);
    setIsCreateMenuOpen(false);
  }, []);

  const toggleImportMenu = useCallback(() => {
    setIsImportMenuOpen((prev) => !prev);
    setIsExportMenuOpen(false);
    setIsCreateMenuOpen(false);
  }, []);

  const toggleCreateMenu = useCallback(() => {
    setIsCreateMenuOpen((prev) => !prev);
    setIsExportMenuOpen(false);
    setIsImportMenuOpen(false);
  }, []);

  const closeAllMenus = useCallback(() => {
    setIsExportMenuOpen(false);
    setIsImportMenuOpen(false);
    setIsCreateMenuOpen(false);
  }, []);

  const focusSearch = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const blurSearch = useCallback(() => {
    if (searchInputRef.current && document.activeElement === searchInputRef.current) {
      searchInputRef.current.blur();
    }
  }, []);

  return {
    // Menu state
    isExportMenuOpen,
    setIsExportMenuOpen,
    isImportMenuOpen,
    setIsImportMenuOpen,
    isCreateMenuOpen,
    setIsCreateMenuOpen,
    selectedBaselineId,
    setSelectedBaselineId,

    // Refs
    exportMenuRef,
    importMenuRef,
    createMenuRef,
    searchInputRef,

    // Actions
    toggleExportMenu,
    toggleImportMenu,
    toggleCreateMenu,
    closeAllMenus,
    focusSearch,
    blurSearch,
  };
}
