import type { CSSProperties } from 'react';

// Section header style used in sidebar
export const sectionHeaderStyle: CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.05em',
  margin: 0,
};

// Base style for nav links in sidebar
export const navLinkBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-sm)',
  padding: '8px 12px',
  textDecoration: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  textAlign: 'left',
};

// Inactive nav link style
export const navLinkInactiveStyle: CSSProperties = {
  ...navLinkBaseStyle,
  background: 'var(--color-bg-card)',
  color: 'var(--color-text-secondary)',
  fontWeight: 400,
};

// Active nav link style
export const navLinkActiveStyle: CSSProperties = {
  ...navLinkBaseStyle,
  background: 'var(--color-bg-hover)',
  color: 'var(--color-accent)',
  fontWeight: 500,
};

// Repository/sidebar button base style
export const sidebarButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-sm)',
  padding: '8px 12px',
  border: 'none',
  background: 'var(--color-bg-card)',
  color: 'var(--color-text-secondary)',
  borderRadius: '6px',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  width: '100%',
};

// Header action button style
export const headerButtonStyle: CSSProperties = {
  backgroundColor: 'var(--color-bg-card)',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border)',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-sm)',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'background-color 0.2s',
};

// Primary accent button style
export const primaryButtonStyle: CSSProperties = {
  backgroundColor: 'var(--color-accent)',
  color: 'white',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-sm)',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'background-color 0.2s',
};

// Dropdown container style
export const dropdownMenuStyle: CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: '0.5rem',
  backgroundColor: 'var(--color-bg-card)',
  border: '2px solid var(--color-border)',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
  zIndex: 100,
  minWidth: '180px',
  overflow: 'hidden',
};

// Dropdown menu item style
export const dropdownItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-sm)',
  width: '100%',
  padding: '0.75rem 1rem',
  border: 'none',
  background: 'var(--color-bg-card)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: '0.9rem',
};

// Dropdown item with top border
export const dropdownItemWithBorderStyle: CSSProperties = {
  ...dropdownItemStyle,
  borderTop: '1px solid var(--color-border)',
};

// Hover handlers for dropdown menu items
export const hoverHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.color = 'var(--color-text-primary)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.color = 'var(--color-text-primary)';
  },
};

// Hover handlers for sidebar buttons (with accent color)
export const sidebarHoverHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
    e.currentTarget.style.color = 'var(--color-accent)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = 'var(--color-text-secondary)';
  },
};
