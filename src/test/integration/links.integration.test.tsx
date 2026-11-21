/**
 * Links, end to end through the real UI, real disk and real git.
 *
 * Every test checks what the user experiences: the link shows up in the UI,
 * the link file exists on disk and is a pending change like any other file
 * (the user commits it), and the linked artifacts are NOT marked as modified.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';
import type { Requirement } from '../../types';

async function addRequirement(h: Harness, title: string): Promise<Requirement> {
  const before = new Set(h.app().globalState.requirements.map((r) => r.id));
  await act(() =>
    h.app().requirements.handleAddRequirement({
      title,
      description: '',
      text: `${title} text`,
      rationale: '',
      status: 'draft',
      priority: 'medium',
      dateCreated: Date.now(),
    } as unknown as Parameters<ReturnType<typeof h.app>['requirements']['handleAddRequirement']>[0])
  );
  let created: Requirement | undefined;
  await waitFor(() => {
    created = h.app().globalState.requirements.find((r) => !before.has(r.id));
    expect(created).toBeDefined();
  });
  return created!;
}

/** Commit everything that is pending, like pressing commit in the panel */
async function commitAll(h: Harness) {
  await h.settle();
  for (const p of await h.dirtyPaths()) {
    await act(() => h.app().fileSystem.commitFile(p, `Commit ${p}`));
  }
  await h.settle();
  expect(await h.dirtyPaths()).toEqual([]);
}

function submitButton(name: RegExp) {
  return screen.getAllByRole('button', { name }).find((b) => b.getAttribute('type') === 'submit')!;
}

/** Open a requirement's dialog on the Relationships tab, exactly like clicking it in the list */
async function openRelationships(h: Harness, req: Requirement) {
  await act(async () => h.app().requirements.handleEdit(req));
  fireEvent.click(await screen.findByRole('button', { name: 'Relationships' }));
}

async function createLinkFromRequirementDialog(
  h: Harness,
  source: Requirement,
  target: Requirement
) {
  await openRelationships(h, source);
  fireEvent.click(screen.getByRole('button', { name: /\+ add link/i }));
  const dialog = await screen.findByRole('dialog', { name: /create link/i });
  fireEvent.click(within(dialog).getByText(target.title));
  fireEvent.click(submitButton(/create link/i));
  await h.settle();
}

