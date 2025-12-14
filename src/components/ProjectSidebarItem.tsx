import React from 'react';
import { FolderOpen } from 'lucide-react';
import type { Project } from '../types';

interface ProjectSidebarItemProps {
  project: Project;
  isActive: boolean;
  onSwitchProject: (id: string) => void;
  onOpenProjectSettings: (project: Project) => void;
}

export const ProjectSidebarItem: React.FC<ProjectSidebarItemProps> = ({
  project,
  isActive,
  onSwitchProject,
  onOpenProjectSettings,
}) => {
  const handleClick = () => {
    if (isActive) {
      onOpenProjectSettings(project);
    } else {
      onSwitchProject(project.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm)',
        backgroundColor: isActive ? 'var(--color-bg-hover)' : 'transparent',
        borderRadius: '6px',
        cursor: 'pointer',
        position: 'relative',
        border: '2px solid transparent',
        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        fontWeight: isActive ? 600 : 400,
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={(e) =>
        !isActive && (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
      }
      onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
      title={isActive ? 'Click to open settings' : 'Click to switch project'}
    >
      <FolderOpen size={18} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {project.name}
      </span>
    </div>
  );
};
