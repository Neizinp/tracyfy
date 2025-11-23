import React from 'react';
import { LayoutGrid, Settings, FolderOpen, Plus, Download, Upload, Clock } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    onNewRequirement: () => void;
    onNewUseCase?: () => void;
    onExport?: () => void;
    onImport?: () => void;
    onViewHistory?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNewRequirement, onNewUseCase, onExport, onImport, onViewHistory }) => {
    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                backgroundColor: 'var(--color-bg-sidebar)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <LayoutGrid size={24} color="var(--color-accent)" />
                        ReqTrace
                    </h1>
                </div>

                <nav style={{ flex: 1, padding: 'var(--spacing-md)' }}>
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <h2 style={{
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            color: 'var(--color-text-muted)',
                            marginBottom: 'var(--spacing-sm)',
                            letterSpacing: '0.05em'
                        }}>
                            Projects
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                            <button style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                padding: 'var(--spacing-sm)',
                                backgroundColor: 'var(--color-bg-hover)',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'var(--color-text-primary)',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left'
                            }}>
                                <FolderOpen size={18} />
                                <span>Mars Rover 2030</span>
                            </button>
                        </div>
                    </div>
                </nav>

                <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left'
                    }}>
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <header style={{
                    height: '60px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 var(--spacing-lg)',
                    backgroundColor: 'var(--color-bg-app)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Projects / Mars Rover 2030 /</span>
                        <span style={{ fontWeight: 500 }}>Requirements</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {onViewHistory && (
                            <button
                                onClick={onViewHistory}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-text-secondary)',
                                    border: '1px solid var(--color-border)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    transition: 'background-color 0.2s'
                                }}>
                                <Clock size={18} />
                                History
                            </button>
                        )}
                        {onImport && (
                            <button
                                onClick={onImport}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-text-secondary)',
                                    border: '1px solid var(--color-border)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    transition: 'background-color 0.2s'
                                }}>
                                <Upload size={18} />
                                Import
                            </button>
                        )}
                        {onExport && (
                            <button
                                onClick={onExport}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-text-secondary)',
                                    border: '1px solid var(--color-border)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    transition: 'background-color 0.2s'
                                }}>
                                <Download size={18} />
                                Export
                            </button>
                        )}
                        {onNewUseCase && (
                            <button
                                onClick={onNewUseCase}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-accent)',
                                    border: '1px solid var(--color-accent)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    transition: 'background-color 0.2s'
                                }}>
                                <Plus size={18} />
                                New Use Case
                            </button>
                        )}
                        <button
                            onClick={onNewRequirement}
                            style={{
                                backgroundColor: 'var(--color-accent)',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                cursor: 'pointer',
                                fontWeight: 500,
                                transition: 'background-color 0.2s'
                            }}>
                            <Plus size={18} />
                            New Requirement
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div style={{ flex: 1, overflow: 'auto', padding: 'var(--spacing-lg)' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};
