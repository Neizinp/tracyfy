/**
 * The traceability dashboard must reflect links created in the app
 * (stored as link files).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { startApp, type Harness } from './appHarness';
import type { Requirement } from '../../types';

async function addRequirement(h: Harness, title: string): Promise<Requirement> {
  const created = await act(() =>
    h.app().requirements.handleAddRequirement({
      title,
      description: '',
      text: '',
      rationale: '',
      status: 'draft',
      priority: 'medium',
      dateCreated: Date.now(),
    } as never)
  );
  return created as Requirement;
}

describe('integration: traceability dashboard', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('artifacts linked in the app are not reported as having no links', async () => {
    h = await startApp({ initialRoute: '/traceability' });
    const a = await addRequirement(h, 'Login');
    const b = await addRequirement(h, 'Logout');
    await addRequirement(h, 'Unrelated');
    await act(() => h.app().fileSystem.createLink(a.id, b.id, 'related_to'));
    await h.settle();

    fireEvent.click(await screen.findByRole('button', { name: /^gaps/i }));

    // a → b is linked; only c has no links at all
    expect(await screen.findAllByText('No links')).toHaveLength(1);
    expect(screen.getAllByText('No incoming links')).toHaveLength(1); // a
    expect(screen.getAllByText('No outgoing links')).toHaveLength(1); // b
  }, 60_000);

  it('clicking an artifact in the gap list opens it', async () => {
    h = await startApp({ initialRoute: '/traceability' });
    const req = await addRequirement(h, 'Unlinked requirement');
    await h.settle();

    fireEvent.click(await screen.findByRole('button', { name: /^gaps/i }));
    fireEvent.click(await screen.findByText(req.id, { selector: 'span[style*="monospace"]' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByRole('textbox')[0]).toHaveValue('Unlinked requirement');
  }, 60_000);

  it('an orphan link (target file removed outside the app) is shown and can be removed', async () => {
    h = await startApp({ initialRoute: '/traceability' });
    const a = await addRequirement(h, 'Login');
    const b = await addRequirement(h, 'Logout');
    const link = await act(() => h.app().fileSystem.createLink(a.id, b.id, 'related_to'));
    // e.g. removed by hand or by a pull; the app itself never removes artifact files
    fs.rmSync(path.join(h.dir, `requirements/${b.id}.md`));
    await h.restart();

    fireEvent.click(await screen.findByRole('button', { name: /^gaps/i }));
    expect(await screen.findByText('Orphan link')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Remove the orphan link'));
    await h.settle();

    expect(h.app().fileSystem.links).toEqual([]);
    expect(h.exists(`links/${link.id}.md`)).toBe(false);
    expect(await h.invisibleDirtyPaths()).toEqual([]);
  }, 60_000);

  it('links to risks and documents count in traceability', async () => {
    h = await startApp({ initialRoute: '/traceability' });
    const req = await addRequirement(h, 'Login');
    const risk = (await act(() =>
      h.app().risks.handleAddRisk({
        title: 'Lockout',
        description: '',
        mitigation: 'x',
        status: 'identified',
        dateCreated: Date.now(),
      } as never)
    ))!;
    const doc = (await act(() =>
      h.app().documents.handleAddDocument({
        title: 'Login spec',
        structure: [],
        dateCreated: Date.now(),
      } as never)
    ))!;
    const unlinkedRisk = (await act(() =>
      h.app().risks.handleAddRisk({
        title: 'Unmitigated supplier risk',
        description: '',
        mitigation: '',
        status: 'identified',
        dateCreated: Date.now(),
      } as never)
    ))!;
    await act(() => h.app().fileSystem.createLink(req.id, risk.id, 'related_to'));
    await act(() => h.app().fileSystem.createLink(doc.id, req.id, 'satisfies'));
    await h.settle();

    // Overview counts all four artifacts; only the unlinked risk is a gap
    expect((await screen.findByText('Total Artifacts')).previousSibling).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: 'Gaps (1)' })).toBeInTheDocument();

    // The unlinked risk is a gap; the linked risk and document are not "No links"
    fireEvent.click(screen.getByRole('button', { name: 'Gaps (1)' }));
    expect(await screen.findAllByText('No links')).toHaveLength(1);
    expect(screen.getByText(unlinkedRisk.title)).toBeInTheDocument();
  }, 60_000);
});
