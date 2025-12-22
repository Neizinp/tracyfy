/**
 * Background Tasks Provider
 *
 * Tracks background operations and provides status to UI components.
 * Used to show a status bar when the app is busy.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface BackgroundTask {
  id: string;
  message: string;
  startTime: number;
}

interface BackgroundTasksContextValue {
  tasks: BackgroundTask[];
  isWorking: boolean;
  startTask: (message: string) => string;
  endTask: (id: string) => void;
}

const BackgroundTasksContext = createContext<BackgroundTasksContextValue | undefined>(undefined);

export const BackgroundTasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const taskIdCounter = useRef(0);

  const startTask = useCallback((message: string): string => {
    const id = `task-${++taskIdCounter.current}`;
    console.log(`[BackgroundTasks] Starting task: ${id} - ${message}`);
    setTasks((prev) => [...prev, { id, message, startTime: Date.now() }]);
    return id;
  }, []);

  const endTask = useCallback((id: string) => {
    console.log(`[BackgroundTasks] Ending task: ${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const isWorking = tasks.length > 0;

  return (
    <BackgroundTasksContext.Provider value={{ tasks, isWorking, startTask, endTask }}>
      {children}
    </BackgroundTasksContext.Provider>
  );
};

export const useBackgroundTasks = (): BackgroundTasksContextValue => {
  const context = useContext(BackgroundTasksContext);
  if (!context) {
    throw new Error('useBackgroundTasks must be used within a BackgroundTasksProvider');
  }
  return context;
};
