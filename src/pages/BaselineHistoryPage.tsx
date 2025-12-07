import React, { useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { BaselineRevisionHistory } from '../components';
import { useFileSystem, useProject } from '../app/providers';
import { realGitService } from '../services/realGitService';
import type { ProjectBaseline } from '../types';

export const BaselineHistoryPage: React.FC = () => {
  const { baselines, requirements, useCases, testCases, information } = useFileSystem();
  const { currentProject } = useProject();
  const { baselineId } = useParams<{ baselineId: string }>();
  const [compareToCurrent, setCompareToCurrent] = useState(false);

  if (!baselineId) {
    return <Navigate to="/baselines" replace />;
  }

  const selectedBaseline = baselines.find((b) => b.id === baselineId);
  if (!selectedBaseline) {
    return <Navigate to="/baselines" replace />;
  }

  // Generate a pseudo-baseline for the current state
  const currentStateBaseline: ProjectBaseline = useMemo(() => {
    if (!currentProject) return null;
    const artifactCommits: ProjectBaseline['artifactCommits'] = {};
    // Helper to get latest commit hash for an artifact
    const getLatestCommit = async (type: string, id: string) => {
      const folder =
        type === 'requirement'
          ? 'requirements'
          : type === 'usecase'
            ? 'usecases'
            : type === 'testcase'
              ? 'testcases'
              : type === 'information'
                ? 'information'
                : '';
      if (!folder) return '';
      const history = await realGitService.getHistory(`${folder}/${id}.json`);
      return history[0]?.hash || '';
    };
    // Build artifactCommits for all artifacts in the project
    currentProject.requirementIds.forEach((id) => {
      artifactCommits[id] = { commitHash: '', type: 'requirement' };
    });
    currentProject.useCaseIds.forEach((id) => {
      artifactCommits[id] = { commitHash: '', type: 'usecase' };
    });
    currentProject.testCaseIds.forEach((id) => {
      artifactCommits[id] = { commitHash: '', type: 'testcase' };
    });
    currentProject.informationIds.forEach((id) => {
      artifactCommits[id] = { commitHash: '', type: 'information' };
    });
    // We'll fill commit hashes in BaselineRevisionHistory (it already fetches history)
    return {
      id: 'current-state',
      projectId: currentProject.id,
      version: 'Current',
      name: 'Current State',
      description: 'Current project state',
      timestamp: Date.now(),
      artifactCommits,
      addedArtifacts: [],
      removedArtifacts: [],
    };
  }, [currentProject]);

  // Allow user to select comparison target
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <button
          onClick={() => setCompareToCurrent(false)}
          style={{
            background: !compareToCurrent ? '#2ecc40' : '#222',
            color: !compareToCurrent ? 'white' : '#aaa',
            border: '1px solid #2ecc40',
            borderRadius: 6,
            padding: '6px 16px',
            cursor: 'pointer',
          }}
        >
          Compare to Previous Baseline
        </button>
        <button
          onClick={() => setCompareToCurrent(true)}
          style={{
            background: compareToCurrent ? '#2ecc40' : '#222',
            color: compareToCurrent ? 'white' : '#aaa',
            border: '1px solid #2ecc40',
            borderRadius: 6,
            padding: '6px 16px',
            cursor: 'pointer',
          }}
        >
          Compare to Current State
        </button>
      </div>
      <BaselineRevisionHistory
        projectName={currentProject?.name || 'Unknown'}
        currentBaseline={compareToCurrent ? currentStateBaseline : selectedBaseline}
        previousBaseline={
          compareToCurrent
            ? selectedBaseline
            : baselines.find(
                (b) =>
                  b.version ===
                  (parseInt(selectedBaseline.version || '0') - 1).toString().padStart(2, '0')
              ) || null
        }
        onViewArtifact={(artifactId, commitHash) => {
          console.log('View artifact', artifactId, commitHash);
          alert(`View artifact ${artifactId} at ${commitHash} - Not implemented yet`);
        }}
      />
    </div>
  );
};
