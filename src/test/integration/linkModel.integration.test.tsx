/**
 * Links are the only way to express a relation between artifacts (DESIGN.md
 * §3.3). Views that show a relation read it from the link files, whichever end
 * the link was created from.
 */
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';
import type { Requirement, TestCase } from '../../types';

async function addRequirement(h: Harness, title: string): Promise<Requirement> {
  return (await act(() =>
    h.app().requirements.handleAddRequirement({
      title,
      description: '',
      text: '',
      rationale: '',
      status: 'draft',
      priority: 'medium',
      dateCreated: Date.now(),
    } as never)
  )) as Requirement;
}

async function addTestCase(h: Harness, title: string): Promise<TestCase> {
  return (await act(() =>
    h.app().testCases.handleAddTestCase({
      title,
      description: '',
      status: 'draft',
      priority: 'medium',
    } as never)
  )) as TestCase;
}

describe('integration: one link model', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  // jsdom has no ResizeObserver; the graph (reactflow) needs one to mount
  beforeAll(() => {
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  it('the test case list shows the requirements a test case verifies', async () => {
    h = await startApp({ initialRoute: '/test-cases' });
    const login = await addRequirement(h, 'Login');
    const logout = await addRequirement(h, 'Logout');
    const other = await addRequirement(h, 'Unrelated');
    const tc = await addTestCase(h, 'Log in and out');
    // One link from each end, and one that is not a verification
    await act(() => h.app().fileSystem.createLink(tc.id, login.id, 'verifies'));
    await act(() => h.app().fileSystem.createLink(logout.id, tc.id, 'verified_by'));
    await act(() => h.app().fileSystem.createLink(tc.id, other.id, 'related_to'));
    await h.settle();

    const row = (await screen.findByText('Log in and out')).closest('tr')!;
    expect(within(row).getByText(login.id)).toBeInTheDocument();
    expect(within(row).getByText(logout.id)).toBeInTheDocument();
    expect(within(row).queryByText(other.id)).toBeNull();
  }, 60_000);

  it('graph nodes count the links of their artifact', async () => {
    h = await startApp({ initialRoute: '/traceability' });
    const a = await addRequirement(h, 'Login');
    const b = await addRequirement(h, 'Logout');
    const c = await addRequirement(h, 'Session timeout');
    await act(() => h.app().fileSystem.createLink(a.id, b.id, 'related_to'));
    await act(() => h.app().fileSystem.createLink(a.id, c.id, 'depends_on'));
    await h.settle();

    fireEvent.click(await screen.findByRole('button', { name: 'Graph' }));

    const node = (id: string) =>
      document.querySelector(`.react-flow__node[data-id="${id}"]`) as HTMLElement;
    await waitFor(() => expect(node(a.id)).not.toBeNull());
    expect(within(node(a.id)).getByText('2')).toBeInTheDocument();
    expect(within(node(b.id)).getByText('1')).toBeInTheDocument();
    expect(within(node(c.id)).getByText('1')).toBeInTheDocument();
  }, 60_000);
});
