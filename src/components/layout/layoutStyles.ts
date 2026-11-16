import type { CSSProperties } from 'react';

// Section header style used in sidebar
export const sectionHeaderStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.06em',
  margin: 0,
  padding: '0 8px',
};

// Base style for nav links in sidebar (internal use only)
const navLinkBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  height: '30px',
  padding: '0 8px',
  textDecoration: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: 'var(--font-size-sm)',
  transition: 'background-color var(--transition-fast), color var(--transition-fast)',
};

// Inactive nav link style
export const navLinkInactiveStyle: CSSProperties = {
  ...navLinkBaseStyle,
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  fontWeight: 400,
};

// Active nav link style
export const navLinkActiveStyle: CSSProperties = {
  ...navLinkBaseStyle,
  background: 'var(--color-accent-bg)',
  color: 'var(--color-text-primary)',
  fontWeight: 500,
};

// Repository/sidebar button base style
export const sidebarButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  height: '30px',
  padding: '0 8px',
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  fontSize: 'var(--font-size-sm)',
  width: '100%',
};

// Header action button style: quiet until hovered
export const headerButtonStyle: CSSProperties = {
  height: '32px',
  color: 'var(--color-text-secondary)',
  border: '1px solid transparent',
  padding: '0 10px',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: 'var(--font-size-sm)',
  lineHeight: 1,
  transition: 'background-color var(--transition-fast), color var(--transition-fast)',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

// Primary accent button style
export const primaryButtonStyle: CSSProperties = {
  height: '32px',
  backgroundColor: 'var(--color-accent)',
  color: 'var(--color-on-accent)',
  border: 'none',
  padding: '0 12px',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: 'var(--font-size-sm)',
  lineHeight: 1,
  boxShadow: 'var(--shadow-popover)',
  transition: 'background-color var(--transition-fast)',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

// Dropdown container style
export const dropdownMenuStyle: CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: '6px',
  padding: '4px',
  backgroundColor: 'var(--color-bg-raised)',
  border: '1px solid var(--color-border-light)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-popover)',
  zIndex: 100,
  minWidth: '200px',
  overflow: 'hidden',
};

// Dropdown menu item style
export const dropdownItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  height: '32px',
  padding: '0 10px',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  background: 'transparent',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: 'var(--font-size-sm)',
};

// Dropdown item with a separator above it
export const dropdownItemWithBorderStyle: CSSProperties = {
  ...dropdownItemStyle,
  borderTop: '1px solid var(--color-border)',
  borderRadius: 0,
  marginTop: '4px',
  paddingTop: '4px',
  height: '36px',
};

// Hover handlers for dropdown menu items
export const hoverHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  },
};

// Hover handlers for sidebar buttons
export const sidebarHoverHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
    e.currentTarget.style.color = 'var(--color-text-primary)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = 'var(--color-text-secondary)';
  },
};

// Delete button - solid red background
export const deleteButtonStyle: CSSProperties = {
  height: '32px',
  padding: '0 12px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  backgroundColor: 'var(--color-error)',
  color: 'var(--color-on-accent)',
  cursor: 'pointer',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-xs)',
};

// Delete button - outline style
export const deleteButtonOutlineStyle: CSSProperties = {
  height: '32px',
  padding: '0 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  color: 'var(--color-error)',
  cursor: 'pointer',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-xs)',
};

// Empty state container style
export const emptyStateStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--spacing-xl)',
  color: 'var(--color-text-muted)',
  textAlign: 'center',
  gap: 'var(--spacing-md)',
};

// Empty state text style
export const emptyStateTextStyle: CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-secondary)',
  margin: 0,
};

// Unified Search Styles
export const searchContainerStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  maxWidth: '380px',
  height: '32px',
  backgroundColor: 'var(--color-bg-hover)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
  margin: '0',
};

export const searchInputStyle: CSSProperties = {
  width: '100%',
  height: '30px',
  padding: '0 40px 0 34px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  backgroundColor: 'transparent',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)',
  outline: 'none',
};

export const searchIconStyle: CSSProperties = {
  position: 'absolute',
  left: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--color-text-muted)',
  pointerEvents: 'none',
};

export const advancedSearchButtonStyle: CSSProperties = {
  position: 'absolute',
  right: '4px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'transparent',
  border: 'none',
  padding: '5px',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
};
