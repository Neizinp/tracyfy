import { useState, useEffect } from 'react';
import { Calendar, Plus, ChevronRight, GitCommit, Tag } from 'lucide-react';
import type { ProjectBaseline, CommitInfo } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { realGitService } from '../services/realGitService';

interface BaselineManagerProps {
  baselines: ProjectBaseline[];
  onCreateBaseline: () => void;
  onViewBaseline: (baselineId: string) => void;
}

export function BaselineManager({
  baselines,
  onCreateBaseline,
  onViewBaseline,
}: BaselineManagerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'baselines' | 'commits'>('baselines');
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [baselineCommitHashes, setBaselineCommitHashes] = useState<Map<string, string>>(new Map());
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);

  // Load commits and baseline tags when commits tab is active
  useEffect(() => {
    if (activeTab === 'commits') {
      loadCommits();
    }
  }, [activeTab]);

  const loadCommits = async () => {
    setIsLoadingCommits(true);
    try {
      // Get all commits
      const history = await realGitService.getHistory();
      setCommits(history);

      // Get baseline tags with their commit hashes
      const tags = await realGitService.getTagsWithDetails();
      const hashToTagName = new Map<string, string>();
      tags.forEach((tag) => {
        hashToTagName.set(tag.commit, tag.name);
      });
      setBaselineCommitHashes(hashToTagName);
    } catch (error) {
      console.error('Failed to load commits:', error);
    } finally {
      setIsLoadingCommits(false);
    }
  };

  const handleSelectBaseline = (baseline: ProjectBaseline) => {
    setSelectedId(baseline.id);
    onViewBaseline(baseline.id);
  };

  const sortedBaselines = [...baselines].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Project History</h2>
        <button
          onClick={onCreateBaseline}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          <Plus size={16} />
          <span>Create Baseline</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('baselines')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition ${
            activeTab === 'baselines'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Tag size={16} />
          Baselines
        </button>
        <button
          onClick={() => setActiveTab('commits')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition ${
            activeTab === 'commits'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <GitCommit size={16} />
          Commits
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'baselines' ? (
          // Baselines List
          sortedBaselines.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No baselines yet</p>
              <button
                onClick={onCreateBaseline}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Create First Baseline
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedBaselines.map((baseline, index) => (
                <div
                  key={baseline.id}
                  onClick={() => handleSelectBaseline(baseline)}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    selectedId === baseline.id
                      ? 'bg-blue-900/30 border-blue-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-blue-400">{baseline.version}</div>
                      <div>
                        <h3 className="font-semibold text-white">{baseline.name}</h3>
                        {baseline.description && (
                          <p className="text-sm text-gray-400 mt-1">{baseline.description}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-3">
                    <Calendar size={14} />
                    <span>{formatDateTime(baseline.timestamp)}</span>
                    <span className="mx-2">•</span>
                    <span>{Object.keys(baseline.artifactCommits).length} artifacts</span>
                    {baseline.addedArtifacts && baseline.addedArtifacts.length > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-green-400">
                          +{baseline.addedArtifacts.length} added
                        </span>
                      </>
                    )}
                    {baseline.removedArtifacts && baseline.removedArtifacts.length > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-red-400">
                          -{baseline.removedArtifacts.length} removed
                        </span>
                      </>
                    )}
                  </div>

                  {index === 0 && (
                    <div className="mt-2 inline-flex items-center px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                      Latest
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : // Commits List
        isLoadingCommits ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading commits...</p>
          </div>
        ) : commits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No commits yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {commits.map((commit, index) => {
              const baselineTag = baselineCommitHashes.get(commit.hash);
              const isBaseline = !!baselineTag;

              return (
                <div
                  key={commit.hash}
                  className={`p-4 rounded-lg border transition ${
                    isBaseline ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isBaseline ? (
                        <Tag size={16} className="text-blue-400" />
                      ) : (
                        <GitCommit size={16} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white truncate">
                          {commit.message.split('\n')[0]}
                        </span>
                        {isBaseline && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600/30 text-blue-300 text-xs rounded-full">
                            <Tag size={10} />
                            {baselineTag}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <span className="font-mono text-gray-500">
                          {commit.hash.substring(0, 7)}
                        </span>
                        <span>•</span>
                        <span>{commit.author}</span>
                        <span>•</span>
                        <span>{formatDateTime(commit.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  {index === 0 && (
                    <div className="mt-2 inline-flex items-center px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                      HEAD
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
