import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const THEME_STORAGE_KEY = 'theme-preference';

export type Theme = 'light' | 'dark';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // localStorage not available (e.g., in tests)
    }
    // Default to dark (current app appearance)
    return 'dark';
  });

  useEffect(() => {
    // Apply theme to document
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    // Persist preference
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage not available (e.g., in tests)
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="tf-btn"
      style={{
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-md)',
        border: '1px solid transparent',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
      }}
    >
      {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
};
