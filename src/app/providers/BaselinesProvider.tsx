/**
 * Baselines are git tags (docs/DESIGN.md §3.5): a named commit of the whole
 * project. Nothing is stored in the project files; the tag is the baseline.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { repository } from '../../storage/repository';
import { useFileSystem } from './FileSystemProvider';
import { useToast } from './ToastProvider';
import type { ProjectBaseline } from '../../types';
import { baselineNameError } from '../../domain/baselines';

interface BaselinesContextValue {
  /** Newest first */
  baselines: ProjectBaseline[];
  loading: boolean;
  /** Tag the current commit */
  createBaseline: (name: string, description: string) => Promise<ProjectBaseline | null>;
  refreshBaselines: () => Promise<void>;
}

const BaselinesContext = createContext<BaselinesContextValue | undefined>(undefined);

export const BaselinesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [baselines, setBaselines] = useState<ProjectBaseline[]>([]);
  const [loading, setLoading] = useState(false);
  const { isReady, directoryName } = useFileSystem();
  const { showToast } = useToast();

  const refreshBaselines = useCallback(async () => {
    if (!isReady) {
      setBaselines([]);
      return;
    }
    setLoading(true);
    try {
      setBaselines(await repository.baselines());
    } catch (err) {
      console.error('Failed to load baselines:', err);
    } finally {
      setLoading(false);
    }
  }, [isReady]);

  useEffect(() => {
    refreshBaselines();
  }, [refreshBaselines, directoryName]);

  const createBaseline = useCallback(
    async (name: string, description: string) => {
      const problem = baselineNameError(
        name,
        baselines.map((b) => b.name)
      );
      if (problem) {
        showToast(problem, 'error');
        return null;
      }
      try {
        await repository.createBaseline(name, description || `Baseline ${name}`);
        const all = await repository.baselines();
        setBaselines(all);
        showToast(`Baseline ${name} created`, 'success');
        return all.find((b) => b.name === name) ?? null;
      } catch (err) {
        console.error('Failed to create baseline:', err);
        showToast(
          `Could not create baseline ${name}: ${err instanceof Error ? err.message : String(err)}`,
          'error'
        );
        return null;
      }
    },
    [baselines, showToast]
  );

  const value: BaselinesContextValue = useMemo(
    () => ({ baselines, loading, createBaseline, refreshBaselines }),
    [baselines, createBaseline, loading, refreshBaselines]
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
