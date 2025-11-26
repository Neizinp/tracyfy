import React, { useState, useEffect } from 'react';
import { X, Search, Link as LinkIcon } from 'lucide-react';
import type { Requirement, Link, Project, UseCase, TestCase } from '../types';

interface LinkModalProps {
    isOpen: boolean;
    sourceRequirementId: string | null;
    projects: Project[];
    currentProjectId: string;
    globalRequirements: Requirement[];
    globalUseCases: UseCase[];
    globalTestCases: TestCase[];
    onClose: () => void;
    onSubmit: (link: Omit<Link, 'id'>) => void;
}

type ArtifactType = 'requirement' | 'usecase' | 'testcase';

export const LinkModal: React.FC<LinkModalProps> = ({
    isOpen,
    sourceRequirementId,
    projects,
    currentProjectId,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    onClose,
    onSubmit
}) => {
    const [targetType, setTargetType] = useState<ArtifactType>('requirement');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTargetId, setSelectedTargetId] = useState('');
    const [linkType, setLinkType] = useState<Link['type']>('relates_to');

    useEffect(() => {
        if (isOpen) {
            setTargetType('requirement');
            setSearchQuery('');
            setSelectedTargetId('');
            setLinkType('relates_to');
        }
    }, [isOpen]);

    if (!isOpen || !sourceRequirementId) return null;

    // Helper to find which project an artifact belongs to
    const findProjectForArtifact = (id: string): Project | undefined => {
        return projects.find(p =>
            p.requirementIds.includes(id) ||
            p.useCaseIds.includes(id) ||
            p.testCaseIds.includes(id)
        );
    };

    // Filter artifacts based on type and search
    const getFilteredArtifacts = () => {
        let artifacts: { id: string, title: string, description?: string }[] = [];

        if (targetType === 'requirement') artifacts = globalRequirements;
        else if (targetType === 'usecase') artifacts = globalUseCases;
        else if (targetType === 'testcase') artifacts = globalTestCases;

        // Filter out source requirement (can't link to self)
        artifacts = artifacts.filter(a => a.id !== sourceRequirementId);

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            artifacts = artifacts.filter(a =>
                a.id.toLowerCase().includes(query) ||
                a.title.toLowerCase().includes(query) ||
                (a.description && a.description.toLowerCase().includes(query))
            );
        }

        return artifacts;
    };

    const filteredArtifacts = getFilteredArtifacts();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTargetId) {
            const targetProject = findProjectForArtifact(selectedTargetId);

            onSubmit({
                sourceId: sourceRequirementId,
                targetId: selectedTargetId,
                targetProjectId: targetProject?.id, // Optional, but good for context
                type: linkType
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-lg w-full max-w-2xl shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-lg">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <LinkIcon size={20} className="text-blue-400" />
                        Create Link
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Source Requirement</label>
                        <div className="px-3 py-2 bg-gray-800 rounded border border-gray-700 text-blue-300 font-mono text-sm">
                            {sourceRequirementId}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Target Type</label>
                            <div className="flex bg-gray-800 rounded p-1 border border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => { setTargetType('requirement'); setSelectedTargetId(''); }}
                                    className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${targetType === 'requirement' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Requirement
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setTargetType('usecase'); setSelectedTargetId(''); }}
                                    className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${targetType === 'usecase' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Use Case
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setTargetType('testcase'); setSelectedTargetId(''); }}
                                    className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${targetType === 'testcase' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Test Case
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Select Target</label>
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="border border-gray-700 rounded-lg bg-gray-800 max-h-60 overflow-y-auto">
                                {filteredArtifacts.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm italic">No artifacts found</div>
                                ) : (
                                    filteredArtifacts.map(artifact => {
                                        const project = findProjectForArtifact(artifact.id);
                                        const isCurrentProject = project?.id === currentProjectId;

                                        return (
                                            <div
                                                key={artifact.id}
                                                onClick={() => setSelectedTargetId(artifact.id)}
                                                className={`p-3 border-b border-gray-700 last:border-0 cursor-pointer transition-colors flex items-center justify-between ${selectedTargetId === artifact.id
                                                        ? 'bg-blue-900/30 border-blue-500/30'
                                                        : 'hover:bg-gray-700'
                                                    }`}
                                            >
                                                <div className="min-w-0 flex-1 mr-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${targetType === 'requirement' ? 'bg-blue-900/50 text-blue-300' :
                                                                targetType === 'usecase' ? 'bg-purple-900/50 text-purple-300' :
                                                                    'bg-green-900/50 text-green-300'
                                                            }`}>
                                                            {artifact.id}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-200 truncate">
                                                            {artifact.title}
                                                        </span>
                                                    </div>
                                                    {artifact.description && (
                                                        <div className="text-xs text-gray-400 truncate pl-1">
                                                            {artifact.description}
                                                        </div>
                                                    )}
                                                </div>

                                                {project ? (
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${isCurrentProject
                                                            ? 'bg-gray-700 text-gray-300'
                                                            : 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30'
                                                        }`}>
                                                        {isCurrentProject ? 'Current Project' : project.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Link Type</label>
                            <select
                                value={linkType}
                                onChange={(e) => setLinkType(e.target.value as Link['type'])}
                                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                            >
                                <option value="relates_to">Relates To</option>
                                <option value="depends_on">Depends On</option>
                                <option value="conflicts_with">Conflicts With</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!selectedTargetId}
                                className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Create Link
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
