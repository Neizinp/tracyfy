import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutGrid, Plus, GitBranch, FileText, BookOpen, FlaskConical } from 'lucide-react';
import type { Project } from '../../types';
import { ProjectSidebarItem } from '../ProjectSidebarItem';
import { PendingChangesPanel } from '../PendingChangesPanel';
import { NavLink } from './NavLink';
import { RepositoryButton } from './RepositoryButton';
import { sectionHeaderStyle } from './layoutStyles';

const SIDEBAR_WIDTH_KEY = 'sidebar-width';
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 180;
const MAX_WIDTH = 400;

export interface SidebarProps {
  projects: Project[];
  currentProjectId: string;
  onSwitchProject: (projectId: string) => void;
  onCreateProject: () => void;
  onCreateDemoProject?: () => void;
  onOpenProjectSettings: (project: Project) => void;
  onOpenLibraryTab?: (tab: 'requirements' | 'usecases' | 'testcases' | 'information') => void;
}

/**
 * Sidebar component containing:
 * - App logo
 * - Projects list
 * - Pending Changes panel
 * - Views navigation
 * - Repository section
 */
export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  currentProjectId,
  onSwitchProject,
  onCreateProject,
  onCreateDemoProject,
  onOpenProjectSettings,
  onOpenLibraryTab,
}) => {
  const [width, setWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      return saved ? Math.min(Math.max(parseInt(saved, 10), MIN_WIDTH), MAX_WIDTH) : DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Save width to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
    } catch {
      // Ignore in test environment
    }
  }, [width]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
      setWidth(newWidth);
    },
    [isResizing]
  );

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Attach/detach mouse listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <aside
      ref={sidebarRef}
      style={{
        width: `${width}px`,
        minWidth: `${MIN_WIDTH}px`,
        maxWidth: `${MAX_WIDTH}px`,
        backgroundColor: 'var(--color-bg-sidebar)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Logo */}
      <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
          }}
        >
          <LayoutGrid size={24} color="var(--color-accent)" />
          Reqify
        </h1>
      </div>

      <nav style={{ flex: 1, padding: 'var(--spacing-md)', overflowY: 'auto' }}>
        {/* Projects Section */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            <h2 style={sectionHeaderStyle}>Projects</h2>
            <div style={{ display: 'flex', gap: '2px' }}>
              {onCreateDemoProject && (
                <button
                  onClick={onCreateDemoProject}
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
                  }}
                  title="Create Demo Project"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FlaskConical size={14} />
                </button>
              )}
              <button
                onClick={onCreateProject}
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
                }}
                title="New Project"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            {projects
              .filter((p) => !p.isDeleted)
              .map((project) => (
                <ProjectSidebarItem
                  key={project.id}
                  project={project}
                  isActive={project.id === currentProjectId}
                  onSwitchProject={onSwitchProject}
                  onOpenProjectSettings={onOpenProjectSettings}
                />
              ))}
          </div>
        </div>

        {/* Pending Changes Section */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2
            style={{
              ...sectionHeaderStyle,
              margin: '0 0 var(--spacing-sm) 0',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
            }}
          >
            <GitBranch size={12} />
            Pending Changes
          </h2>
          <PendingChangesPanel />
        </div>

        {/* Views Navigation */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ ...sectionHeaderStyle, margin: '0 0 var(--spacing-sm) 0' }}>Views</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <NavLink
              to="/traceability"
              icon={LayoutGrid}
              label="Traceability Dashboard"
              iconStyle={{ transform: 'rotate(45deg)' }}
            />
            <NavLink to="/requirements" icon={FileText} label="Requirements" />
            <NavLink to="/use-cases" icon={FileText} label="Use Cases" />
            <NavLink to="/test-cases" icon={FileText} label="Test Cases" />
            <NavLink to="/information" icon={FileText} label="Information" />
          </div>
        </div>

        {/* Repository Navigation */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ ...sectionHeaderStyle, margin: '0 0 var(--spacing-sm) 0' }}>Repository</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <RepositoryButton
              onClick={() => onOpenLibraryTab?.('requirements')}
              icon={BookOpen}
              label="Requirements"
            />
            <RepositoryButton
              onClick={() => onOpenLibraryTab?.('usecases')}
              icon={BookOpen}
              label="Use Cases"
            />
            <RepositoryButton
              onClick={() => onOpenLibraryTab?.('testcases')}
              icon={BookOpen}
              label="Test Cases"
            />
            <RepositoryButton
              onClick={() => onOpenLibraryTab?.('information')}
              icon={BookOpen}
              label="Information"
            />
          </div>
        </div>
      </nav>

      <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
        {/* Global Settings or User Profile could go here */}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          cursor: 'col-resize',
          backgroundColor: isResizing ? 'var(--color-accent)' : 'transparent',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!isResizing) e.currentTarget.style.backgroundColor = 'var(--color-border)';
        }}
        onMouseLeave={(e) => {
          if (!isResizing) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      />
    </aside>
  );
};
