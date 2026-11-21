/**
 * Baselines are git tags (docs/DESIGN.md §3.5): a named commit of the whole
 * project. Nothing is stored in the project files; the tag is the baseline.
 */
import type { StateCreator } from 'zustand';
import type { AppState } from '../store';
import type { ProjectBaseline } from '../../types';
import { repository } from '../../storage/repository';
import { baselineNameError } from '../../domain/baselines';

export interface BaselinesSlice {
  /** Newest first */
  baselines: ProjectBaseline[];
  baselinesLoading: boolean;
  /** Tag the current commit; shows a toast and returns null if that fails */
  createBaseline: (name: string, description: string) => Promise<ProjectBaseline | null>;
  refreshBaselines: () => Promise<void>;
}

export const createBaselinesSlice: StateCreator<AppState, [], [], BaselinesSlice> = (set, get) => ({
  baselines: [],
  baselinesLoading: false,

  refreshBaselines: async () => {
    if (!get().isReady) {
      set({ baselines: [] });
      return;
    }
    set({ baselinesLoading: true });
    try {
      set({ baselines: await repository.baselines() });
    } catch (err) {
      console.error('Failed to load baselines:', err);
    } finally {
      set({ baselinesLoading: false });
    }
  },

  createBaseline: async (name, description) => {
    const { showToast } = get();
    const problem = baselineNameError(
      name,
      get().baselines.map((b) => b.name)
    );
    if (problem) {
      showToast(problem, 'error');
      return null;
    }
    try {
      await repository.createBaseline(name, description || `Baseline ${name}`);
      const all = await repository.baselines();
      set({ baselines: all });
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
});
