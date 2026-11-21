/**
 * useHeaderBar Hook
 *
 * Manages dropdown menu state and click-outside handlers for the HeaderBar.
 * Extracted for better separation of concerns.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export function useHeaderBar() {
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  const importMenuRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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
    };
  }, []);

  const toggleImportMenu = useCallback(() => {
    setIsImportMenuOpen((prev) => !prev);
    setIsCreateMenuOpen(false);
  }, []);

  const toggleCreateMenu = useCallback(() => {
    setIsCreateMenuOpen((prev) => !prev);
    setIsImportMenuOpen(false);
  }, []);

  const closeAllMenus = useCallback(() => {
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
    isImportMenuOpen,
    setIsImportMenuOpen,
    isCreateMenuOpen,
    setIsCreateMenuOpen,

    // Refs
    importMenuRef,
    createMenuRef,
    searchInputRef,

    // Actions
    toggleImportMenu,
    toggleCreateMenu,
    closeAllMenus,
    focusSearch,
    blurSearch,
  };
}
