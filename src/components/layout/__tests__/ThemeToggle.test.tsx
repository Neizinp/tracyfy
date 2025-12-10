import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle', () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
    });

    // Reset document theme attribute
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('initial rendering', () => {
    it('should render toggle button', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should default to dark mode when no localStorage value', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });

    it('should initialize to light mode when localStorage has light preference', () => {
      mockLocalStorage['theme-preference'] = 'light';

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should initialize to dark mode when localStorage has dark preference', () => {
      mockLocalStorage['theme-preference'] = 'dark';

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });

    it('should default to dark mode for invalid localStorage value', () => {
      mockLocalStorage['theme-preference'] = 'invalid-theme';

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    });
  });

  describe('theme toggling', () => {
    it('should toggle from dark to light mode when clicked', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');

      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should toggle from light to dark mode when clicked', () => {
      mockLocalStorage['theme-preference'] = 'light';

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');

      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });

    it('should toggle multiple times correctly', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');

      // Start in dark mode
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');

      // Toggle to light
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      // Toggle back to dark
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      expect(document.documentElement.getAttribute('data-theme')).toBeNull();

      // Toggle to light again
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('localStorage persistence', () => {
    it('should save dark preference to localStorage', () => {
      mockLocalStorage['theme-preference'] = 'light';

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(localStorage.setItem).toHaveBeenCalledWith('theme-preference', 'dark');
    });

    it('should save light preference to localStorage', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(localStorage.setItem).toHaveBeenCalledWith('theme-preference', 'light');
    });

    it('should read preference from localStorage on mount', () => {
      mockLocalStorage['theme-preference'] = 'light';

      render(<ThemeToggle />);

      expect(localStorage.getItem).toHaveBeenCalledWith('theme-preference');
    });
  });

  describe('document attribute changes', () => {
    it('should set data-theme="light" when in light mode', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should remove data-theme attribute when in dark mode', () => {
      mockLocalStorage['theme-preference'] = 'light';

      render(<ThemeToggle />);

      // Verify light mode is active
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Dark mode should remove the attribute
      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should have accessible title in dark mode', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Switch to light mode');
    });

    it('should have accessible title in light mode', () => {
      mockLocalStorage['theme-preference'] = 'light';

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Switch to dark mode');
    });

    it('should update accessibility attributes after toggle', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      expect(button).toHaveAttribute('title', 'Switch to light mode');

      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      expect(button).toHaveAttribute('title', 'Switch to dark mode');
    });
  });
});
