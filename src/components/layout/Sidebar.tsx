/**
 * Sidebar Component
 *
 * Contains app logo, projects list, pending changes panel, views navigation,
 * and repository section. Uses useSidebar hook for state management.
 */

import React from 'react';
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
import { RemoteSettingsModal } from '../RemoteSettingsModal';
import { useSidebar } from './useSidebar';
import { formatDateTime } from '../../utils/dateUtils';

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

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  currentProjectId,
  onSwitchProject,
  onCreateProject,
  onCreateDemoProject,
  onOpenProjectSettings,
  onOpenLibraryTab,
}) => {
  // Use the extracted hook for all sidebar state and handlers
  const {
    sidebarRef,
    width,
    isResizing,
    startResizing,
    collapsedSections,
    toggleSection,
    hasRemote,
    isPushing,
    isPulling,
    syncError,
    handlePush,
    handlePull,
    isRemoteSettingsOpen,
    openRemoteSettings,
    closeRemoteSettings,
    refreshStatus,
    syncStatus,
    autoSync,
  } = useSidebar();

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
              onClick={openRemoteSettings}
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
                    onClick={openRemoteSettings}
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

                  {/* Pending commits display - only show when not auto-syncing */}
                  {autoSync ? (
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                        border:
                          '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
                        borderRadius: '6px',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <RefreshCw size={14} />
                      Auto-sync enabled
                    </div>
                  ) : (
                    <>
                      {(syncStatus.behindCommits?.length ?? 0) > 0 && (
                        <div
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--color-bg-secondary)',
                            borderRadius: '6px',
                            fontSize: 'var(--font-size-xs)',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--color-text-muted)',
                              marginBottom: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Download size={12} />
                            Incoming ({syncStatus.behindCommits?.length})
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              maxHeight: '120px',
                              overflowY: 'auto',
                            }}
                          >
                            {syncStatus.behindCommits?.slice(0, 5).map((c) => (
                              <div
                                key={c.hash}
                                style={{
                                  padding: '4px 6px',
                                  backgroundColor: 'var(--color-bg-app)',
                                  borderRadius: '4px',
                                  border: '1px solid var(--color-border)',
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: 500,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {c.message}
                                </div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>
                                  {c.author}
                                </div>
                              </div>
                            ))}
                            {(syncStatus.behindCommits?.length ?? 0) > 5 && (
                              <div
                                style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}
                              >
                                +{(syncStatus.behindCommits?.length ?? 0) - 5} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(syncStatus.aheadCommits?.length ?? 0) > 0 && (
                        <div
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--color-bg-secondary)',
                            borderRadius: '6px',
                            fontSize: 'var(--font-size-xs)',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--color-text-muted)',
                              marginBottom: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Upload size={12} />
                            Outgoing ({syncStatus.aheadCommits?.length})
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              maxHeight: '120px',
                              overflowY: 'auto',
                            }}
                          >
                            {syncStatus.aheadCommits?.slice(0, 5).map((c) => (
                              <div
                                key={c.hash}
                                style={{
                                  padding: '4px 6px',
                                  backgroundColor: 'var(--color-bg-app)',
                                  borderRadius: '4px',
                                  border: '1px solid var(--color-border)',
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: 500,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {c.message}
                                </div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>
                                  {c.author}
                                </div>
                              </div>
                            ))}
                            {(syncStatus.aheadCommits?.length ?? 0) > 5 && (
                              <div
                                style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}
                              >
                                +{(syncStatus.aheadCommits?.length ?? 0) - 5} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!syncStatus.ahead && !syncStatus.behind && !syncError && (
                        <div
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--color-bg-secondary)',
                            borderRadius: '6px',
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-muted)',
                            textAlign: 'center',
                          }}
                        >
                          ✓ Synced with remote
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* RemoteSettingsModal */}
        <RemoteSettingsModal isOpen={isRemoteSettingsOpen} onClose={closeRemoteSettings} />

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
              <NavLink to="/documents" icon={FileText} label="Documents" />
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

      <div
        style={{
          padding: 'var(--spacing-md)',
          borderTop: '1px solid var(--color-border)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
          <span>
            v{__APP_VERSION__} ({__APP_COMMIT_HASH__})
          </span>
          <span>{formatDateTime(new Date(__APP_BUILD_DATE__).getTime())}</span>
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={startResizing}
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
