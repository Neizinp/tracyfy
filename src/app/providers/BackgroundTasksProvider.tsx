/**
 * Background Tasks Provider
 *
 * Tracks background operations and provides status to UI components.
 * Used to show a status bar when the app is busy.
 *
 * State (the task list) and actions (startTask/endTask) live in separate
 * contexts: most consumers only start/end tasks and must not re-render every
 * time a task starts or finishes (which happens on every save).
 */

import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { debug } from '../../utils/debug';

interface BackgroundTask {
  id: string;
  message: string;
  startTime: number;
}

interface BackgroundTaskActions {
  startTask: (message: string) => string;
  endTask: (id: string) => void;
}

interface BackgroundTasksState {
  tasks: BackgroundTask[];
  isWorking: boolean;
}

type BackgroundTasksContextValue = BackgroundTasksState & BackgroundTaskActions;

const BackgroundTasksStateContext = createContext<BackgroundTasksState | undefined>(undefined);
const BackgroundTaskActionsContext = createContext<BackgroundTaskActions | undefined>(undefined);

export const BackgroundTasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const taskIdCounter = useRef(0);

  const startTask = useCallback((message: string): string => {
    const id = `task-${++taskIdCounter.current}`;
    debug.log(`[BackgroundTasks] Starting task: ${id} - ${message}`);
    setTasks((prev) => [...prev, { id, message, startTime: Date.now() }]);
    return id;
  }, []);

  const endTask = useCallback((id: string) => {
    debug.log(`[BackgroundTasks] Ending task: ${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const actions = useMemo(() => ({ startTask, endTask }), [startTask, endTask]);
  const state = useMemo(() => ({ tasks, isWorking: tasks.length > 0 }), [tasks]);

  return (
    <BackgroundTaskActionsContext.Provider value={actions}>
      <BackgroundTasksStateContext.Provider value={state}>
        {children}
      </BackgroundTasksStateContext.Provider>
    </BackgroundTaskActionsContext.Provider>
  );
};

/**
 * Stable startTask/endTask. Prefer this unless you need the task list,
 * so the component doesn't re-render whenever a task starts or ends.
 */
export const useBackgroundTaskActions = (): BackgroundTaskActions => {
  const actions = useContext(BackgroundTaskActionsContext);
  if (!actions) {
    throw new Error('useBackgroundTaskActions must be used within a BackgroundTasksProvider');
  }
  return actions;
};

/**
 * Task list + actions. Re-renders on every task change (e.g. the status bar).
 */
export const useBackgroundTasks = (): BackgroundTasksContextValue => {
  const state = useContext(BackgroundTasksStateContext);
  const actions = useContext(BackgroundTaskActionsContext);
  if (!state || !actions) {
    throw new Error('useBackgroundTasks must be used within a BackgroundTasksProvider');
  }
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
};
