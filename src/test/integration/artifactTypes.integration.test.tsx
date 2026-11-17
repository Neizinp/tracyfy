/**
 * The same user flow for every artifact type, through the real UI:
 * Create New → it is in the current project's list and on disk →
 * open it from the list → edit and save → saved and marked modified →
 * save again without changes → nothing changes → restart → still there.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';
import type { AppState } from '../../state';
import { kind, type ArtifactKindId } from '../../domain/artifactKinds';

interface TypeCase {
  kind: ArtifactKindId;
  name: string;
  menuItem: string;
  createLabel: RegExp;
  route: string;
  folder: string;
  all: (app: AppState) => { id: string; title: string; revision: string }[];
  /** Is the artifact a member of the current project? */
}

const TYPES: TypeCase[] = [
  {
    kind: 'requirement',
    name: 'requirement',
    menuItem: 'New Requirement',
    createLabel: /create requirement/i,
    route: '/requirements',
    folder: 'requirements',
    all: (a) => a.artifacts.requirement,
  },
  {
    kind: 'useCase',
    name: 'use case',
    menuItem: 'New Use Case',
    createLabel: /create use case/i,
    route: '/use-cases',
    folder: 'use-cases',
    all: (a) => a.artifacts.useCase,
  },
  {
    kind: 'testCase',
    name: 'test case',
    menuItem: 'New Test Case',
    createLabel: /create test case/i,
    route: '/test-cases',
    folder: 'test-cases',
    all: (a) => a.artifacts.testCase,
  },
  {
    kind: 'information',
    name: 'information',
    menuItem: 'New Information',
    createLabel: /create information/i,
    route: '/information',
    folder: 'information',
    all: (a) => a.artifacts.information,
  },
  {
    kind: 'risk',
    name: 'risk',
    menuItem: 'New Risk',
    createLabel: /create risk/i,
    route: '/risks',
    folder: 'risks',
    all: (a) => a.artifacts.risk,
  },
  {
    kind: 'document',
    name: 'document',
    menuItem: 'New Document',
    createLabel: /create document/i,
    route: '/documents',
    folder: 'documents',
    all: (a) => a.artifacts.document,
  },
];

const titleInput = (dialog: HTMLElement) => within(dialog).getAllByRole('textbox')[0];

describe.each(TYPES)('integration: $name lifecycle via the UI', (t) => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('create → listed in project → edit → unchanged save → restart', async () => {
    h = await startApp({ initialRoute: t.route });

    // Create New
    fireEvent.click(screen.getByRole('button', { name: /create new/i }));
    fireEvent.click(await screen.findByText(t.menuItem));
    let dialog = await screen.findByRole('dialog');
    fireEvent.change(titleInput(dialog), { target: { value: `My ${t.name}` } });
    // Fill any other required fields (e.g. a use case's Actor), like a user must
    dialog
      .querySelectorAll<HTMLInputElement>('input[required], textarea[required]')
      .forEach((el) => {
        if (!el.value) fireEvent.change(el, { target: { value: 'Someone' } });
      });
    fireEvent.click(within(dialog).getByRole('button', { name: t.createLabel }));
    await h.settle();

    const created = t.all(h.app()).find((a) => a.title === `My ${t.name}`);
    expect(created, 'artifact created in app state').toBeDefined();
    const id = created!.id;
    expect(h.exists(`${t.folder}/${id}.md`), 'artifact file on disk').toBe(true);

    // Commit everything so later changes are visible on their own
    for (const p of await h.dirtyPaths()) {
      await act(() => h.app().commitFile(p, `Commit ${p}`));
    }
    await h.settle();
    expect(await h.dirtyPaths()).toEqual([]);

    // Open it from the list, edit, save
    fireEvent.click(await screen.findByText(`My ${t.name}`));
    dialog = await screen.findByRole('dialog');
    fireEvent.change(titleInput(dialog), { target: { value: `My ${t.name} v2` } });
    fireEvent.click(within(dialog).getByRole('button', { name: /save changes/i }));
    await h.settle();

    await waitFor(() =>
      expect(t.all(h.app()).find((a) => a.id === id)).toMatchObject({
        title: `My ${t.name} v2`,
        revision: '02',
      })
    );
    expect(h.readFile(`${t.folder}/${id}.md`)).toContain(`My ${t.name} v2`);
    expect(await h.dirtyPaths()).toEqual([`${t.folder}/${id}.md`]);

    // Save again without changes → no new revision
    await act(() => h.app().commitFile(`${t.folder}/${id}.md`, 'Commit edit'));
    await h.settle();
    fireEvent.click(await screen.findByText(`My ${t.name} v2`));
    dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /save changes/i }));
    await h.settle();
    expect(t.all(h.app()).find((a) => a.id === id)?.revision).toBe('02');
    expect(await h.dirtyPaths()).toEqual([]);

    // Restart → still there
    await h.restart();
    expect(t.all(h.app()).find((a) => a.id === id)?.title).toBe(`My ${t.name} v2`);
  }, 90_000);
});

