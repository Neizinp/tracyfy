import { useState, useEffect } from 'react';
import { FileText, GitCommit, Plus, Minus, Edit, Calendar, User } from 'lucide-react';
import type { ProjectBaseline, ArtifactRevision } from '../types';
import { formatDateTime } from '../utils/dateUtils';

interface BaselineRevisionHistoryProps {
    currentBaseline: ProjectBaseline;
    previousBaseline: ProjectBaseline | null;
    projectName: string;
    onViewArtifact: (artifactId: string, commitHash: string) => void;
}

interface ArtifactRevisionInfo {
    id: string;
    type: 'requirement' | 'usecase' | 'testcase' | 'information';
    commitHash: string;
    revisions: ArtifactRevision[];
}

export function BaselineRevisionHistory({
    currentBaseline,
    previousBaseline,
    projectName,
    onViewArtifact
}: BaselineRevisionHistoryProps) {
    const [modifiedArtifacts, setModifiedArtifacts] = useState<ArtifactRevisionInfo[]>([]);
    const [addedArtifacts, setAddedArtifacts] = useState<string[]>([]);
    const [removedArtifacts, setRemovedArtifacts] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRevisionHistory = async () => {
            setLoading(true);
            try {
                const { gitService } = await import('../services/gitService');

                // Determine added and removed artifacts
                const added = currentBaseline.addedArtifacts || [];
                const removed = currentBaseline.removedArtifacts || [];

                setAddedArtifacts(added);
                setRemovedArtifacts(removed);

                // Determine modified artifacts (those that exist in both but have different commit hashes)
                const modified: ArtifactRevisionInfo[] = [];

                if (previousBaseline) {
                    for (const [artifactId, currentInfo] of Object.entries(currentBaseline.artifactCommits)) {
                        const prevInfo = previousBaseline.artifactCommits[artifactId];

                        if (prevInfo && prevInfo.commitHash !== currentInfo.commitHash) {
                            // Artifact was modified - get its revision history
                            // Map type to match gitService parameter format
                            const typeParam = currentInfo.type === 'requirement' ? 'requirements' :
                                currentInfo.type === 'usecase' ? 'usecases' :
                                    currentInfo.type === 'testcase' ? 'testcases' : 'information';

                            const history = await gitService.getArtifactHistory(
                                typeParam as 'requirements' | 'usecases' | 'testcases' | 'information',
                                artifactId
                            );

                            // Convert CommitInfo to ArtifactRevision format
                            const relevantRevisions: ArtifactRevision[] = history.map(commit => ({
                                commitHash: commit.hash,
                                message: commit.message,
                                author: commit.author,
                                timestamp: commit.timestamp
                            }));

                            modified.push({
                                id: artifactId,
                                type: currentInfo.type,
                                commitHash: currentInfo.commitHash,
                                revisions: relevantRevisions.slice(0, 5) // Show latest 5 commits
                            });
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
    }, [currentBaseline, previousBaseline, projectName]);

    const getTypeIcon = () => {
        return <FileText size={16} className="text-blue-400" />;
    };

    const getTypeLabel = (type: string) => {
        return type === 'requirement' ? 'Requirement' :
            type === 'usecase' ? 'Use Case' :
                type === 'testcase' ? 'Test Case' : 'Information';
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
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Baseline {currentBaseline.version}: {currentBaseline.name}
                    </h2>
                    <p className="text-gray-400 text-sm">{formatDateTime(currentBaseline.timestamp)}</p>
                    {currentBaseline.description && (
                        <p className="text-gray-300 mt-2">{currentBaseline.description}</p>
                    )}
                </div>

                {/* Modified Artifacts */}
                {modifiedArtifacts.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Edit size={20} className="text-yellow-400" />
                            Modified Artifacts ({modifiedArtifacts.length})
                        </h3>
                        <div className="space-y-4">
                            {modifiedArtifacts.map(artifact => (
                                <div key={artifact.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <div className="flex items-center gap-3 mb-3">
                                        {getTypeIcon()}
                                        <div>
                                            <div className="font-medium text-white">{artifact.id}</div>
                                            <div className="text-xs text-gray-400">{getTypeLabel(artifact.type)}</div>
                                        </div>
                                    </div>

                                    {/* Revision History */}
                                    <div className="space-y-2">
                                        {artifact.revisions.map((revision) => (
                                            <div
                                                key={revision.commitHash}
                                                className="flex items-start gap-3 p-2 rounded bg-gray-900/50 hover:bg-gray-900 transition cursor-pointer"
                                                onClick={() => onViewArtifact(artifact.id, revision.commitHash)}
                                            >
                                                <GitCommit size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-white font-medium truncate">{revision.message}</div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <User size={12} />
                                                            {revision.author}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {formatDateTime(revision.timestamp * 1000)}
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

                {/* Added to Project */}
                {addedArtifacts.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Plus size={20} className="text-green-400" />
                            Added to Project ({addedArtifacts.length})
                        </h3>
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <div className="grid grid-cols-2 gap-2">
                                {addedArtifacts.map(id => (
                                    <div key={id} className="flex items-center gap-2 px-3 py-2 bg-green-900/20 text-green-400 rounded text-sm">
                                        <Plus size={14} />
                                        <span>{id}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                These artifacts were added to the project from the global library
                            </p>
                        </div>
                    </div>
                )}

                {/* Removed from Project */}
                {removedArtifacts.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Minus size={20} className="text-red-400" />
                            Removed from Project ({removedArtifacts.length})
                        </h3>
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <div className="grid grid-cols-2 gap-2">
                                {removedArtifacts.map(id => (
                                    <div key={id} className="flex items-center gap-2 px-3 py-2 bg-red-900/20 text-red-400 rounded text-sm">
                                        <Minus size={14} />
                                        <span>{id}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                These artifacts were removed from the project (they still exist in the global library)
                            </p>
                        </div>
                    </div>
                )}

                {/* No Changes */}
                {modifiedArtifacts.length === 0 && addedArtifacts.length === 0 && removedArtifacts.length === 0 && (
                    <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                        <p className="text-gray-400">
                            {previousBaseline ? 'No changes since previous baseline' : 'This is the first baseline'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
