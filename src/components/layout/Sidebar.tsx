import React from 'react';
import { LayoutGrid, Plus, GitBranch, FileText, BookOpen } from 'lucide-react';
import type { Project } from '../../types';
import { ProjectSidebarItem } from '../ProjectSidebarItem';
import { PendingChangesPanel } from '../PendingChangesPanel';
import { NavLink } from './NavLink';
import { RepositoryButton } from './RepositoryButton';
import { sectionHeaderStyle } from './layoutStyles';

export interface SidebarProps {
  projects: Project[];
  currentProjectId: string;
  onSwitchProject: (projectId: string) => void;
  onCreateProject: () => void;
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
  onOpenProjectSettings,
  onOpenLibraryTab,
}) => {
  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--color-bg-sidebar)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
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
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-card)')}
            >
              <Plus size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            {projects.map((project) => (
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
              to="/matrix"
              icon={LayoutGrid}
              label="Traceability Matrix"
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
    </aside>
  );
};