describe.each(TYPES)('integration: custom attribute on a $name', (t) => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('can be defined for this kind and shows in its dialog', async () => {
    h = await startApp({ initialRoute: t.route });

    fireEvent.click(screen.getByRole('button', { name: /create new/i }));
    fireEvent.click(await screen.findByText('New Custom Attribute'));
    let dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText('e.g., Component, Release Version'), {
      target: { value: 'Component' },
    });
    // New attributes apply to requirements by default; make this one apply to t.kind only
    if (t.kind !== 'requirement') {
      fireEvent.click(within(dialog).getByText(kind('requirement').label.plural));
      fireEvent.click(within(dialog).getByText(kind(t.kind).label.plural));
    }
    fireEvent.click(within(dialog).getByRole('button', { name: /create attribute/i }));
    await h.settle();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(h.readFile('tracyfy.yaml')).toMatch(new RegExp(`appliesTo:[\\s\\S]*${t.kind}`));

    fireEvent.click(screen.getByRole('button', { name: /create new/i }));
    fireEvent.click(await screen.findByText(t.menuItem));
    dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Custom Attributes' }));
    expect(await within(dialog).findByText('Component')).toBeInTheDocument();
  }, 60_000);
});

describe.each(TYPES)('integration: opening a $name from elsewhere', (t) => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  const expectDialogFor = async (title: string) => {
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(titleInput(dialog)).toHaveValue(title));
    return dialog;
  };

  it('from the Links page and from search', async () => {
    h = await startApp({ initialRoute: '/links' });

    // Something to link from
    const source = await act(() =>
      h.app().addArtifact('requirement', {
        title: 'Link source',
        description: '',
        text: '',
        rationale: '',
        status: 'draft',
        priority: 'medium',
        dateCreated: Date.now(),
      } as never)
    );

    // The artifact, created through the UI
    fireEvent.click(screen.getByRole('button', { name: /create new/i }));
    fireEvent.click(await screen.findByText(t.menuItem));
    let dialog = await screen.findByRole('dialog');
    fireEvent.change(titleInput(dialog), { target: { value: `My ${t.name}` } });
    dialog
      .querySelectorAll<HTMLInputElement>('input[required], textarea[required]')
      .forEach((el) => {
        if (!el.value) fireEvent.change(el, { target: { value: 'Someone' } });
      });
    fireEvent.click(within(dialog).getByRole('button', { name: t.createLabel }));
    await h.settle();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const target = t.all(h.app()).find((a) => a.title === `My ${t.name}`)!;
    expect(
      await screen.findByText(`${kind(t.kind).label.singular} ${target.id} created`)
    ).toBeInTheDocument();

    await act(() => h.app().createLink((source as { id: string }).id, target.id, 'related_to'));
    await h.settle();

    // Links page: click the target's ID
    fireEvent.click(await within(await screen.findByRole('table')).findByText(target.id));
    dialog = await expectDialogFor(`My ${t.name}`);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // History: click the artifact on its commit
    await act(() => h.app().commitFile(`${t.folder}/${target.id}.md`, 'Add it'));
    await h.settle();
    await act(async () => h.app().openModal('history'));
    const history = await screen.findByRole('dialog', { name: 'History' });
    fireEvent.click(within(history).getByRole('button', { name: 'Commits' }));
    fireEvent.click(await within(history).findByRole('button', { name: target.id }));
    dialog = await expectDialogFor(`My ${t.name}`);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // Search: click the result (search does not cover documents yet, see DESIGN.md)
    if (t.kind === 'document') return;
    await act(async () => h.app().openModal('search'));
    const search = await screen.findByRole('dialog', { name: 'Advanced Search' });
    fireEvent.click(await within(search).findByText(target.id));
    await expectDialogFor(`My ${t.name}`);
  }, 90_000);
});
