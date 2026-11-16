import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
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
    expect(h.exists('project.md')).toBe(false);
  }, 30_000);

  it('renaming the project is saved to project.md, can be committed and survives a restart', async () => {
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

    expect(h.readFile('project.md')).toContain('Door Controller');
    expect(h.readFile('project.md')).toContain('Firmware for the lobby doors');
    // A normal, visible pending change
    expect(await h.dirtyPaths()).toContain('project.md');
    expect(await h.invisibleDirtyPaths()).toEqual([]);
    await act(() => h.app().fileSystem.commitFile('project.md', 'Name the project'));

    await h.restart();
    expect(
      await screen.findByRole('button', { name: 'Project settings: Door Controller' })
    ).toBeInTheDocument();
    expect(h.app().project.project.description).toBe('Firmware for the lobby doors');
    expect(await h.dirtyPaths()).not.toContain('project.md');
  }, 60_000);
});
