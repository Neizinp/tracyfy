import React, { useState } from 'react';
import type { Project } from '../types';
import { formatDate } from '../utils/dateUtils';

interface ProjectManagerProps {
    projects: Project[];
    currentProjectId: string;
    onSwitchProject: (projectId: string) => void;
    onCreateProject: (name: string, description: string) => void;
    onDeleteProject: (projectId: string) => void;
    onClose: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
    projects,
    currentProjectId,
    onSwitchProject,
    onCreateProject,
    onDeleteProject,
    onClose
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            onCreateProject(newProjectName, newProjectDescription);
            setNewProjectName('');
            setNewProjectDescription('');
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Project Manager</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isCreating ? (
                        <form onSubmit={handleCreate} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Project Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        value={newProjectDescription}
                                        onChange={(e) => setNewProjectDescription(e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        Create Project
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-6">
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                New Project
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className={`flex items-center justify-between p-4 rounded-lg border ${project.id === currentProjectId
                                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                    : 'border-gray-200 hover:border-indigo-300'
                                    }`}
                            >
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSwitchProject(project.id)}>
                                    <div className="flex items-center space-x-3">
                                        <h3 className="text-lg font-medium text-gray-900 truncate">{project.name}</h3>
                                        {project.id === currentProjectId && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500 truncate">{project.description || 'No description'}</p>
                                    <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                                        <span>{project.requirements.length} Requirements</span>
                                        <span>{project.useCases.length} Use Cases</span>
                                        <span>Last modified: {formatDate(project.lastModified)}</span>
                                    </div>
                                </div>

                                <div className="ml-4 flex items-center space-x-2">
                                    {project.id !== currentProjectId && (
                                        <button
                                            onClick={() => onSwitchProject(project.id)}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Switch
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (confirm(`Are you sure you want to delete project "${project.name}"? This cannot be undone.`)) {
                                                onDeleteProject(project.id);
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                                        title="Delete Project"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
