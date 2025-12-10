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
 */
export const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, label, iconStyle }) => {
  const location = useLocation();
  const isActive = location.pathname.includes(to);

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
