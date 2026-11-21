/**
 * Review (DESIGN.md §3.4, P6): review and approval are status transitions,
 * recorded in git. The Review page lists what is in review and the suspect
 * links; approving or sending back commits the artifact at once.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import git from 'isomorphic-git';
import fs from 'node:fs';
import { startApp, type Harness } from './appHarness';
import type { Requirement } from '../../types';

let h: Harness;
afterEach(() => h?.cleanup());

async function requirement(title: string, status: string): Promise<Requirement> {
  const created = await act(() =>
    h.app().addArtifact('requirement', {
      title,
      description: '',
      text: `${title} text`,
      rationale: '',
      status,
      priority: 'medium',
    } as never)
  );
  await h.settle();
  return created as Requirement;
}

const statusOf = (id: string) => h.readFile(`requirements/${id}.md`)!.match(/^status: (.*)$/m)?.[1];
const row = (id: string) => screen.getByRole('listitem', { name: new RegExp(`^${id} `) });

async function lastCommit() {
  const [commit] = await git.log({ fs, dir: h.dir, depth: 1 });
  return commit.commit;
}

describe('integration: review', () => {
  it('lists artifacts in review, not drafts or approved ones', async () => {
    h = await startApp({ initialRoute: '/review' });
    const inReview = await requirement('Session timeout', 'in_review');
    const draft = await requirement('Login', 'draft');
    const approved = await requirement('Logout', 'approved');

    expect(await screen.findByRole('heading', { name: 'In review (1)' })).toBeInTheDocument();
    expect(row(inReview.id)).toHaveTextContent('Session timeout');
    expect(screen.queryByRole('listitem', { name: new RegExp(`^${draft.id} `) })).toBeNull();
    expect(screen.queryByRole('listitem', { name: new RegExp(`^${approved.id} `) })).toBeNull();
  }, 60_000);

  it('Approve sets it approved and commits it at once, authored by the user, with the comment', async () => {
    h = await startApp({ initialRoute: '/review', userName: 'Ada' });
    const req = await requirement('Session timeout', 'in_review');

    const item = await waitFor(() => row(req.id));
    fireEvent.change(within(item).getByLabelText(`Comment on ${req.id}`), {
      target: { value: 'Checked with security' },
    });
    fireEvent.click(within(item).getByRole('button', { name: 'Approve' }));
    await h.settle();

    expect(statusOf(req.id)).toBe('approved');
    expect(h.readFile(`requirements/${req.id}.md`)).toMatch(/^approvalDate: /m);
    // Its own commit: nothing about it is pending any more
    expect(await h.dirtyPaths()).toEqual([]);
    const commit = await lastCommit();
    expect(commit.message).toBe(`Approve ${req.id}: Session timeout\n\nChecked with security\n`);
    expect(commit.author.name).toBe('Ada');
    expect(await screen.findByRole('heading', { name: 'In review (0)' })).toBeInTheDocument();
  }, 60_000);

  it('Send back returns it to draft and commits that decision', async () => {
    h = await startApp({ initialRoute: '/review' });
    const req = await requirement('Session timeout', 'in_review');

    fireEvent.click(
      within(await waitFor(() => row(req.id))).getByRole('button', { name: 'Send back' })
    );
    await h.settle();

    expect(statusOf(req.id)).toBe('draft');
    expect(await h.dirtyPaths()).toEqual([]);
    expect((await lastCommit()).message).toBe(`Send ${req.id} back to draft: Session timeout\n`);
  }, 60_000);

  it('a commit that fails is reported, not silently dropped', async () => {
    h = await startApp({ initialRoute: '/review' });
    const req = await requirement('Session timeout', 'in_review');
    h.stubGitOp('commitPaths', async () => {
      throw new Error('disk full');
    });

    fireEvent.click(
      within(await waitFor(() => row(req.id))).getByRole('button', { name: 'Approve' })
    );
    await h.settle();

    expect(await screen.findByText(/could not record the review of REQ-001/i)).toBeInTheDocument();
    // The status change is on disk but not committed: it shows as a pending change
    expect(await h.dirtyPaths()).toEqual([`requirements/${req.id}.md`]);
  }, 60_000);

  it('lists suspect links, and Mark reviewed clears them', async () => {
    h = await startApp({ initialRoute: '/review' });
    const req = await requirement('Session timeout', 'draft');
    const tc = (await act(() =>
      h.app().addArtifact('testCase', {
        title: 'Idle logout',
        description: '',
        status: 'draft',
        priority: 'medium',
      } as never)
    ))!;
    const link = await act(() => h.app().createLink(tc.id, req.id, 'verifies'));
    await act(() => h.app().updateArtifact('requirement', req.id, { text: 'Changed' }));
    await h.settle();

    expect(await screen.findByRole('heading', { name: 'Suspect links (1)' })).toBeInTheDocument();
    const suspect = screen.getByRole('listitem', { name: link.id });
    expect(suspect).toHaveTextContent(`${tc.id}Verifies${req.id}`);
    fireEvent.click(within(suspect).getByRole('button', { name: 'Mark reviewed' }));
    await h.settle();

    expect(await screen.findByRole('heading', { name: 'Suspect links (0)' })).toBeInTheDocument();
  }, 60_000);

  it('the sidebar leads to Review; workflows are gone', async () => {
    h = await startApp();
    expect(screen.queryByText(/workflow/i)).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Review' }));
    expect(await screen.findByRole('heading', { name: /^In review/ })).toBeInTheDocument();
    expect(h.exists('workflows')).toBe(false);
  }, 60_000);
});
