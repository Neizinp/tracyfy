/**
 * Status Bar
 *
 * A minimal status bar at the bottom of the screen that shows when
 * background operations are in progress.
 */

import { useBackgroundTasks } from '../app/providers/BackgroundTasksProvider';
import { Loader2 } from 'lucide-react';

export function StatusBar() {
  const isE2E =
    typeof window !== 'undefined' &&
    (window as Window & { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__;
  const { tasks, isWorking } = useBackgroundTasks();

  if (!isWorking || isE2E) {
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
        height: '26px',
        backgroundColor: 'var(--color-bg-sidebar)',
        borderTop: '1px solid var(--color-border)',
        color: 'var(--color-text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 500,
        zIndex: 9999,
        boxShadow: 'var(--shadow-popover)',
      }}
    >
      <Loader2
        size={14}
        style={{
          animation: 'spin 1s linear infinite',
          color: 'var(--color-accent)',
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
