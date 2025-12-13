import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { navLinkActiveStyle, navLinkInactiveStyle } from './layoutStyles';

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  /** Optional: custom style for the icon */
  iconStyle?: React.CSSProperties;
}

/**
 * Reusable navigation link component for the sidebar.
 * Automatically detects active state based on current route.
 * Supports URLs with query parameters (e.g., /path?tab=value).
 */
export const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, label, iconStyle }) => {
  const location = useLocation();

  // Parse the 'to' prop to separate pathname and search params
  const [toPathname, toSearch] = to.includes('?') ? to.split('?') : [to, ''];

  // Check if active: pathname must match, and if there's a search param in 'to', it must also match
  const pathnameMatches =
    location.pathname === toPathname || location.pathname.startsWith(toPathname + '/');
  const searchMatches = toSearch ? location.search === `?${toSearch}` : true;
  const isActive = pathnameMatches && searchMatches;

  return (
    <Link
      to={to}
      style={{
        ...(isActive ? navLinkActiveStyle : navLinkInactiveStyle),
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={(e) =>
        !isActive && (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
      }
      onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <Icon size={18} style={iconStyle} />
      {label}
    </Link>
  );
};
