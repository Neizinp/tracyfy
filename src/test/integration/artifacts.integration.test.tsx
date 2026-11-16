/**
 * Creating and editing artifacts through the real UI, real disk and real git.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { startApp, type Harness } from './appHarness';

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

    const created = h.app().globalState.requirements.find((r) => r.title === 'Login');
    expect(created).toBeDefined();
    expect(h.exists(`requirements/${created!.id}.md`)).toBe(true);
    // Visible in the project the user is working in
    expect(h.app().requirements.requirements.map((r) => r.id)).toContain(created!.id);
  }, 60_000);

  it('every artifact file in the folder is shown, also ones added outside the app (e.g. by a pull)', async () => {
    h = await startApp();
    const own = (await act(() =>
      h.app().requirements.handleAddRequirement({
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
});
