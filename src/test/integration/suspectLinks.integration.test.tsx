/**
 * Suspect links (DESIGN.md §3.3, P3): a link remembers the fingerprint of its
 * target from when it was last reviewed. When the target's content changes,
 * the link is suspect until someone marks it reviewed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';
import type { Link, Requirement, TestCase } from '../../types';

let h: Harness;
afterEach(() => h?.cleanup());

const reviewedIn = (link: Link) =>
  h.readFile(`links/${link.id}.md`)!.match(/^reviewed: (\w+)$/m)?.[1];

/** A requirement verified by a test case, all committed */
async function verifiedRequirement() {
  const req = (await act(() =>
    h.app().addArtifact('requirement', {
      title: 'Session timeout',
      description: '',
      text: 'The system shall log out after 15 minutes.',
      rationale: '',
      status: 'draft',
      priority: 'medium',
    } as never)
  )) as Requirement;
  const tc = (await act(() =>
    h.app().addArtifact('testCase', {
      title: 'Idle logout',
      description: '',
      status: 'draft',
      priority: 'medium',
    } as never)
  )) as TestCase;
  const link = await act(() => h.app().createLink(tc.id, req.id, 'verifies'));
  await h.settle();
  for (const p of await h.dirtyPaths()) await act(() => h.app().commitFile(p, `Add ${p}`));
  await h.settle();
  return { req, tc, link };
}

async function editRequirementText(title: string, text: string) {
  fireEvent.click(screen.getByRole('link', { name: /requirements/i }));
  fireEvent.click(await screen.findByText(title));
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(await within(dialog).findByDisplayValue(/log out after/), {
    target: { value: text },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: /save/i }));
  await h.settle();
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

/** The link rows on the Relationships tab of an artifact, opened from its list */
async function openLinksOf(listName: RegExp, title: string) {
  fireEvent.click(screen.getByRole('link', { name: listName }));
  fireEvent.click(await screen.findByText(title));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Relationships' }));
  return dialog;
}

describe('integration: suspect links', () => {
  it('a new link is reviewed against its target as it is, so it is not suspect', async () => {
    h = await startApp({ initialRoute: '/test-cases' });
    const { link } = await verifiedRequirement();

    expect(reviewedIn(link)).toMatch(/^[0-9a-f]{8}$/);
    const dialog = await openLinksOf(/test cases/i, 'Idle logout');
    expect(within(dialog).queryByText('Suspect')).toBeNull();
  }, 60_000);

  it('editing the target makes the link suspect until it is marked reviewed', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    const { req, link } = await verifiedRequirement();
    const before = reviewedIn(link);

    await editRequirementText('Session timeout', 'The system shall log out after 5 minutes.');

    // Pending Changes says what the edit does to traceability
    expect(await screen.findByText(/Makes 1 link suspect/)).toBeInTheDocument();
    // The test case's link to it is suspect; the link file is not touched by the edit
    expect(reviewedIn(link)).toBe(before);
    expect(await h.dirtyPaths()).toEqual([`requirements/${req.id}.md`]);
    let dialog = await openLinksOf(/test cases/i, 'Idle logout');
    const row = within(dialog).getByRole('listitem');
    expect(within(row).getByText('Suspect')).toBeInTheDocument();

    // Reviewing it is a change to the link file, like any other pending change
    fireEvent.click(within(row).getByRole('button', { name: 'Mark reviewed' }));
    await h.settle();
    expect(within(row).queryByText('Suspect')).toBeNull();
    expect(reviewedIn(link)).not.toBe(before);
    expect((await h.dirtyPaths()).sort()).toEqual(
      [`links/${link.id}.md`, `requirements/${req.id}.md`].sort()
    );
    fireEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));

    // Still reviewed after reopening the folder
    await h.restart();
    dialog = await openLinksOf(/test cases/i, 'Idle logout');
    expect(within(dialog).queryByText('Suspect')).toBeNull();
  }, 60_000);

  it('changing only metadata of the target (priority) does not make it suspect', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    await verifiedRequirement();

    fireEvent.click(await screen.findByText('Session timeout'));
    const edit = await screen.findByRole('dialog');
    fireEvent.change(within(edit).getByLabelText('Priority'), { target: { value: 'high' } });
    fireEvent.click(within(edit).getByRole('button', { name: /save/i }));
    await h.settle();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(screen.queryByText(/link suspect/)).toBeNull();
    const dialog = await openLinksOf(/test cases/i, 'Idle logout');
    expect(within(dialog).queryByText('Suspect')).toBeNull();
  }, 60_000);

  it('a target changed outside the app (a pull) shows up as a suspect link in the gap list', async () => {
    h = await startApp({ initialRoute: '/traceability' });
    const { req, tc, link } = await verifiedRequirement();
    const file = path.join(h.dir, `requirements/${req.id}.md`);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('15 minutes', '2 minutes'));
    await h.restart();

    fireEvent.click(await screen.findByRole('button', { name: 'Gaps (1)' }));
    const label = screen.getByText('Suspect link');
    const gap = label.parentElement!;
    expect(within(gap).getByText(tc.id)).toBeInTheDocument();
    expect(within(gap).getByText(`${req.id} changed (${link.id})`)).toBeInTheDocument();

    fireEvent.click(within(gap).getByRole('button', { name: 'Mark reviewed' }));
    await h.settle();
    expect(await screen.findByRole('button', { name: 'Gaps (0)' })).toBeInTheDocument();
    // The pulled requirement file was changed by hand here, so it is pending too
    expect((await h.dirtyPaths()).sort()).toEqual(
      [`links/${link.id}.md`, `requirements/${req.id}.md`].sort()
    );
  }, 60_000);

  it('a link file without a fingerprint has never been reviewed, so it is suspect', async () => {
    h = await startApp({ initialRoute: '/test-cases' });
    const { link } = await verifiedRequirement();
    const file = path.join(h.dir, `links/${link.id}.md`);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^reviewed: .*\n/m, ''));
    await h.restart();

    const dialog = await openLinksOf(/test cases/i, 'Idle logout');
    expect(within(dialog).getByText('Suspect')).toBeInTheDocument();
  }, 60_000);
});
