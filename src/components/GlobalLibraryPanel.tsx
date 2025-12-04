import React, { useState } from 'react';
import { Search, FileText, BookOpen, CheckSquare, Info, Plus } from 'lucide-react';
import type { Requirement, UseCase, TestCase, Information, Project } from '../types';

interface GlobalLibraryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
    projects: Project[];
    selectedItems: Set<string>;
    onToggleSelect: (id: string) => void;
    activeTab?: Tab;
    onTabChange?: (tab: Tab) => void;
    onAddToProject?: (ids: string[]) => void;
}

type Tab = 'requirements' | 'usecases' | 'testcases' | 'information';

const LibraryItem = ({
    id,
    title,
    type,
    projectNames,
    isSelected,
    onToggleSelect
}: {
    id: string,
    title: string,
    type: string,
    projectNames: string,
    isSelected: boolean,
    onToggleSelect: (id: string) => void
}) => {
    return (
        <div
            style={{
                padding: '12px',
                backgroundColor: isSelected ? 'var(--color-bg-hover)' : 'var(--color-bg-card)',
                border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                borderRadius: '6px',
                marginBottom: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                transition: 'all 0.2s ease'
            }}
            onClick={() => onToggleSelect(id)}
        >
            <div style={{
                marginTop: '4px',
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                border: isSelected ? 'none' : '1px solid var(--color-text-muted)',
                backgroundColor: isSelected ? 'var(--color-accent)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                {isSelected && <CheckSquare size={12} color="white" />}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '4px' }}>{title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{id}</span>
                    {projectNames && (
                        <span style={{
                            fontSize: '0.7rem',
                            color: 'var(--color-text-secondary)',
                            backgroundColor: 'var(--color-bg-tertiary)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            maxWidth: '120px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {projectNames}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export const GlobalLibraryPanel: React.FC<GlobalLibraryPanelProps> = ({
    isOpen,
    onClose,
    requirements,
    useCases,
    testCases,
    information,
    projects,
    selectedItems,
    onToggleSelect,
    activeTab: propActiveTab,
    onTabChange,
    onAddToProject
}) => {
    const [localActiveTab, setLocalActiveTab] = useState<Tab>('requirements');
    const activeTab = propActiveTab || localActiveTab;
    const handleTabChange = (tab: Tab) => {
        if (onTabChange) {
            onTabChange(tab);
        } else {
            setLocalActiveTab(tab);
        }
    };

    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const getProjectNames = (itemId: string, type: Tab) => {
        return projects
            .filter(p => {
                switch (type) {
                    case 'requirements': return p.requirementIds.includes(itemId);
                    case 'usecases': return p.useCaseIds.includes(itemId);
                    case 'testcases': return p.testCaseIds.includes(itemId);
                    case 'information': return p.informationIds.includes(itemId);
                    default: return false;
                }
            })
            .map(p => p.name)
            .join(', ');
    };

    const filterItems = <T extends { id: string, title: string, isDeleted?: boolean }>(items: T[]) => {
        return items.filter(item =>
            !item.isDeleted &&
            (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'requirements':
                return filterItems(requirements).map(req => (
                    <LibraryItem
                        key={req.id}
                        id={req.id}
                        title={req.title}
                        type="requirement"
                        projectNames={getProjectNames(req.id, 'requirements')}
                        isSelected={selectedItems.has(req.id)}
                        onToggleSelect={onToggleSelect}
                    />
                ));
            case 'usecases':
                return filterItems(useCases).map(uc => (
                    <LibraryItem
                        key={uc.id}
                        id={uc.id}
                        title={uc.title}
                        type="usecase"
                        projectNames={getProjectNames(uc.id, 'usecases')}
                        isSelected={selectedItems.has(uc.id)}
                        onToggleSelect={onToggleSelect}
                    />
                ));
            case 'testcases':
                return filterItems(testCases).map(tc => (
                    <LibraryItem
                        key={tc.id}
                        id={tc.id}
                        title={tc.title}
                        type="testcase"
                        projectNames={getProjectNames(tc.id, 'testcases')}
                        isSelected={selectedItems.has(tc.id)}
                        onToggleSelect={onToggleSelect}
                    />
                ));
            case 'information':
                return filterItems(information).map(info => (
                    <LibraryItem
                        key={info.id}
                        id={info.id}
                        title={info.title}
                        type="information"
                        projectNames={getProjectNames(info.id, 'information')}
                        isSelected={selectedItems.has(info.id)}
                        onToggleSelect={onToggleSelect}
                    />
                ));
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--color-bg-secondary)',
            borderLeft: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50
        }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Global Library</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            color: 'var(--color-text-secondary)'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search library..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 36px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
                {[
                    { id: 'requirements', icon: FileText, label: 'Reqs' },
                    { id: 'usecases', icon: BookOpen, label: 'UC' },
                    { id: 'testcases', icon: CheckSquare, label: 'TC' },
                    { id: 'information', icon: Info, label: 'Info' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id as Tab)}
                        style={{
                            flex: 1,
                            padding: '12px 4px',
                            background: activeTab === tab.id ? 'var(--color-bg-primary)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                            color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 500
                        }}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {renderContent()}
            </div>

            {selectedItems.size > 0 && (
                <div style={{
                    padding: '16px',
                    borderTop: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-secondary)'
                }}>
                    <button
                        onClick={() => onAddToProject?.(Array.from(selectedItems))}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: 'var(--color-accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <Plus size={16} />
                        Add {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''} to Project
                    </button>
                </div>
            )}
        </div >
    );
};
