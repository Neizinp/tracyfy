import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import type { Project, Requirement, UseCase, TestCase, Information } from '../types';

interface GlobalLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentProjectId: string;
  globalRequirements: Requirement[];
  globalUseCases: UseCase[];
  globalTestCases: TestCase[];
  globalInformation: Information[];
  onAddToProject: (artifacts: {
    requirements: string[];
    useCases: string[];
    testCases: string[];
    information: string[];
  }) => void;
}

type FilterMode = 'all' | 'unassigned' | 'project';

export const GlobalLibraryModal: React.FC<GlobalLibraryModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  globalRequirements,
  globalUseCases,
  globalTestCases,
  globalInformation,
  onAddToProject,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedRequirements, setSelectedRequirements] = useState<Set<string>>(new Set());
  const [selectedUseCases, setSelectedUseCases] = useState<Set<string>>(new Set());
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set());
  const [selectedInformation, setSelectedInformation] = useState<Set<string>>(new Set());

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilterMode('all');
      setSelectedProjectId('');
      setSearchQuery('');
      setSelectedRequirements(new Set());
      setSelectedUseCases(new Set());
      setSelectedUseCases(new Set());
      setSelectedTestCases(new Set());
      setSelectedInformation(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper to check if an artifact is in a project
  const isInProject = (artifactId: string, projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return false;
    return (
      project.requirementIds.includes(artifactId) ||
      project.useCaseIds.includes(artifactId) ||
      project.testCaseIds.includes(artifactId) ||
      project.informationIds.includes(artifactId)
    );
  };

  // Helper to check if an artifact is assigned to ANY project
  const isAssignedToAnyProject = (artifactId: string) => {
    return projects.some(
      (p) =>
        p.requirementIds.includes(artifactId) ||
        p.useCaseIds.includes(artifactId) ||
        p.testCaseIds.includes(artifactId) ||
        p.informationIds.includes(artifactId)
    );
  };

  // Filter artifacts based on mode and search
  const getFilteredArtifacts = () => {
    let reqs = globalRequirements;
    let ucs = globalUseCases;
    let tcs = globalTestCases;
    let info = globalInformation;

    // 1. Apply Mode Filter
    if (filterMode === 'unassigned') {
      reqs = reqs.filter((r) => !isAssignedToAnyProject(r.id));
      ucs = ucs.filter((u) => !isAssignedToAnyProject(u.id));
      tcs = tcs.filter((t) => !isAssignedToAnyProject(t.id));
      info = info.filter((i) => !isAssignedToAnyProject(i.id));
    } else if (filterMode === 'project' && selectedProjectId) {
      const proj = projects.find((p) => p.id === selectedProjectId);
      if (proj) {
        reqs = reqs.filter((r) => proj.requirementIds.includes(r.id));
        ucs = ucs.filter((u) => proj.useCaseIds.includes(u.id));
        tcs = tcs.filter((t) => proj.testCaseIds.includes(t.id));
        info = info.filter((i) => proj.informationIds.includes(i.id));
      } else {
        reqs = [];
        ucs = [];
        tcs = [];
        info = [];
      }
    }

    // 2. Apply Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      reqs = reqs.filter(
        (r) =>
          r.id.toLowerCase().includes(query) ||
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query)
      );
      ucs = ucs.filter(
        (u) => u.id.toLowerCase().includes(query) || u.title.toLowerCase().includes(query)
      );
      tcs = tcs.filter(
        (t) => t.id.toLowerCase().includes(query) || t.title.toLowerCase().includes(query)
      );
      info = info.filter(
        (i) => i.id.toLowerCase().includes(query) || i.title.toLowerCase().includes(query)
      );
    }

    return { reqs, ucs, tcs, info };
  };

  const {
    reqs: filteredReqs,
    ucs: filteredUCs,
    tcs: filteredTCs,
    info: filteredInfo,
  } = getFilteredArtifacts();

  const handleToggleRequirement = (id: string) => {
    const newSet = new Set(selectedRequirements);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRequirements(newSet);
  };

  const handleToggleUseCase = (id: string) => {
    const newSet = new Set(selectedUseCases);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedUseCases(newSet);
  };

  const handleToggleTestCase = (id: string) => {
    const newSet = new Set(selectedTestCases);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTestCases(newSet);
  };

  const handleToggleInformation = (id: string) => {
    const newSet = new Set(selectedInformation);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedInformation(newSet);
  };

  const handleAdd = () => {
    onAddToProject({
      requirements: Array.from(selectedRequirements),
      useCases: Array.from(selectedUseCases),
      testCases: Array.from(selectedTestCases),
      information: Array.from(selectedInformation),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-lg">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                <Search size={18} className="text-white" />
              </div>
              Global Artifact Library
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Browse and add artifacts from the global pool to your project.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex flex-wrap gap-4 items-center">
          {/* Filter Mode */}
          <div className="flex bg-gray-700 rounded p-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${filterMode === 'all' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
            >
              All Artifacts
            </button>
            <button
              onClick={() => setFilterMode('unassigned')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${filterMode === 'unassigned' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
            >
              Unassigned
            </button>
            <button
              onClick={() => setFilterMode('project')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${filterMode === 'project' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
            >
              By Project
            </button>
          </div>

          {/* Project Selector (only visible in 'project' mode) */}
          {filterMode === 'project' && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Select Project --</option>
              {projects
                .filter((p) => p.id !== currentProjectId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          )}

          {/* Search */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by ID, title, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded pl-9 pr-4 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="grid grid-cols-4 gap-6 h-full">
            {/* Requirements Column */}
            <div className="flex flex-col bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="p-3 bg-gray-700/50 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-medium text-blue-400">Requirements</h3>
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                  {filteredReqs.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredReqs.map((req) => {
                  const inCurrent = isInProject(req.id, currentProjectId);
                  return (
                    <div
                      key={req.id}
                      className={`p-3 rounded border transition-all ${
                        selectedRequirements.has(req.id)
                          ? 'bg-blue-900/30 border-blue-500/50'
                          : 'bg-gray-700/30 border-gray-700 hover:bg-gray-700'
                      } ${inCurrent ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRequirements.has(req.id) || inCurrent}
                          onChange={() => !inCurrent && handleToggleRequirement(req.id)}
                          disabled={inCurrent}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-mono text-blue-400">{req.id}</span>
                            {inCurrent && (
                              <span className="text-[10px] bg-green-900 text-green-300 px-1.5 rounded">
                                Added
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-200 font-medium truncate">
                            {req.title}
                          </div>
                          <div className="text-xs text-gray-400 line-clamp-2 mt-1">
                            {req.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredReqs.length === 0 && (
                  <div className="text-center text-gray-500 py-8 italic">No requirements found</div>
                )}
              </div>
            </div>

            {/* Use Cases Column */}
            <div className="flex flex-col bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="p-3 bg-gray-700/50 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-medium text-purple-400">Use Cases</h3>
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                  {filteredUCs.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredUCs.map((uc) => {
                  const inCurrent = isInProject(uc.id, currentProjectId);
                  return (
                    <div
                      key={uc.id}
                      className={`p-3 rounded border transition-all ${
                        selectedUseCases.has(uc.id)
                          ? 'bg-purple-900/30 border-purple-500/50'
                          : 'bg-gray-700/30 border-gray-700 hover:bg-gray-700'
                      } ${inCurrent ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedUseCases.has(uc.id) || inCurrent}
                          onChange={() => !inCurrent && handleToggleUseCase(uc.id)}
                          disabled={inCurrent}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-mono text-purple-400">{uc.id}</span>
                            {inCurrent && (
                              <span className="text-[10px] bg-green-900 text-green-300 px-1.5 rounded">
                                Added
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-200 font-medium truncate">
                            {uc.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredUCs.length === 0 && (
                  <div className="text-center text-gray-500 py-8 italic">No use cases found</div>
                )}
              </div>
            </div>

            {/* Test Cases Column */}
            <div className="flex flex-col bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="p-3 bg-gray-700/50 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-medium text-green-400">Test Cases</h3>
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                  {filteredTCs.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredTCs.map((tc) => {
                  const inCurrent = isInProject(tc.id, currentProjectId);
                  return (
                    <div
                      key={tc.id}
                      className={`p-3 rounded border transition-all ${
                        selectedTestCases.has(tc.id)
                          ? 'bg-green-900/30 border-green-500/50'
                          : 'bg-gray-700/30 border-gray-700 hover:bg-gray-700'
                      } ${inCurrent ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedTestCases.has(tc.id) || inCurrent}
                          onChange={() => !inCurrent && handleToggleTestCase(tc.id)}
                          disabled={inCurrent}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-mono text-green-400">{tc.id}</span>
                            {inCurrent && (
                              <span className="text-[10px] bg-green-900 text-green-300 px-1.5 rounded">
                                Added
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-200 font-medium truncate">
                            {tc.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredTCs.length === 0 && (
                  <div className="text-center text-gray-500 py-8 italic">No test cases found</div>
                )}
              </div>
            </div>

            {/* Information Column */}
            <div className="flex flex-col bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="p-3 bg-gray-700/50 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-medium text-yellow-400">Information</h3>
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                  {filteredInfo.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredInfo.map((info) => {
                  const inCurrent = isInProject(info.id, currentProjectId);
                  return (
                    <div
                      key={info.id}
                      className={`p-3 rounded border transition-all ${
                        selectedInformation.has(info.id)
                          ? 'bg-yellow-900/30 border-yellow-500/50'
                          : 'bg-gray-700/30 border-gray-700 hover:bg-gray-700'
                      } ${inCurrent ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedInformation.has(info.id) || inCurrent}
                          onChange={() => !inCurrent && handleToggleInformation(info.id)}
                          disabled={inCurrent}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-mono text-yellow-400">{info.id}</span>
                            {inCurrent && (
                              <span className="text-[10px] bg-green-900 text-green-300 px-1.5 rounded">
                                Added
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-200 font-medium truncate">
                            {info.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredInfo.length === 0 && (
                  <div className="text-center text-gray-500 py-8 italic">No information found</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800 rounded-b-lg flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Selected: <span className="text-white font-medium">{selectedRequirements.size}</span>{' '}
            Reqs, <span className="text-white font-medium">{selectedUseCases.size}</span> UCs,{' '}
            <span className="text-white font-medium">{selectedTestCases.size}</span> TCs,{' '}
            <span className="text-white font-medium">{selectedInformation.size}</span> Info
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={
                selectedRequirements.size === 0 &&
                selectedUseCases.size === 0 &&
                selectedTestCases.size === 0 &&
                selectedInformation.size === 0
              }
              className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Plus size={18} />
              Add to Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
