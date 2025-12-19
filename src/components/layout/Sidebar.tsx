import React, { useState, useEffect, useCallback, useRef } from 'react';
import { debug } from '../../utils/debug';
import {
  LayoutGrid,
  Plus,
  GitBranch,
  FileText,
  BookOpen,
  FlaskConical,
  Link2,
  ShieldAlert,
  Settings2,
  ChevronRight,
  Upload,
  Download,
  Settings,
  Globe,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { Project } from '../../types';
import { ProjectSidebarItem } from '../ProjectSidebarItem';
import { PendingChangesPanel } from '../PendingChangesPanel';
import { NavLink } from './NavLink';
import { RepositoryButton } from './RepositoryButton';
import { sectionHeaderStyle } from './layoutStyles';
import { realGitService } from '../../services/realGitService';
import { RemoteSettingsModal } from '../RemoteSettingsModal';
import { useFileSystem } from '../../app/providers';

const SIDEBAR_WIDTH_KEY = 'sidebar-width';
const COLLAPSED_SECTIONS_KEY = 'sidebar-collapsed-sections';
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
  onOpenLibraryTab?: (
    tab: 'requirements' | 'usecases' | 'testcases' | 'information' | 'risks'
  ) => void;
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

  // Collapsed sections state with localStorage persistence
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save collapsed sections to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify([...collapsedSections]));
    } catch {
      // Ignore in test environment
    }
  }, [collapsedSections]);

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Remote sync state
  const [hasRemote, setHasRemote] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isRemoteSettingsOpen, setIsRemoteSettingsOpen] = useState(false);

  // Check for remote on mount or when filesystem is ready
  const { isReady, refreshStatus } = useFileSystem();
  useEffect(() => {
    if (isReady) {
      realGitService.hasRemote().then(setHasRemote);
    }
  }, [isReady]);

  const handlePush = async () => {
    setIsPushing(true);
    setSyncError(null);
    try {
      await realGitService.push();
      debug.log('[Sidebar] Push successful');
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Push failed');
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    setIsPulling(true);
    setSyncError(null);
    try {
      const result = await realGitService.pull();
      if (!result.success && result.conflicts.length > 0) {
        setSyncError(`Merge conflicts in: ${result.conflicts.join(', ')}`);
      } else {
        debug.log('[Sidebar] Pull successful');
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Pull failed');
    } finally {
      setIsPulling(false);
    }
  };

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
          Tracyfy
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
              marginBottom: collapsedSections.has('projects') ? 0 : 'var(--spacing-sm)',
              cursor: 'pointer',
            }}
            onClick={() => toggleSection('projects')}
          >
            <h2
              style={{ ...sectionHeaderStyle, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronRight
                size={12}
                style={{
                  transform: collapsedSections.has('projects') ? 'rotate(0deg)' : 'rotate(90deg)',
                  transition: 'transform 0.15s',
                }}
              />
              Projects
            </h2>
            <div style={{ display: 'flex', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
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

          {!collapsedSections.has('projects') && (
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
          )}
        </div>

        {/* Pending Changes Section */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2
            onClick={() => toggleSection('pendingChanges')}
            style={{
              ...sectionHeaderStyle,
              margin:
                '0 0 ' +
                (collapsedSections.has('pendingChanges') ? '0' : 'var(--spacing-sm)') +
                ' 0',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              cursor: 'pointer',
            }}
          >
            <ChevronRight
              size={12}
              style={{
                transform: collapsedSections.has('pendingChanges')
                  ? 'rotate(0deg)'
                  : 'rotate(90deg)',
                transition: 'transform 0.15s',
              }}
            />
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flex: 1 }}
            >
              <GitBranch size={12} />
              Pending Changes
            </div>
            {!collapsedSections.has('pendingChanges') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  refreshStatus();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                title="Refresh pending changes"
              >
                <RefreshCw size={12} />
              </button>
            )}
          </h2>
          {!collapsedSections.has('pendingChanges') && <PendingChangesPanel />}
        </div>

        {/* Remote Sync Section */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: collapsedSections.has('remoteSync') ? 0 : 'var(--spacing-sm)',
            }}
          >
            <h2
              onClick={() => toggleSection('remoteSync')}
              style={{
                ...sectionHeaderStyle,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                cursor: 'pointer',
                flex: 1,
              }}
            >
              <ChevronRight
                size={12}
                style={{
                  transform: collapsedSections.has('remoteSync') ? 'rotate(0deg)' : 'rotate(90deg)',
                  transition: 'transform 0.15s',
                }}
              />
              <Globe size={12} />
              Remote Sync
            </h2>
            {!collapsedSections.has('remoteSync') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('git-check'));
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                title="Refresh sync status"
              >
                <RefreshCw size={12} />
              </button>
            )}
            <button
              onClick={() => setIsRemoteSettingsOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Remote Settings"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Settings size={14} />
            </button>
          </div>

          {!collapsedSections.has('remoteSync') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {!hasRemote ? (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: '6px',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)',
                    textAlign: 'center',
                  }}
                >
                  No remote configured.{' '}
                  <button
                    onClick={() => setIsRemoteSettingsOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-accent)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Add one
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={handlePull}
                      disabled={isPulling}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        cursor: isPulling ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: 'var(--color-text-primary)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      {isPulling ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      Pull
                    </button>
                    <button
                      onClick={handlePush}
                      disabled={isPushing}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: 'var(--color-accent)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isPushing ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: 'white',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      {isPushing ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      Push
                    </button>
                  </div>
                  {syncError && (
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
                        border: '1px solid var(--color-error)',
                        borderRadius: '6px',
                        color: 'var(--color-error)',
                        fontSize: 'var(--font-size-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertCircle size={12} />
                      {syncError}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* RemoteSettingsModal */}
        <RemoteSettingsModal
          isOpen={isRemoteSettingsOpen}
          onClose={() => {
            setIsRemoteSettingsOpen(false);
            realGitService.hasRemote().then(setHasRemote);
          }}
        />

        {/* Views Navigation */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2
            onClick={() => toggleSection('views')}
            style={{
              ...sectionHeaderStyle,
              margin: '0 0 ' + (collapsedSections.has('views') ? '0' : 'var(--spacing-sm)') + ' 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <ChevronRight
              size={12}
              style={{
                transform: collapsedSections.has('views') ? 'rotate(0deg)' : 'rotate(90deg)',
                transition: 'transform 0.15s',
              }}
            />
            Views
          </h2>
          {!collapsedSections.has('views') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <NavLink
                to="/traceability"
                icon={LayoutGrid}
                label="Traceability Dashboard"
                iconStyle={{ transform: 'rotate(45deg)' }}
              />
              <NavLink to="/workflows" icon={GitBranch} label="My Workflows" />
              <NavLink to="/requirements" icon={FileText} label="Requirements" />
              <NavLink to="/use-cases" icon={FileText} label="Use Cases" />
              <NavLink to="/test-cases" icon={FileText} label="Test Cases" />
              <NavLink to="/information" icon={FileText} label="Information" />
              <NavLink to="/risks" icon={ShieldAlert} label="Risks" />
              <NavLink to="/traceability?tab=links" icon={Link2} label="Links" />
              <NavLink to="/custom-attributes" icon={Settings2} label="Custom Attributes" />
            </div>
          )}
        </div>

        {/* Repository Navigation */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2
            onClick={() => toggleSection('repository')}
            style={{
              ...sectionHeaderStyle,
              margin:
                '0 0 ' + (collapsedSections.has('repository') ? '0' : 'var(--spacing-sm)') + ' 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <ChevronRight
              size={12}
              style={{
                transform: collapsedSections.has('repository') ? 'rotate(0deg)' : 'rotate(90deg)',
                transition: 'transform 0.15s',
              }}
            />
            Repository
          </h2>
          {!collapsedSections.has('repository') && (
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
              <RepositoryButton
                onClick={() => onOpenLibraryTab?.('risks')}
                icon={BookOpen}
                label="Risks"
              />
            </div>
          )}
        </div>
      </nav>

      <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
        {/* Reserved for future use */}
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
