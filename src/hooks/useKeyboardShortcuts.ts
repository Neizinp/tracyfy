import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onSave?: () => void;
  onClose?: () => void;
  onSearch?: () => void;
  onHelp?: () => void;
  // If true, will not prevent default browser behavior for these keys
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = ({
  onSave,
  onClose,
  onSearch,
  onHelp,
  preventDefault = true,
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Search: Cmd+K or Ctrl+K
      if (onSearch && (event.metaKey || event.ctrlKey) && event.key === 'k') {
        if (preventDefault) event.preventDefault();
        onSearch();
        return;
      }

      // Save: Cmd+S or Ctrl+S
      if (onSave && (event.metaKey || event.ctrlKey) && event.key === 's') {
        if (preventDefault) event.preventDefault();
        onSave();
        return;
      }

      // Close: Escape
      if (onClose && event.key === 'Escape') {
        if (preventDefault) event.preventDefault();
        onClose();
        return;
      }

      // Help: F1
      if (onHelp && event.key === 'F1') {
        if (preventDefault) event.preventDefault();
        onHelp();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onClose, onSearch, onHelp, preventDefault]);
};
