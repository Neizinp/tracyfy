/**
 * The same user flow for every artifact type, through the real UI:
 * Create New → it is in the current project's list and on disk →
 * open it from the list → edit and save → saved and marked modified →
 * save again without changes → nothing changes → restart → still there.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { startApp, type Harness, type AppHooks } from './appHarness';
import { kind, type ArtifactKindId } from '../../domain/artifactKinds';

interface TypeCase {
  kind: ArtifactKindId;
  name: string;
  menuItem: string;
  createLabel: RegExp;
  route: string;
  folder: string;
  all: (app: AppHooks) => { id: string; title: string; revision: string }[];
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
    all: (a) => a.globalState.requirements,
  },
  {
    kind: 'useCase',
    name: 'use case',
    menuItem: 'New Use Case',
    createLabel: /create use case/i,
    route: '/use-cases',
    folder: 'usecases',
    all: (a) => a.globalState.useCases,
  },
  {
    kind: 'testCase',
    name: 'test case',
    menuItem: 'New Test Case',
    createLabel: /create test case/i,
    route: '/test-cases',
    folder: 'testcases',
    all: (a) => a.globalState.testCases,
  },
  {
    kind: 'information',
    name: 'information',
    menuItem: 'New Information',
    createLabel: /create information/i,
    route: '/information',
    folder: 'information',
    all: (a) => a.globalState.information,
  },
  {
    kind: 'risk',
    name: 'risk',
    menuItem: 'New Risk',
    createLabel: /create risk/i,
    route: '/risks',
    folder: 'risks',
    all: (a) => a.globalState.risks,
  },
  {
    kind: 'document',
    name: 'document',
    menuItem: 'New Document',
    createLabel: /create document/i,
    route: '/documents',
    folder: 'documents',
    all: (a) => a.globalState.documents,
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
      await act(() => h.app().fileSystem.commitFile(p, `Commit ${p}`));
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
    await act(() => h.app().fileSystem.commitFile(`${t.folder}/${id}.md`, 'Commit edit'));
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

    const [file] = fs.readdirSync(path.join(h.dir, 'custom-attributes'));
    expect(h.readFile(`custom-attributes/${file}`)).toMatch(
      new RegExp(`appliesTo:[\\s\\S]*${t.kind}`)
    );

    fireEvent.click(screen.getByRole('button', { name: /create new/i }));
    fireEvent.click(await screen.findByText(t.menuItem));
    dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Custom Attributes' }));
    expect(await within(dialog).findByText('Component')).toBeInTheDocument();
  }, 60_000);
});
