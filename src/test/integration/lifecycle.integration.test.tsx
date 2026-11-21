/**
 * Lifecycles (DESIGN.md §3.4): each kind's statuses come from its lifecycle,
 * a file with a status the lifecycle does not have is reported, and editing
 * the content of an approved artifact sends it back to review.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';
import type { Requirement } from '../../types';

let h: Harness;
afterEach(() => h?.cleanup());

async function approvedRequirement(title: string): Promise<Requirement> {
  const created = await act(() =>
    h.app().addArtifact('requirement', {
      title,
      description: '',
      text: 'The system shall log out after 15 minutes.',
      rationale: '',
      status: 'approved',
      priority: 'medium',
    } as never)
  );
  await h.settle();
  return created as Requirement;
}

/** Open the requirement's dialog from the table, change one input, save */
async function editInDialog(title: string, change: (dialog: HTMLElement) => void) {
  fireEvent.click(await screen.findByText(title));
  const dialog = await screen.findByRole('dialog');
  change(dialog);
  fireEvent.click(within(dialog).getByRole('button', { name: /save/i }));
  await h.settle();
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

const statusOf = (id: string) => h.readFile(`requirements/${id}.md`)!.match(/^status: (.*)$/m)?.[1];

describe('integration: lifecycle', () => {
  it('the status menu offers the states of the lifecycle, In review among them', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    fireEvent.click(screen.getByRole('button', { name: /create new/i }));
    fireEvent.click(await screen.findByText('New Requirement'));
    const dialog = await screen.findByRole('dialog');

    const status = within(dialog).getByLabelText('Status');
    const options = within(status)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toEqual(['Draft', 'In review', 'Approved', 'Implemented', 'Verified']);
    expect(status).toHaveValue('draft');
  }, 60_000);

  it('a file with a status its kind does not have is reported, not loaded', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    fs.writeFileSync(
      path.join(h.dir, 'requirements/REQ-009.md'),
      '---\ntitle: Typo\nstatus: aproved\n---\n\n# Typo\n'
    );
    await h.restart();

    expect(await screen.findByText(/1 file could not be read/)).toBeInTheDocument();
    expect(screen.getByText(/"aproved" is not a status of a requirement/)).toBeInTheDocument();
    expect(h.app().artifacts.requirement).toEqual([]);
  }, 60_000);

  it('editing the text of an approved requirement sends it back to review', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    const req = await approvedRequirement('Session timeout');
    expect(statusOf(req.id)).toBe('approved');

    await editInDialog('Session timeout', (dialog) => {
      fireEvent.change(within(dialog).getByDisplayValue(/log out after 15 minutes/), {
        target: { value: 'The system shall log out after 5 minutes.' },
      });
    });

    expect(statusOf(req.id)).toBe('in_review');
    expect(
      await screen.findByText(/changed after approval, so it needs review again/)
    ).toBeVisible();
  }, 60_000);

  it('changing only metadata (priority) keeps it approved', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    const req = await approvedRequirement('Session timeout');

    await editInDialog('Session timeout', (dialog) => {
      fireEvent.change(within(dialog).getByLabelText('Priority'), { target: { value: 'high' } });
    });

    const file = h.readFile(`requirements/${req.id}.md`)!;
    expect(file).toMatch(/^priority: high$/m);
    expect(statusOf(req.id)).toBe('approved');
  }, 60_000);

  it('a status chosen in the same edit wins over the rule', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    const req = await approvedRequirement('Session timeout');

    await editInDialog('Session timeout', (dialog) => {
      fireEvent.change(within(dialog).getByDisplayValue(/log out after 15 minutes/), {
        target: { value: 'Reworded.' },
      });
      fireEvent.change(within(dialog).getByLabelText('Status'), {
        target: { value: 'implemented' },
      });
    });

    expect(statusOf(req.id)).toBe('implemented');
  }, 60_000);

  it('the rule can be turned off in Project Settings, which writes tracyfy.yaml', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    const req = await approvedRequirement('Session timeout');

    fireEvent.click(screen.getByTitle('Project settings'));
    const settings = await screen.findByRole('dialog');
    const rule = within(settings).getByRole('checkbox', {
      name: /editing an approved artifact sends it back to review/i,
    });
    expect(rule).toBeChecked();
    fireEvent.click(rule);
    fireEvent.click(within(settings).getByRole('button', { name: /^save$/i }));
    await h.settle();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(h.readFile('tracyfy.yaml')).toMatch(/lifecycle:\n {2}reviewOnContentChange: false/);

    // Still off after reopening the folder: it is read from the file
    await h.restart();
    await editInDialog('Session timeout', (dialog) => {
      fireEvent.change(within(dialog).getByDisplayValue(/log out after 15 minutes/), {
        target: { value: 'Reworded.' },
      });
    });
    expect(statusOf(req.id)).toBe('approved');
  }, 60_000);

  it('approving a requirement records the date in its Approved field', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    const req = await approvedRequirement('Session timeout');
    expect(h.readFile(`requirements/${req.id}.md`)).toMatch(/^approvalDate: \d{4}-\d\d-\d\dT/m);
  }, 60_000);
});
