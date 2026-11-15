/**
 * The traceability dashboard must reflect links created in the app
 * (stored as link files), not only the legacy embedded linkedArtifacts.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
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

  it('an orphan link (target permanently deleted) is shown and can be removed', async () => {
    h = await startApp({ initialRoute: '/traceability' });
    const a = await addRequirement(h, 'Login');
    const b = await addRequirement(h, 'Logout');
    const link = await act(() => h.app().fileSystem.createLink(a.id, b.id, 'related_to'));
    await act(async () => h.app().requirements.handlePermanentDeleteRequirement(b.id));
    await h.settle();

    fireEvent.click(await screen.findByRole('button', { name: /^gaps/i }));
    expect(await screen.findByText('Orphan link')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Remove the orphan link'));
    await h.settle();

    expect(h.app().fileSystem.links).toEqual([]);
    expect(h.exists(`links/${link.id}.md`)).toBe(false);
    expect(await h.invisibleDirtyPaths()).toEqual([]);
  }, 60_000);
});
