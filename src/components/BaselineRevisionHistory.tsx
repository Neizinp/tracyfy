import { useState, useEffect } from 'react';
import { FileText, GitCommit, Plus, Minus, Edit, Calendar, User } from 'lucide-react';
import type {
  ProjectBaseline,
  ArtifactRevision,
  Requirement,
  UseCase,
  TestCase,
  Information,
  Risk,
  CommitInfo,
} from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { useFileSystem, useRisks } from '../app/providers';
import {
  markdownToRequirement,
  markdownToUseCase,
  markdownToTestCase,
  markdownToInformation,
  markdownToRisk,
} from '../utils/markdownUtils';

interface BaselineRevisionHistoryProps {
  currentBaseline: ProjectBaseline;
  previousBaseline: ProjectBaseline | null;
  projectName: string;
  onViewArtifact: (artifactId: string, commitHash: string) => void;
}

interface ArtifactRevisionInfo {
  id: string;
  type: 'requirement' | 'usecase' | 'testcase' | 'information' | 'risk';
  commitHash: string;
  revisions: ArtifactRevision[];
  revision?: string;
}

export function BaselineRevisionHistory({
  currentBaseline,
  previousBaseline,
  projectName,
  onViewArtifact,
}: BaselineRevisionHistoryProps) {
  const [modifiedArtifacts, setModifiedArtifacts] = useState<ArtifactRevisionInfo[]>([]);
  const [addedArtifacts, setAddedArtifacts] = useState<string[]>([]);
  const [removedArtifacts, setRemovedArtifacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { getArtifactHistory, readFileAtCommit } = useFileSystem();
  const { getRiskHistory } = useRisks();

  useEffect(() => {
    const loadRevisionHistory = async () => {
      setLoading(true);
      try {
        // Determine added and removed artifacts
        const added = currentBaseline.addedArtifacts || [];
        const removed = currentBaseline.removedArtifacts || [];

        setAddedArtifacts(added);
        setRemovedArtifacts(removed);

        // Determine modified artifacts (those that exist in both but have different commit hashes)
        const modified: ArtifactRevisionInfo[] = [];

        if (previousBaseline) {
          for (const [artifactId, info] of Object.entries(currentBaseline.artifactCommits)) {
            const currentInfo = info as {
              commitHash: string;
              type: 'requirement' | 'usecase' | 'testcase' | 'information' | 'risk';
            };
            const prevInfo = previousBaseline.artifactCommits[artifactId];

            if (prevInfo && prevInfo.commitHash !== currentInfo.commitHash) {
              const providerType =
                currentInfo.type === 'requirement'
                  ? 'requirements'
                  : currentInfo.type === 'usecase'
                    ? 'usecases'
                    : currentInfo.type === 'testcase'
                      ? 'testcases'
                      : currentInfo.type === 'information'
                        ? 'information'
                        : null;

              if (currentInfo.type === 'risk' || providerType) {
                try {
                  const history: CommitInfo[] =
                    currentInfo.type === 'risk'
                      ? await getRiskHistory(artifactId)
                      : await getArtifactHistory(
                          providerType as 'requirements' | 'usecases' | 'testcases' | 'information',
                          artifactId
                        );

                  const relevantRevisions: ArtifactRevision[] = history.map(
                    (commit: CommitInfo) => ({
                      commitHash: commit.hash,
                      message: commit.message,
                      author: commit.author,
                      timestamp: commit.timestamp,
                    })
                  );

                  let revision = '01';
                  try {
                    const folder = currentInfo.type === 'risk' ? 'risks' : providerType;
                    const folderPath = `${folder}/${artifactId}.md`;
                    const fileContent = await readFileAtCommit(folderPath, currentInfo.commitHash);

                    if (fileContent) {
                      let parsed: Requirement | UseCase | TestCase | Information | Risk | null =
                        null;
                      if (currentInfo.type === 'requirement') {
                        parsed = markdownToRequirement(fileContent);
                      } else if (currentInfo.type === 'usecase') {
                        parsed = markdownToUseCase(fileContent);
                      } else if (currentInfo.type === 'testcase') {
                        parsed = markdownToTestCase(fileContent);
                      } else if (currentInfo.type === 'information') {
                        parsed = markdownToInformation(fileContent);
                      } else if (currentInfo.type === 'risk') {
                        parsed = markdownToRisk(fileContent);
                      }
                      if (parsed && 'revision' in parsed && parsed.revision) {
                        revision = parsed.revision;
                      }
                    }
                  } catch {
                    // ignore
                  }

                  modified.push({
                    id: artifactId,
                    type: currentInfo.type,
                    commitHash: currentInfo.commitHash,
                    revisions: relevantRevisions.slice(0, 5),
                    revision,
                  });
                } catch (err) {
                  console.error(`Failed to fetch history for ${artifactId}`, err);
                }
              }
            }
          }
        }

        setModifiedArtifacts(modified);
      } catch (error) {
        console.error('Failed to load revision history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRevisionHistory();
  }, [currentBaseline, previousBaseline, getArtifactHistory, getRiskHistory, readFileAtCommit]);

  const getTypeIcon = () => {
    return <FileText size={16} className="text-blue-400" />;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'requirement':
        return 'Requirement';
      case 'usecase':
        return 'Use Case';
      case 'testcase':
        return 'Test Case';
      case 'risk':
        return 'Risk';
      default:
        return 'Information';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading revision history...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {projectName} - Baseline {currentBaseline.version}
          </h2>
          <h3 className="text-lg text-gray-300 mb-1">{currentBaseline.name}</h3>
          <p className="text-gray-400 text-sm">{formatDateTime(currentBaseline.timestamp)}</p>
          {currentBaseline.description && (
            <p className="text-gray-300 mt-2">{currentBaseline.description}</p>
          )}
        </div>

        {modifiedArtifacts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Edit size={20} className="text-yellow-400" />
              Modified Artifacts ({modifiedArtifacts.length})
            </h3>
            <div className="space-y-4">
              {modifiedArtifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {getTypeIcon()}
                    <div>
                      <div className="font-medium text-white">{artifact.id}</div>
                      <div className="text-xs text-gray-400">{getTypeLabel(artifact.type)}</div>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                      <span className="text-xs text-gray-400">
                        Rev:{' '}
                        <span className="text-white font-mono">{artifact.revision || '01'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {artifact.revisions.map((revision) => (
                      <div
                        key={revision.commitHash}
                        className="flex items-start gap-3 p-2 rounded bg-gray-900/50 hover:bg-gray-900 transition cursor-pointer"
                        onClick={() => onViewArtifact(artifact.id, revision.commitHash)}
                      >
                        <GitCommit size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium truncate">
                            {revision.message}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              {revision.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDateTime(revision.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {addedArtifacts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Plus size={20} className="text-green-400" />
              Added to Project ({addedArtifacts.length})
            </h3>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="grid grid-cols-2 gap-2">
                {addedArtifacts.map((id) => (
                  <div
                    key={id}
                    className="flex items-center gap-2 px-3 py-2 bg-green-900/20 text-green-400 rounded text-sm"
                  >
                    <Plus size={14} />
                    <span>{id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {removedArtifacts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Minus size={20} className="text-red-400" />
              Removed from Project ({removedArtifacts.length})
            </h3>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="grid grid-cols-2 gap-2">
                {removedArtifacts.map((id) => (
                  <div
                    key={id}
                    className="flex items-center gap-2 px-3 py-2 bg-red-900/20 text-red-400 rounded text-sm"
                  >
                    <Minus size={14} />
                    <span>{id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {modifiedArtifacts.length === 0 &&
          addedArtifacts.length === 0 &&
          removedArtifacts.length === 0 && (
            <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-gray-400">
                {previousBaseline
                  ? 'No changes since previous baseline'
                  : 'This is the first baseline'}
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
