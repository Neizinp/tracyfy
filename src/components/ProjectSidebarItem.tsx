import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { FolderOpen, Settings } from 'lucide-react';
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
    onOpenProjectSettings
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `project-${project.id}`,
        data: {
            type: 'project-target',
            projectId: project.id,
            projectName: project.name
        }
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                padding: 'var(--spacing-sm)',
                backgroundColor: isOver
                    ? 'var(--color-bg-tertiary)'
                    : isActive
                        ? 'var(--color-bg-hover)'
                        : 'transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                position: 'relative',
                border: isOver ? '2px dashed var(--color-accent)' : '2px solid transparent'
            }}
            className="group"
        >
            <button
                onClick={() => onSwitchProject(project.id)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    border: 'none',
                    background: 'none',
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    flex: 1,
                    textAlign: 'left',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: isActive ? 600 : 400
                }}
            >
                <FolderOpen size={18} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.name}</span>
            </button>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenProjectSettings(project);
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isActive ? 1 : 0,
                    transition: 'opacity 0.2s'
                }}
                className="group-hover:opacity-100"
                title="Project Settings"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <Settings size={14} />
            </button>
        </div>
    );
};
