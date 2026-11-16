import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import type { ReactNode } from 'react';
import { diskBaselineService } from '../../services/diskBaselineService';
import { useFileSystem } from './FileSystemProvider';
import { useToast } from './ToastProvider';
import type { ProjectBaseline } from '../../types';
import { KIND_IDS, type ArtifactKindId } from '../../domain/artifactKinds';

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
  const {
    isReady,
    requirements,
    useCases,
    testCases,
    information,
    risks,
    documents,
    getArtifactHistory,
  } = useFileSystem();
  const { showToast } = useToast();
  const hasLoadedInitial = useRef(false);

  const refreshBaselines = useCallback(async () => {
    if (!isReady) return;

    setLoading(true);
    try {
      const loadedBaselines = await diskBaselineService.loadBaselines();
      setBaselines(loadedBaselines);
    } catch (err) {
      console.error('Failed to load baselines:', err);
    } finally {
      setLoading(false);
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady && !hasLoadedInitial.current) {
      refreshBaselines();
      hasLoadedInitial.current = true;
    }
  }, [isReady, refreshBaselines]);

  const createBaseline = useCallback(
    async (name: string, description: string, version: string) => {
      try {
        // 1. Get latest commit hash for every artifact
        const artifactCommits: ProjectBaseline['artifactCommits'] = {};

        const byKind: Record<ArtifactKindId, { id: string }[]> = {
          requirement: requirements,
          useCase: useCases,
          testCase: testCases,
          information,
          risk: risks,
          document: documents,
        };
        await Promise.all(
          KIND_IDS.flatMap((kind) =>
            byKind[kind].map(async (item) => {
              const history = await getArtifactHistory(kind, item.id);
              if (history.length > 0) {
                artifactCommits[item.id] = { commitHash: history[0].hash, type: kind };
              }
            })
          )
        );

        const newBaseline: ProjectBaseline = {
          id: `bl-${Date.now()}`,
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
      requirements,
      useCases,
      testCases,
      information,
      risks,
      documents,
      getArtifactHistory,
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

  const value: BaselinesContextValue = useMemo(
    () => ({
      baselines,
      loading,
      createBaseline,
      deleteBaseline,
      refreshBaselines,
    }),
    [baselines, createBaseline, deleteBaseline, loading, refreshBaselines]
  );

  return <BaselinesContext.Provider value={value}>{children}</BaselinesContext.Provider>;
};

export const useBaselines = () => {
  const context = useContext(BaselinesContext);
  if (context === undefined) {
    throw new Error('useBaselines must be used within a BaselinesProvider');
  }
  return context;
};
