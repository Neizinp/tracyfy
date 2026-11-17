/**
 * Components re-render only when what they select changes. Components that
 * only use actions (showToast, startTask/endTask) must not re-render when the
 * toast/task lists change - those change on every save.
 */
import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { StoreProvider, createAppStore, useAppStore } from '..';

describe('store render isolation', () => {
  it('a component using showToast does not re-render when a toast is shown', () => {
    const store = createAppStore();
    let actionRenders = 0;
    let listRenders = 0;

    const ActionsOnly = () => {
      actionRenders++;
      useAppStore((s) => s.showToast);
      return null;
    };
    const ListReader = () => {
      listRenders++;
      return <span data-testid="count">{useAppStore((s) => s.toasts).length}</span>;
    };

    const { getByTestId } = render(
      <StoreProvider store={store}>
        <ActionsOnly />
        <ListReader />
      </StoreProvider>
    );
    act(() => store.getState().showToast('hello', 'info', 0));

    expect(getByTestId('count').textContent).toBe('1');
    expect(listRenders).toBe(2);
    expect(actionRenders).toBe(1);
  });

  it('a component using startTask/endTask does not re-render when tasks change', () => {
    const store = createAppStore();
    let actionRenders = 0;

    const ActionsOnly = () => {
      actionRenders++;
      useAppStore((s) => s.startTask);
      useAppStore((s) => s.endTask);
      return null;
    };
    const StatusReader = () => (
      <span data-testid="working">{String(useAppStore((s) => s.tasks.length > 0))}</span>
    );

    const { getByTestId } = render(
      <StoreProvider store={store}>
        <ActionsOnly />
        <StatusReader />
      </StoreProvider>
    );

    let id = '';
    act(() => {
      id = store.getState().startTask('Saving...');
    });
    expect(getByTestId('working').textContent).toBe('true');
    act(() => store.getState().endTask(id));
    expect(getByTestId('working').textContent).toBe('false');

    expect(actionRenders).toBe(1);
  });

  it('a component reading requirements does not re-render when links or git status change', () => {
    const store = createAppStore();
    let renders = 0;
    const RequirementCount = () => {
      renders++;
      return <span data-testid="reqs">{useAppStore((s) => s.artifacts.requirement).length}</span>;
    };

    const { getByTestId } = render(
      <StoreProvider store={store}>
        <RequirementCount />
      </StoreProvider>
    );
    act(() => {
      store.setState({
        links: [
          {
            id: 'LINK-001',
            sourceId: 'TC-001',
            targetId: 'REQ-001',
            type: 'verifies',
            dateCreated: 0,
            lastModified: 0,
            revision: '01',
          },
        ],
      });
      store.setState({ pendingChanges: [{ path: 'links/LINK-001.md', status: 'new' }] });
      store.setState((s) => ({ artifacts: { ...s.artifacts, risk: [] } }));
    });
    expect(renders).toBe(1);

    act(() =>
      store.setState((s) => ({
        artifacts: {
          ...s.artifacts,
          requirement: [{ id: 'REQ-001' } as (typeof s.artifacts.requirement)[number]],
        },
      }))
    );
    expect(getByTestId('reqs').textContent).toBe('1');
    expect(renders).toBe(2);
  });
});
