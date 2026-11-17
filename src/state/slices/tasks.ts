/**
 * Background tasks: what the app is busy with (shown in the status bar).
 */
import type { StateCreator } from 'zustand';
import type { AppState } from '../store';

export interface BackgroundTask {
  id: string;
  message: string;
  startTime: number;
}

export interface TasksSlice {
  tasks: BackgroundTask[];
  /** Returns the task's id, to pass to endTask */
  startTask: (message: string) => string;
  endTask: (id: string) => void;
}

export const createTasksSlice: StateCreator<AppState, [], [], TasksSlice> = (set) => {
  let counter = 0;
  return {
    tasks: [],
    startTask: (message) => {
      const id = `task-${++counter}`;
      set((s) => ({ tasks: [...s.tasks, { id, message, startTime: Date.now() }] }));
      return id;
    },
    endTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  };
};

/** Run `work` while showing `message` in the status bar */
export async function withTask<T>(
  state: Pick<TasksSlice, 'startTask' | 'endTask'>,
  message: string,
  work: () => Promise<T>
): Promise<T> {
  const id = state.startTask(message);
  try {
    return await work();
  } finally {
    state.endTask(id);
  }
}
