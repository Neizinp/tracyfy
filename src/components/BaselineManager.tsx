import { useState } from 'react';
import { Calendar, Plus, ChevronRight } from 'lucide-react';
import type { ProjectBaseline } from '../types';
import { formatDateTime } from '../utils/dateUtils';

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

  const handleSelectBaseline = (baseline: ProjectBaseline) => {
    setSelectedId(baseline.id);
    onViewBaseline(baseline.id);
  };

  const sortedBaselines = [...baselines].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Project Baselines</h2>
        <button
          onClick={onCreateBaseline}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          <Plus size={16} />
          <span>Create Baseline</span>
        </button>
      </div>

      {/* Baselines List */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedBaselines.length === 0 ? (
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
        )}
      </div>
    </div>
  );
}
