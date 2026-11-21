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
    h.app().addArtifact('requirement', {
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
    h.app().addArtifact('testCase', {
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

  it('artifact files hold no relations, and linking changes neither artifact', async () => {
    h = await startApp();
    const req = await addRequirement(h, 'Login');
    const tc = await addTestCase(h, 'Log in');
    await h.settle();
    const files = [`requirements/${req.id}.md`, `test-cases/${tc.id}.md`];
    const before = files.map((f) => h.readFile(f));
    const dirtyBefore = await h.dirtyPaths(); // new artifacts wait for the user's commit

    for (const content of before) {
      expect(content).not.toMatch(/requirementIds|useCaseIds|linkedArtifacts/);
    }

    const link = await act(() => h.app().createLink(tc.id, req.id, 'verifies'));
    await act(() => h.app().deleteLink(link.id));
    await h.settle();

    expect(files.map((f) => h.readFile(f))).toEqual(before);
    expect(await h.dirtyPaths()).toEqual(dirtyBefore);
  }, 60_000);

  it('a removed link that was committed keeps its ID: the next link gets a new one', async () => {
    h = await startApp();
    const req = await addRequirement(h, 'Login');
    const tc = await addTestCase(h, 'Log in');
    const first = await act(() => h.app().createLink(tc.id, req.id, 'verifies'));
    await h.settle();
    for (const p of await h.dirtyPaths()) await act(() => h.app().commitFile(p, 'Add'));

    await act(() => h.app().deleteLink(first.id));
    await h.settle();
    expect(h.app().links).toEqual([]);
    // The removal is a pending change of the link's file, not a missing file
    expect(await h.dirtyPaths()).toEqual([`links/${first.id}.md`]);
    expect(h.exists(`links/${first.id}.md`)).toBe(true);

    const second = await act(() => h.app().createLink(tc.id, req.id, 'verifies'));
    expect(second.id).not.toBe(first.id);

    await act(() => h.app().reload());
    expect(h.app().links.map((l) => l.id)).toEqual([second.id]);
    expect(h.app().fileProblems).toEqual([]);
  }, 60_000);

  it('the test case list shows the requirements a test case verifies', async () => {
    h = await startApp({ initialRoute: '/test-cases' });
    const login = await addRequirement(h, 'Login');
    const logout = await addRequirement(h, 'Logout');
    const other = await addRequirement(h, 'Unrelated');
    const tc = await addTestCase(h, 'Log in and out');
    // Two verifications, and one link that is not a verification
    await act(() => h.app().createLink(tc.id, login.id, 'verifies'));
    await act(() => h.app().createLink(tc.id, logout.id, 'verifies'));
    await act(() => h.app().createLink(tc.id, other.id, 'related_to'));
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
    await act(() => h.app().createLink(a.id, b.id, 'related_to'));
    await act(() => h.app().createLink(a.id, c.id, 'depends_on'));
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
