import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { diskBaselineService } from '../../services/diskBaselineService';
import { useProject } from './ProjectProvider';
import { useFileSystem } from './FileSystemProvider';
import { useToast } from './ToastProvider';
import { useRisks } from './ArtifactProviders';
import type { ProjectBaseline } from '../../types';

interface BaselinesContextValue {
  baselines: ProjectBaseline[];
  loading: boolean;
  createBaseline: (
    name: string,
    description: string,
    version: string
  ) => Promise<ProjectBaseline | null>;
  deleteBaseline: (id: string) => Promise<void>;
  refreshBaselines: () => Promise<void>;
}

const BaselinesContext = createContext<BaselinesContextValue | undefined>(undefined);

export const BaselinesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [baselines, setBaselines] = useState<ProjectBaseline[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentProject } = useProject();
  const { isReady, requirements, useCases, testCases, information, getArtifactHistory } =
    useFileSystem();
  const { risks, getRiskHistory } = useRisks();
  const { showToast } = useToast();
  const hasLoadedInitial = useRef(false);

  const refreshBaselines = useCallback(async () => {
    if (!isReady) return;

    setLoading(true);
    try {
      const loadedBaselines = await diskBaselineService.loadBaselines(currentProject?.id);
      setBaselines(loadedBaselines);
    } catch (err) {
      console.error('Failed to load baselines:', err);
    } finally {
      setLoading(false);
    }
  }, [isReady, currentProject?.id]);

  useEffect(() => {
    if (isReady && !hasLoadedInitial.current) {
      refreshBaselines();
      hasLoadedInitial.current = true;
    }
  }, [isReady, refreshBaselines]);

  const createBaseline = useCallback(
    async (name: string, description: string, version: string) => {
      if (!currentProject) return null;

      try {
        // 1. Get latest commit hash for all artifacts in project
        const artifactCommits: {
          [artifactId: string]: {
            commitHash: string;
            type: 'requirement' | 'usecase' | 'testcase' | 'information' | 'risk';
          };
        } = {};

        const captureCommits = async (
          items: { id: string }[],
          type: 'requirements' | 'usecases' | 'testcases' | 'information' | 'risks'
        ) => {
          // Map long naming (provider) to short naming (git folder)
          const gitType =
            type === 'requirements'
              ? 'requirement'
              : type === 'usecases'
                ? 'usecase'
                : type === 'testcases'
                  ? 'testcase'
                  : type === 'risks'
                    ? 'risk'
                    : 'information';

          for (const item of items) {
            const history =
              type === 'risks'
                ? await getRiskHistory(item.id)
                : await getArtifactHistory(
                    type as 'requirements' | 'usecases' | 'testcases' | 'information',
                    item.id
                  );
            if (history.length > 0) {
              artifactCommits[item.id] = {
                commitHash: history[0].hash,
                type: gitType as 'requirement' | 'usecase' | 'testcase' | 'information' | 'risk',
              };
            }
          }
        };

        await Promise.all([
          captureCommits(requirements, 'requirements'),
          captureCommits(useCases, 'usecases'),
          captureCommits(testCases, 'testcases'),
          captureCommits(information, 'information'),
          captureCommits(risks, 'risks'),
        ]);

        const newBaseline: ProjectBaseline = {
          id: `bl-${Date.now()}`,
          projectId: currentProject.id,
          name,
          description,
          version,
          timestamp: Date.now(),
          artifactCommits,
        };

        await diskBaselineService.saveBaseline(newBaseline);
        setBaselines((prev) => [newBaseline, ...prev]);
        showToast(`Baseline ${version} created successfully`, 'success');
        return newBaseline;
      } catch (err) {
        console.error('Failed to create baseline:', err);
        showToast('Failed to create baseline', 'error');
        return null;
      }
    },
    [
      currentProject,
      requirements,
      useCases,
      testCases,
      information,
      risks,
      getArtifactHistory,
      getRiskHistory,
      showToast,
    ]
  );

  const deleteBaseline = useCallback(
    async (id: string) => {
      try {
        await diskBaselineService.deleteBaseline(id);
        setBaselines((prev) => prev.filter((b) => b.id !== id));
        showToast('Baseline deleted', 'success');
      } catch (err) {
        console.error('Failed to delete baseline:', err);
        showToast('Failed to delete baseline', 'error');
      }
    },
    [showToast]
  );

  const value: BaselinesContextValue = {
    baselines,
    loading,
    createBaseline,
    deleteBaseline,
    refreshBaselines,
  };

  return <BaselinesContext.Provider value={value}>{children}</BaselinesContext.Provider>;
};

export const useBaselines = () => {
  const context = useContext(BaselinesContext);
  if (context === undefined) {
    throw new Error('useBaselines must be used within a BaselinesProvider');
  }
  return context;
};
