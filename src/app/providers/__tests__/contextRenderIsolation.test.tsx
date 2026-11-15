/**
 * Components that only use actions (showToast, startTask/endTask) must not
 * re-render when the toast/task lists change - those change on every save.
 */
import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { ToastProvider, useToast, useToasts } from '../ToastProvider';
import {
  BackgroundTasksProvider,
  useBackgroundTaskActions,
  useBackgroundTasks,
} from '../BackgroundTasksProvider';

describe('context render isolation', () => {
  it('useToast consumers do not re-render when a toast is shown', () => {
    let actionRenders = 0;
    let listRenders = 0;
    let show: ReturnType<typeof useToast>['showToast'] = () => {};

    const ActionsOnly = () => {
      actionRenders++;
      show = useToast().showToast;
      return null;
    };
    const ListReader = () => {
      listRenders++;
      return <span data-testid="count">{useToasts().length}</span>;
    };

    const { getByTestId } = render(
      <ToastProvider>
        <ActionsOnly />
        <ListReader />
      </ToastProvider>
    );
    act(() => show('hello', 'info', 0));

    expect(getByTestId('count').textContent).toBe('1');
    expect(listRenders).toBe(2);
    expect(actionRenders).toBe(1);
  });

  it('useBackgroundTaskActions consumers do not re-render when tasks change', () => {
    let actionRenders = 0;
    let actions: ReturnType<typeof useBackgroundTaskActions> | null = null;

    const ActionsOnly = () => {
      actionRenders++;
      actions = useBackgroundTaskActions();
      return null;
    };
    const StatusReader = () => (
      <span data-testid="working">{String(useBackgroundTasks().isWorking)}</span>
    );

    const { getByTestId } = render(
      <BackgroundTasksProvider>
        <ActionsOnly />
        <StatusReader />
      </BackgroundTasksProvider>
    );

    let id = '';
    act(() => {
      id = actions!.startTask('Saving...');
    });
    expect(getByTestId('working').textContent).toBe('true');
    act(() => actions!.endTask(id));
    expect(getByTestId('working').textContent).toBe('false');

    expect(actionRenders).toBe(1);
  });
});
