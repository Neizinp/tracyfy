import { LayoutGrid, Settings, FolderOpen, Plus, Download, Upload, Clock, FileText, FileSpreadsheet, ChevronDown, Search, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Project } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    currentProjectName: string;
    projects: Project[];
    currentProjectId: string;
    onSwitchProject: (projectId: string) => void;
    onCreateProject: () => void;
    onOpenProjectSettings: (project: Project) => void;
    onNewRequirement: () => void;
    onNewUseCase?: () => void;
    onNewTestCase?: () => void;
    onExport?: () => void;
    onImport?: () => void;
    onViewHistory?: () => void;
    onExportPDF?: () => void;
    onExportExcel?: () => void;
    onImportExcel?: () => void;
    onSearch?: (query: string) => void;
    onTrashOpen?: () => void;
    onNewInformation?: () => void;
    currentView: 'tree' | 'detailed' | 'matrix' | 'usecases' | 'testcases' | 'information';
    onSwitchView: (view: 'tree' | 'detailed' | 'matrix' | 'usecases' | 'testcases' | 'information') => void;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    currentProjectName,
    projects,
    currentProjectId,
    onSwitchProject,
    onCreateProject,
    onOpenProjectSettings,
    onNewRequirement,
    onNewUseCase,
    onNewTestCase,
    onExport,
    onImport,
    onImportExcel,
    onViewHistory,
    onExportPDF,
    onExportExcel,
    onSearch,
    onTrashOpen,
    onNewInformation,
    currentView,
    onSwitchView
}) => {
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
    const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const importMenuRef = useRef<HTMLDivElement>(null);
    const createMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
            if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
                setIsImportMenuOpen(false);
            }
            if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
                setIsCreateMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

                <nav style={{ flex: 1, padding: 'var(--spacing-md)', overflowY: 'auto' }}>
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 'var(--spacing-sm)'
                        }}>
                            <h2 style={{
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                color: 'var(--color-text-muted)',
                                letterSpacing: '0.05em',
                                margin: 0
                            }}>
                                Projects
                            </h2>
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
                                    justifyContent: 'center'
                                }}
                                title="New Project"
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                            {projects.map(project => (
                                <div
                                    key={project.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-xs)',
                                        padding: 'var(--spacing-sm)',
                                        backgroundColor: project.id === currentProjectId ? 'var(--color-bg-hover)' : 'transparent',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        position: 'relative'
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
                                            color: project.id === currentProjectId ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                            flex: 1,
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontWeight: project.id === currentProjectId ? 600 : 400
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
                                            opacity: project.id === currentProjectId ? 1 : 0,
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
                            ))}
                        </div>
                    </div>

                    {/* Views Navigation */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <h2 style={{
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            color: 'var(--color-text-muted)',
                            letterSpacing: '0.05em',
                            margin: '0 0 var(--spacing-sm) 0'
                        }}>
                            Views
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <button
                                onClick={() => onSwitchView('tree')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    padding: '8px 12px',
                                    border: 'none',
                                    background: currentView === 'tree' ? 'var(--color-bg-hover)' : 'transparent',
                                    color: currentView === 'tree' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontWeight: currentView === 'tree' ? 500 : 400
                                }}
                            >
                                <LayoutGrid size={18} />
                                Requirements Tree
                            </button>
                            <button
                                onClick={() => onSwitchView('detailed')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    padding: '8px 12px',
                                    border: 'none',
                                    background: currentView === 'detailed' ? 'var(--color-bg-hover)' : 'transparent',
                                    color: currentView === 'detailed' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontWeight: currentView === 'detailed' ? 500 : 400
                                }}
                            >
                                <FileText size={18} />
                                Detailed View
                            </button>
                            <button
                                onClick={() => onSwitchView('matrix')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    padding: '8px 12px',
                                    border: 'none',
                                    background: currentView === 'matrix' ? 'var(--color-bg-hover)' : 'transparent',
                                    color: currentView === 'matrix' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontWeight: currentView === 'matrix' ? 500 : 400
                                }}
                            >
                                <LayoutGrid size={18} style={{ transform: 'rotate(45deg)' }} />
                                Traceability Matrix
                            </button>
                            <button
                                onClick={() => onSwitchView('usecases')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    padding: '8px 12px',
                                    border: 'none',
                                    background: currentView === 'usecases' ? 'var(--color-bg-hover)' : 'transparent',
                                    color: currentView === 'usecases' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontWeight: currentView === 'usecases' ? 500 : 400
                                }}
                            >
                                <FileText size={18} />
                                Use Cases
                            </button>
                            <button
                                onClick={() => onSwitchView('testcases')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    padding: '8px 12px',
                                    border: 'none',
                                    background: currentView === 'testcases' ? 'var(--color-bg-hover)' : 'transparent',
                                    color: currentView === 'testcases' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontWeight: currentView === 'testcases' ? 500 : 400
                                }}
                            >
                                <FileText size={18} />
                                Test Cases
                            </button>
                            <button
                                onClick={() => onSwitchView('information')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    padding: '8px 12px',
                                    border: 'none',
                                    background: currentView === 'information' ? 'var(--color-bg-hover)' : 'transparent',
                                    color: currentView === 'information' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontWeight: currentView === 'information' ? 500 : 400
                                }}
                            >
                                <FileText size={18} />
                                Information
                            </button>
                        </div>
                    </div>
                </nav>

                <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
                    {/* Global Settings or User Profile could go here */}
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
                        <span style={{ color: 'var(--color-text-muted)' }}>Projects / {currentProjectName} /</span>
                        <span style={{ fontWeight: 500 }}>Requirements</span>
                    </div>

                    {/* Search Bar */}
                    {onSearch && (
                        <div style={{
                            position: 'relative',
                            width: '300px',
                            margin: '0 var(--spacing-md)'
                        }}>
                            <Search size={16} style={{
                                position: 'absolute',
                                left: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-text-muted)'
                            }} />
                            <input
                                type="text"
                                placeholder="Search requirements..."
                                onChange={(e) => onSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px 8px 36px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Create New Dropdown */}
                        <div style={{ position: 'relative' }} ref={createMenuRef}>
                            <button
                                onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
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
                                Create New
                                <ChevronDown size={14} />
                            </button>

                            {isCreateMenuOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    backgroundColor: 'var(--color-bg-primary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    zIndex: 100,
                                    minWidth: '200px',
                                    overflow: 'hidden'
                                }}>
                                    <button
                                        onClick={() => {
                                            onNewRequirement();
                                            setIsCreateMenuOpen(false);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-sm)',
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            border: 'none',
                                            background: 'transparent',
                                            color: 'var(--color-text-primary)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontSize: '0.9rem'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <Plus size={16} />
                                        New Requirement
                                    </button>
                                    {onNewUseCase && (
                                        <button
                                            onClick={() => {
                                                onNewUseCase();
                                                setIsCreateMenuOpen(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-sm)',
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--color-text-primary)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '0.9rem',
                                                borderTop: '1px solid var(--color-border)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <Plus size={16} />
                                            New Use Case
                                        </button>
                                    )}
                                    {onNewTestCase && (
                                        <button
                                            onClick={() => {
                                                onNewTestCase();
                                                setIsCreateMenuOpen(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-sm)',
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--color-text-primary)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '0.9rem',
                                                borderTop: '1px solid var(--color-border)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <Plus size={16} />
                                            New Test Case
                                        </button>
                                    )}
                                    {onNewInformation && (
                                        <button
                                            onClick={() => {
                                                onNewInformation();
                                                setIsCreateMenuOpen(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-sm)',
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--color-text-primary)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '0.9rem',
                                                borderTop: '1px solid var(--color-border)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <Plus size={16} />
                                            New Information
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

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
                        {onTrashOpen && (
                            <button
                                onClick={onTrashOpen}
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
                                <Trash2 size={18} />
                                Trash
                            </button>
                        )}
                        {/* Import Dropdown */}
                        <div style={{ position: 'relative' }} ref={importMenuRef}>
                            <button
                                onClick={() => setIsImportMenuOpen(!isImportMenuOpen)}
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
                                <ChevronDown size={14} />
                            </button>

                            {isImportMenuOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    backgroundColor: 'var(--color-bg-primary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    zIndex: 100,
                                    minWidth: '180px',
                                    overflow: 'hidden'
                                }}>
                                    {onImport && (
                                        <button
                                            onClick={() => {
                                                onImport();
                                                setIsImportMenuOpen(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-sm)',
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--color-text-primary)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <Upload size={16} />
                                            Import JSON
                                        </button>
                                    )}
                                    {onImportExcel && (
                                        <button
                                            onClick={() => {
                                                onImportExcel();
                                                setIsImportMenuOpen(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-sm)',
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--color-text-primary)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '0.9rem',
                                                borderTop: '1px solid var(--color-border)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <FileSpreadsheet size={16} />
                                            Import Excel
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* Export Dropdown */}
                        <div style={{ position: 'relative' }} ref={exportMenuRef}>
                            <button
                                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
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
                                <ChevronDown size={14} />
                            </button>

                            {isExportMenuOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    backgroundColor: 'var(--color-bg-primary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    zIndex: 100,
                                    minWidth: '180px',
                                    overflow: 'hidden'
                                }}>
                                    {onExportPDF && (
                                        <button
                                            onClick={() => {
                                                onExportPDF();
                                                setIsExportMenuOpen(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-sm)',
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--color-text-primary)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <FileText size={16} />
                                            Export to PDF
                                        </button>
                                    )}
                                    {onExportExcel && (
                                        <button
                                            onClick={() => {
                                                onExportExcel();
                                                setIsExportMenuOpen(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-sm)',
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--color-text-primary)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <FileSpreadsheet size={16} />
                                            Export to Excel
                                        </button>
                                    )}
                                    {onExport && (
                                        <button
                                            onClick={() => {
                                                onExport();
                                                setIsExportMenuOpen(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-sm)',
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--color-text-primary)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '0.9rem',
                                                borderTop: '1px solid var(--color-border)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <Download size={16} />
                                            Export JSON
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div style={{ flex: 1, overflow: 'auto', padding: 'var(--spacing-lg)' }}>
                    {children}
                </div>
            </main>
        </div >
    );
};

