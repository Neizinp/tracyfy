/**
 * Creating and editing artifacts through the real UI, real disk and real git.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';

describe('integration: requirements via the UI', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('a requirement created with "Create New" appears in the current project and can be edited', async () => {
    h = await startApp();

    fireEvent.click(screen.getByRole('button', { name: /create new/i }));
    fireEvent.click(await screen.findByText('New Requirement'));
    fireEvent.change(await screen.findByPlaceholderText('e.g., System shall authenticate users'), {
      target: { value: 'Login' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create requirement/i }));
    await h.settle();

    const created = h.app().globalState.globalRequirements.find((r) => r.title === 'Login');
    expect(created).toBeDefined();
    expect(h.exists(`requirements/${created!.id}.md`)).toBe(true);
    // Visible in the project the user is working in
    expect(h.app().project.currentProject?.requirementIds).toContain(created!.id);
    expect(h.app().requirements.requirements.map((r) => r.id)).toContain(created!.id);
  }, 60_000);

  it('a requirement outside the current project can still be edited (e.g. from the Global Library)', async () => {
    h = await startApp();
    // Lives on disk / in the library, but not in the current project
    const project = h.app().project.currentProject!;
    await act(() => h.app().project.createProject('Other', ''));
    const other = h.app().project.projects.find((p) => p.name === 'Other')!;
    await act(() => h.app().project.switchProject(other.id));
    const req = (await act(() =>
      h.app().requirements.handleAddRequirement({
        title: 'Shared',
        description: '',
        text: '',
        rationale: '',
        status: 'draft',
        priority: 'medium',
        dateCreated: Date.now(),
      } as never)
    ))!;
    await act(() => h.app().project.switchProject(project.id));
    await h.settle();

    await act(() => h.app().requirements.handleUpdateRequirement(req.id, { title: 'Shared v2' }));
    await h.settle();

    expect(h.app().globalState.globalRequirements.find((r) => r.id === req.id)?.title).toBe(
      'Shared v2'
    );
    expect(h.readFile(`requirements/${req.id}.md`)).toContain('Shared v2');
  }, 60_000);
});
