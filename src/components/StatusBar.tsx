/**
 * Status Bar
 *
 * A minimal status bar at the bottom of the screen that shows when
 * background operations are in progress.
 */

import { useBackgroundTasks } from '../app/providers/BackgroundTasksProvider';
import { Loader2 } from 'lucide-react';

export function StatusBar() {
  const { tasks, isWorking } = useBackgroundTasks();

  if (!isWorking) {
    return null;
  }

  // Show the most recent task message, with remaining count if multiple
  const message =
    tasks.length === 1
      ? tasks[0].message
      : `${tasks[0].message} (${tasks.length - 1} operations remaining)`;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '28px',
        backgroundColor: 'var(--color-accent)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 500,
        zIndex: 9999,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <Loader2
        size={14}
        style={{
          animation: 'spin 1s linear infinite',
        }}
      />
      {message}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