describe('integration: links', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('creating a link from a requirement dialog shows it and writes it as a pending change', async () => {
    h = await startApp();
    const a = await addRequirement(h, 'Login');
    const b = await addRequirement(h, 'Logout');
    await commitAll(h);

    await createLinkFromRequirementDialog(h, a, b);

    // In app state (what every view renders from)
    await waitFor(() =>
      expect(h.app().fileSystem.links).toEqual([
        expect.objectContaining({ sourceId: a.id, targetId: b.id }),
      ])
    );
    const linkId = h.app().fileSystem.links[0].id;
    // On disk and pending; nothing else became dirty (no "commit the requirement again")
    expect(h.exists(`links/${linkId}.md`)).toBe(true);
    expect(await h.dirtyPaths()).toEqual([`links/${linkId}.md`]);
    expect(await h.invisibleDirtyPaths()).toEqual([]);
    expect(await screen.findByText(`${linkId}: ${a.id} related_to ${b.id}`)).toBeInTheDocument();

    // Visible in the requirement's Relationships tab
    await openRelationships(h, a);
    const reqDialog = await screen.findByRole('dialog');
    expect(within(reqDialog).getByText(b.id)).toBeInTheDocument();
  }, 60_000);

  it('both ends of a link open the linked artifact from the Relationships tab', async () => {
    h = await startApp();
    const a = await addRequirement(h, 'Login');
    const b = await addRequirement(h, 'Logout');
    await act(() => h.app().fileSystem.createLink(a.id, b.id, 'related_to'));
    await h.settle();

    // Outgoing: from a, open b
    await openRelationships(h, a);
    fireEvent.click(within(await screen.findByRole('dialog')).getByText(b.id));
    const bDialog = await screen.findByRole('dialog', { name: `Edit Requirement - ${b.id}` });

    // Incoming: from b, open a
    fireEvent.click(within(bDialog).getByRole('button', { name: 'Relationships' }));
    fireEvent.click(await within(bDialog).findByText(a.id));
    expect(
      await screen.findByRole('dialog', { name: `Edit Requirement - ${a.id}` })
    ).toBeInTheDocument();
  }, 60_000);

  it('links survive a restart', async () => {
    h = await startApp();
    const a = await addRequirement(h, 'Login');
    const b = await addRequirement(h, 'Logout');
    await createLinkFromRequirementDialog(h, a, b);

    await h.restart();

    expect(h.app().fileSystem.links).toEqual([
      expect.objectContaining({ sourceId: a.id, targetId: b.id }),
    ]);
  }, 60_000);

  it('the Add button on the Links page creates a link with a chosen source', async () => {
    h = await startApp({ initialRoute: '/links' });
    const a = await addRequirement(h, 'Login');
    const b = await addRequirement(h, 'Logout');
    await commitAll(h);

    const addButtons = await screen.findAllByRole('button', { name: /^add$/i });
    fireEvent.click(addButtons[0]);
    const dialog = await screen.findByRole('dialog', { name: /create link/i });
    fireEvent.change(within(dialog).getByLabelText('Source Artifact'), {
      target: { value: a.id },
    });
    fireEvent.click(within(dialog).getByText(b.title));
    fireEvent.click(submitButton(/create link/i));
    await h.settle();

    await waitFor(() =>
      expect(h.app().fileSystem.links).toEqual([
        expect.objectContaining({ sourceId: a.id, targetId: b.id }),
      ])
    );
    expect(await h.dirtyPaths()).toEqual([`links/${h.app().fileSystem.links[0].id}.md`]);
  }, 60_000);

  it('removing a committed link is a pending deletion that can be committed, without touching the requirement', async () => {
    h = await startApp();
    const a = await addRequirement(h, 'Login');
    const b = await addRequirement(h, 'Logout');
    await createLinkFromRequirementDialog(h, a, b);
    await commitAll(h);
    const linkId = h.app().fileSystem.links[0].id;

    await openRelationships(h, a);
    fireEvent.click(await screen.findByTitle('Remove link'));
    await h.settle();

    await waitFor(() => expect(h.app().fileSystem.links).toEqual([]));
    expect(h.exists(`links/${linkId}.md`)).toBe(false);
    expect(await h.dirtyPaths()).toEqual([`links/${linkId}.md`]);
    expect(await screen.findByText('Deleted')).toBeInTheDocument();

    await commitAll(h);
    expect(await h.dirtyPaths()).toEqual([]);
  }, 60_000);

  it('saving a requirement dialog with a change saves it (control for the no-op test)', async () => {
    h = await startApp();
    const a = await addRequirement(h, 'Login');
    await commitAll(h);

    await act(async () => h.app().requirements.handleEdit(a));
    fireEvent.change(await screen.findByDisplayValue('Login'), { target: { value: 'Login v2' } });
    fireEvent.click(await screen.findByRole('button', { name: /save changes/i }));
    await h.settle();

    await waitFor(() =>
      expect(h.app().globalState.requirements[0]).toMatchObject({
        title: 'Login v2',
        revision: '02',
      })
    );
    expect(await h.dirtyPaths()).toEqual([`requirements/${a.id}.md`]);
  }, 60_000);

  it('saving a requirement dialog without changes does not mark it as modified', async () => {
    h = await startApp();
    const a = await addRequirement(h, 'Login');
    await commitAll(h);

    await act(async () => h.app().requirements.handleEdit(a));
    fireEvent.click(await screen.findByRole('button', { name: /save changes/i }));
    await h.settle();

    expect(await h.dirtyPaths()).toEqual([]);
  }, 60_000);

  it('a requirement can be linked to a risk, and a risk can be a link source', async () => {
    h = await startApp({ initialRoute: '/links' });
    const req = await addRequirement(h, 'Login');
    const risk = (await act(() =>
      h.app().risks.handleAddRisk({
        title: 'Credential stuffing',
        description: '',
        mitigation: 'Rate limiting',
        status: 'identified',
        dateCreated: Date.now(),
      } as never)
    ))!;
    await h.settle();

    // Requirement dialog -> Add Link -> target type Risk
    await openRelationships(h, req);
    fireEvent.click(screen.getByRole('button', { name: /\+ add link/i }));
    let dialog = await screen.findByRole('dialog', { name: /create link/i });
    fireEvent.click(within(dialog).getByRole('button', { name: /^risk$/i }));
    fireEvent.click(within(dialog).getByText('Credential stuffing'));
    fireEvent.click(submitButton(/create link/i));
    await h.settle();
    await waitFor(() =>
      expect(h.app().fileSystem.links).toEqual([
        expect.objectContaining({ sourceId: req.id, targetId: risk.id }),
      ])
    );

    // Links page -> Add -> the risk as source
    fireEvent.click((await screen.findAllByRole('button', { name: /^add$/i }))[0]);
    dialog = await screen.findByRole('dialog', { name: /create link/i });
    fireEvent.change(within(dialog).getByLabelText('Source Artifact'), {
      target: { value: risk.id },
    });
    fireEvent.click(within(dialog).getByText('Login'));
    fireEvent.click(submitButton(/create link/i));
    await h.settle();
    await waitFor(() => expect(h.app().fileSystem.links).toHaveLength(2));
    expect(h.app().fileSystem.links).toContainEqual(
      expect.objectContaining({ sourceId: risk.id, targetId: req.id })
    );
  }, 60_000);

  it('every artifact type can be a link target and a link source', async () => {
    h = await startApp({ initialRoute: '/links' });
    const base = { description: '', status: 'draft', priority: 'medium', dateCreated: Date.now() };
    const req = await addRequirement(h, 'Login');
    const targets = {
      REQ: await addRequirement(h, 'Logout'),
      UC: await act(() =>
        h.app().useCases.handleAddUseCase({ ...base, title: 'Sign in' } as never)
      ),
      TC: await act(() =>
        h.app().testCases.handleAddTestCase({ ...base, title: 'Login works' } as never)
      ),
      INFO: await act(() =>
        h.app().information.handleAddInformation({ ...base, title: 'Glossary' } as never)
      ),
      RISK: await act(() =>
        h.app().risks.handleAddRisk({ ...base, title: 'Lockout', mitigation: 'x' } as never)
      ),
      DOC: await act(() =>
        h.app().documents.handleAddDocument({
          ...base,
          title: 'Login spec',
          structure: [],
        } as never)
      ),
    };
    await h.settle();

    for (const [short, target] of Object.entries(targets)) {
      await openRelationships(h, req);
      fireEvent.click(screen.getByRole('button', { name: /\+ add link/i }));
      const dialog = await screen.findByRole('dialog', { name: /create link/i });
      fireEvent.click(within(dialog).getByRole('button', { name: short }));
      fireEvent.click(within(dialog).getByText(target!.title));
      fireEvent.click(submitButton(/create link/i));
      await h.settle();
      await waitFor(() =>
        expect(h.app().fileSystem.links).toContainEqual(
          expect.objectContaining({ sourceId: req.id, targetId: target!.id })
        )
      );
    }

    // A document as the source, chosen on the Links page
    fireEvent.click((await screen.findAllByRole('button', { name: /^add$/i }))[0]);
    const dialog = await screen.findByRole('dialog', { name: /create link/i });
    fireEvent.change(within(dialog).getByLabelText('Source Artifact'), {
      target: { value: targets.DOC!.id },
    });
    fireEvent.click(within(dialog).getByText('Login'));
    fireEvent.click(submitButton(/create link/i));
    await h.settle();
    await waitFor(() =>
      expect(h.app().fileSystem.links).toContainEqual(
        expect.objectContaining({ sourceId: targets.DOC!.id, targetId: req.id })
      )
    );
    expect(await h.invisibleDirtyPaths()).toEqual([]);
  }, 120_000);
});
