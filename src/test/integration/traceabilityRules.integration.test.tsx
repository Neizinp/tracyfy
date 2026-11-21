/**
 * The Traceability Rules page edits the rules in tracyfy.yaml (DESIGN.md
 * §3.3, P2): what the user saves is in the file, as a pending change, and is
 * what the app works by.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { parse } from 'yaml';
import { startApp, type Harness } from './appHarness';
import { DEFAULT_TRACEABILITY, isAllowed } from '../../domain/traceability';

let h: Harness;
afterEach(() => h?.cleanup());

async function openRulesPage() {
  fireEvent.click(screen.getByRole('link', { name: 'Traceability Rules' }));
  return screen.findByRole('heading', { name: 'Allowed links' });
}

const config = () => parse(h.readFile('tracyfy.yaml') ?? '') as Record<string, unknown>;
const saveButton = () => screen.getByRole('button', { name: 'Save' });

describe('integration: traceability rules page', () => {
  it('shows the default rules, and saving a change writes tracyfy.yaml as a pending change', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    await openRulesPage();
    expect(screen.getByText(/These are the default rules/)).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();

    // Drop the rule that every test case verifies something
    const rule = screen
      .getAllByRole('group', { name: /^Coverage rule/ })
      .find(
        (g) =>
          within(g).getByLabelText('Rule name').getAttribute('value') ===
          'Every test case verifies something'
      )!;
    fireEvent.click(within(rule).getByRole('button', { name: 'Remove' }));
    fireEvent.click(saveButton());
    await h.settle();

    const coverage = (config().traceability as { coverage: { name: string }[] }).coverage;
    expect(coverage.map((c) => c.name)).toEqual([
      'Every requirement is verified',
      'Every risk is mitigated',
    ]);
    expect(h.app().settings.traceability.coverage).toHaveLength(2);
    expect(await h.dirtyPaths()).toContain('tracyfy.yaml');
    expect(await h.commitMessages()).not.toContainEqual(expect.stringMatching(/traceab/i));
    expect(saveButton()).toBeDisabled();
  }, 60_000);

  it('an added allowed link is saved and then allowed; a duplicate cannot be saved', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    await openRulesPage();
    fireEvent.click(screen.getByRole('button', { name: /Add allowed link/ }));

    // The new row ("Any kind, Related to, Any kind") is already a default row
    expect(
      await screen.findByText('The allowed link "* related_to *" is listed twice.')
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();

    const rows = screen.getAllByRole('group', { name: /^Allowed link/ });
    const row = rows.at(-1)!;
    fireEvent.change(within(row).getByLabelText('Source kind'), { target: { value: 'testCase' } });
    fireEvent.change(within(row).getByLabelText('Link type'), { target: { value: 'mitigates' } });
    fireEvent.change(within(row).getByLabelText('Target kind'), { target: { value: 'risk' } });
    expect(screen.queryByText(/is listed twice/)).not.toBeInTheDocument();
    fireEvent.click(saveButton());
    await h.settle();

    const allowed = (config().traceability as { allowed: string[][] }).allowed;
    expect(allowed.at(-1)).toEqual(['testCase', 'mitigates', 'risk']);
    expect(allowed).toHaveLength(DEFAULT_TRACEABILITY.allowed.length + 1);
    expect(isAllowed(h.app().settings.traceability, 'testCase', 'mitigates', 'risk')).toBe(true);
  }, 60_000);

  it('a coverage rule without a name cannot be saved', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    await openRulesPage();
    fireEvent.click(screen.getByRole('button', { name: /Add coverage rule/ }));
    expect(await screen.findByText('Coverage rule 4 has no name.')).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();

    const rule = screen.getAllByRole('group', { name: /^Coverage rule/ }).at(-1)!;
    fireEvent.change(within(rule).getByLabelText('Rule name'), {
      target: { value: 'Every use case is verified' },
    });
    fireEvent.change(within(rule).getByLabelText('Kind'), { target: { value: 'useCase' } });
    fireEvent.click(saveButton());
    await h.settle();

    const coverage = (config().traceability as { coverage: unknown[] }).coverage;
    expect(coverage.at(-1)).toEqual({
      name: 'Every use case is verified',
      kind: 'useCase',
      needs: { incoming: 'verifies', from: 'testCase' },
    });
  }, 60_000);

  it('Reset to defaults removes the rules from tracyfy.yaml', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    fs.writeFileSync(
      path.join(h.dir, 'tracyfy.yaml'),
      [
        'schemaVersion: 1',
        'name: project',
        'traceability:',
        '  allowed:',
        '    - [testCase, verifies, requirement]',
        '',
      ].join('\n')
    );
    await act(() => h.app().reloadConfig());
    await openRulesPage();
    expect(screen.getAllByRole('group', { name: /^Allowed link/ })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));
    expect(screen.getAllByRole('group', { name: /^Allowed link/ })).toHaveLength(
      DEFAULT_TRACEABILITY.allowed.length
    );
    fireEvent.click(saveButton());
    await h.settle();

    await waitFor(() => expect(config().traceability).toBeUndefined());
    expect(config().name).toBe('project');
    expect(h.app().settings.traceability).toEqual(DEFAULT_TRACEABILITY);
  }, 60_000);

  it('unsaved edits survive tracyfy.yaml being read again', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    await openRulesPage();
    fireEvent.click(screen.getByRole('button', { name: /Add coverage rule/ }));
    const count = screen.getAllByRole('group', { name: /^Coverage rule/ }).length;

    await act(() =>
      h.app().addAttributeDefinition({ name: 'Owner', type: 'text', appliesTo: ['requirement'] })
    );
    await h.settle();

    expect(screen.getAllByRole('group', { name: /^Coverage rule/ })).toHaveLength(count);
    expect(screen.getByText('Coverage rule 4 has no name.')).toBeInTheDocument();
  }, 60_000);
});
