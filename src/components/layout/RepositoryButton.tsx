import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { sidebarButtonStyle } from './layoutStyles';

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
    <button onClick={onClick} style={sidebarButtonStyle} className="tf-nav">
      <Icon size={16} style={{ color: 'var(--color-text-muted)' }} />
      {label}
    </button>
  );
};
