/**
 * Creating and editing artifacts through the real UI, real disk and real git.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { startApp, type Harness } from './appHarness';
import { ARTIFACT_KINDS } from '../../domain/artifactKinds';

describe('integration: requirements via the UI', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('a requirement created with "Create New" appears in the project', async () => {
    h = await startApp();

    fireEvent.click(screen.getByRole('button', { name: /create new/i }));
    fireEvent.click(await screen.findByText('New Requirement'));
    fireEvent.change(await screen.findByPlaceholderText('e.g., System shall authenticate users'), {
      target: { value: 'Login' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create requirement/i }));
    await h.settle();

    const created = h.app().artifacts.requirement.find((r) => r.title === 'Login');
    expect(created).toBeDefined();
    expect(h.exists(`requirements/${created!.id}.md`)).toBe(true);
    // Visible in the project the user is working in
    expect(h.app().artifacts.requirement.map((r) => r.id)).toContain(created!.id);
  }, 60_000);

  it('every artifact file in the folder is shown, also ones added outside the app (e.g. by a pull)', async () => {
    h = await startApp();
    const own = (await act(() =>
      h.app().addArtifact('requirement', {
        title: 'Created here',
        description: '',
        text: '',
        rationale: '',
        status: 'draft',
        priority: 'medium',
        dateCreated: Date.now(),
      } as never)
    ))!;
    await h.settle();

    // A colleague's requirement arrives as a plain file, not through this app
    const fileText = h
      .readFile(`requirements/${own.id}.md`)!
      .replaceAll(own.id, 'REQ-050')
      .replaceAll('Created here', 'From a colleague');
    fs.writeFileSync(path.join(h.dir, 'requirements/REQ-050.md'), fileText);
    await h.restart();

    expect(await screen.findByText('From a colleague')).toBeInTheDocument();
    expect(screen.getByText('Created here')).toBeInTheDocument();
  }, 60_000);

  it('an artifact added with only a title has its defaults at once, as read back from disk', async () => {
    h = await startApp();
    const returned = [];
    for (const k of ARTIFACT_KINDS) {
      returned.push(await act(() => h.app().addArtifact(k.id, { title: `A ${k.id}` } as never)));
    }
    await h.settle();
    const inMemory = ARTIFACT_KINDS.map((k) => h.app().artifacts[k.id][0]);
    expect(returned).toEqual(inMemory);
    expect(inMemory[0]).toMatchObject({ status: 'draft', priority: 'medium' });

    await act(() => h.app().reload());
    expect(ARTIFACT_KINDS.map((k) => h.app().artifacts[k.id][0])).toEqual(inMemory);
  }, 60_000);

  it('an artifact its file could not hold is refused, and nothing is written', async () => {
    h = await startApp();
    // "draft" is not a risk status; read back, the file would be a file problem
    const added = await act(() =>
      h.app().addArtifact('risk', { title: 'Outage', status: 'draft' } as never)
    );
    await h.settle();

    expect(added).toBeNull();
    expect(h.app().artifacts.risk).toEqual([]);
    expect(h.exists('risks/RISK-001.md')).toBe(false);
  }, 60_000);

  it('a file that cannot be read is reported and left out, not loaded as wrong data', async () => {
    h = await startApp();
    const good = (await act(() =>
      h.app().addArtifact('requirement', {
        title: 'Readable',
        description: '',
        text: '',
        rationale: '',
        status: 'draft',
        priority: 'medium',
        dateCreated: Date.now(),
      } as never)
    ))!;
    await h.settle();
    // The file is named by the ID; the ID is not repeated inside it
    expect(h.readFile(`requirements/${good.id}.md`)).not.toMatch(/^id:/m);

    // e.g. a bad merge or a typo while editing by hand
    fs.writeFileSync(
      path.join(h.dir, 'requirements/REQ-077.md'),
      '---\ntitle: [unclosed\n---\n\n# Broken\n'
    );
    await h.restart();

    expect(await screen.findByText(/1 file could not be read/)).toBeInTheDocument();
    expect(screen.getByText('requirements/REQ-077.md')).toBeInTheDocument();
    expect(h.app().artifacts.requirement.map((r) => r.id)).toEqual([good.id]);
    // Left as it is for the user to fix
    expect(h.readFile('requirements/REQ-077.md')).toContain('[unclosed');
  }, 60_000);
});
