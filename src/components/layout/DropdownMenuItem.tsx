import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { dropdownItemStyle, dropdownItemWithBorderStyle } from './layoutStyles';

interface DropdownMenuItemProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  /** Show top border separator */
  showBorder?: boolean;
  /** Test ID for E2E tests */
  testId?: string;
}

/**
 * Reusable dropdown menu item component.
 * Used in Create, Import, and Export dropdown menus.
 */
export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  onClick,
  icon: Icon,
  label,
  showBorder = false,
  testId,
}) => {
  return (
    <button
      onClick={onClick}
      style={showBorder ? dropdownItemWithBorderStyle : dropdownItemStyle}
      data-testid={testId}
      className="tf-menu-item"
    >
      <Icon size={15} style={{ color: 'var(--color-text-muted)' }} />
      {label}
    </button>
  );
};
