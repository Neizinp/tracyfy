import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { startApp, type Harness } from './appHarness';

describe('integration: app startup', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('initializes a git repo with a user in an empty folder; the folder is the project', async () => {
    h = await startApp();
    expect(h.exists('.git')).toBe(true);
    expect(h.app().user.currentUser?.name).toBe('Test User');
    // No project to create: it is named after the folder until renamed
    expect(h.app().project.project.name).toBe('project');
    expect(screen.getByRole('button', { name: 'Project settings: project' })).toBeInTheDocument();
    expect(h.exists('tracyfy.yaml')).toBe(false);
  }, 30_000);

  it('renaming the project is saved to tracyfy.yaml, can be committed and survives a restart', async () => {
    h = await startApp();

    fireEvent.click(screen.getByRole('button', { name: 'Project settings: project' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: /project name/i }), {
      target: { value: 'Door Controller' },
    });
    fireEvent.change(within(dialog).getByRole('textbox', { name: /description/i }), {
      target: { value: 'Firmware for the lobby doors' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await h.settle();

    expect(h.readFile('tracyfy.yaml')).toBe(
      'schemaVersion: 1\nname: Door Controller\ndescription: Firmware for the lobby doors\n'
    );
    expect(h.exists('project.md')).toBe(false);
    // A normal, visible pending change
    expect(await h.dirtyPaths()).toContain('tracyfy.yaml');
    expect(await h.invisibleDirtyPaths()).toEqual([]);
    await act(() => h.app().fileSystem.commitFile('tracyfy.yaml', 'Name the project'));

    await h.restart();
    expect(
      await screen.findByRole('button', { name: 'Project settings: Door Controller' })
    ).toBeInTheDocument();
    expect(h.app().project.project.description).toBe('Firmware for the lobby doors');
    expect(await h.dirtyPaths()).not.toContain('tracyfy.yaml');
  }, 60_000);

  it('a broken tracyfy.yaml is reported, not silently replaced by defaults', async () => {
    h = await startApp();
    fs.writeFileSync(path.join(h.dir, 'tracyfy.yaml'), 'schemaVersion: 1\nname: [unclosed\n');

    const error = await h.restartFailing();

    expect(error).toMatch(/tracyfy\.yaml: not valid YAML/);
    expect(await screen.findByText(/tracyfy\.yaml: not valid YAML/)).toBeInTheDocument();
    expect(h.readFile('tracyfy.yaml')).toBe('schemaVersion: 1\nname: [unclosed\n');
  }, 60_000);
});
