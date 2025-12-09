import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { sidebarButtonStyle, sidebarHoverHandlers } from './layoutStyles';

interface RepositoryButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}

/**
 * Reusable button component for the Repository section in the sidebar.
 * Includes hover effects with accent color styling.
 */
export const RepositoryButton: React.FC<RepositoryButtonProps> = ({
  onClick,
  icon: Icon,
  label,
}) => {
  return (
    <button onClick={onClick} style={sidebarButtonStyle} {...sidebarHoverHandlers}>
      <Icon size={18} />
      {label}
    </button>
  );
};
