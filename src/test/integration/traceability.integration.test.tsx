/**
 * The traceability dashboard must reflect links created in the app
 * (stored as link files).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { startApp, type Harness } from './appHarness';
import type { Requirement, Risk, TestCase } from '../../types';

async function addRequirement(h: Harness, title: string): Promise<Requirement> {
  const created = await act(() =>
    h.app().addArtifact('requirement', {
      title,
      description: '',
      text: '',
      rationale: '',
      status: 'draft',
      priority: 'medium',
      dateCreated: Date.now(),
    } as never)
  );
  return created as Requirement;
}

async function addTestCase(h: Harness, title: string): Promise<TestCase> {
  const created = await act(() =>
    h.app().addArtifact('testCase', {
      title,
      description: '',
      status: 'draft',
      priority: 'medium',
    } as never)
  );
  return created as TestCase;
}

async function addRisk(h: Harness, title: string): Promise<Risk> {
  const created = await act(() =>
    h.app().addArtifact('risk', {
      title,
      description: '',
      mitigation: '',
      status: 'identified',
    } as never)
  );
  return created as Risk;
}

describe('integration: traceability dashboard', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('"Verified by" a test case, chosen from a requirement, is stored as the test case verifying it', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    const req = await addRequirement(h, 'Login');
    const tc = await addTestCase(h, 'Log in works');
    await h.settle();

    // From the requirement: Relationships, Add Link, "Verified by" the test case
    fireEvent.click(await screen.findByText('Login'));
    let dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Relationships' }));
    fireEvent.click(within(dialog).getByRole('button', { name: '+ Add Link' }));
    const linkDialog = (await screen.findAllByRole('dialog')).at(-1)!;
    fireEvent.click(within(linkDialog).getByRole('button', { name: 'TC' }));
    fireEvent.click(within(linkDialog).getByText('Log in works'));
    fireEvent.change(within(linkDialog).getByLabelText('Relation Type'), {
      target: { value: 'verifies:backward' },
    });
    fireEvent.click(within(linkDialog).getByRole('button', { name: 'Create Link' }));
    await h.settle();

    // One fact, stored in one direction: the test case verifies the requirement
    const [link] = h.app().links;
    expect(link).toMatchObject({ sourceId: tc.id, type: 'verifies', targetId: req.id });
    const file = h.readFile(`links/${link.id}.md`)!;
    expect(file).toMatch(new RegExp(`source: ${tc.id}\ntype: verifies\ntarget: ${req.id}`));
    // Read from the requirement it says "Verified by", from the test case "Verifies"
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const linksOf = async (title: string) => {
      fireEvent.click(await screen.findByText(title));
      dialog = await screen.findByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Relationships' }));
      const row = within(dialog).getByRole('listitem');
      fireEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));
      return row.textContent;
    };
    expect(await linksOf('Login')).toMatch(new RegExp(`^Verified by${tc.id}Log in works`));
    fireEvent.click(screen.getByRole('link', { name: /test cases/i }));
    expect(await linksOf('Log in works')).toMatch(new RegExp(`^Verifies${req.id}Login`));
  }, 60_000);

  it('the gap list reports coverage rules by name, and a verified requirement is no gap', async () => {
    h = await startApp({ initialRoute: '/traceability' });
    const verified = await addRequirement(h, 'Login');
    const unverified = await addRequirement(h, 'Logout');
    const tc = await addTestCase(h, 'Log in works');
    await act(() => h.app().createLink(tc.id, verified.id, 'verifies'));
    // Related is not verification
    await act(() => h.app().createLink(tc.id, unverified.id, 'related_to'));
    await h.settle();

    fireEvent.click(await screen.findByRole('button', { name: /^gaps/i }));
    const rows = screen.getAllByText('Every requirement is verified');
    expect(rows).toHaveLength(1);
    expect(within(rows[0].parentElement!).getByText(unverified.id)).toBeInTheDocument();
    expect(screen.queryByText(verified.id, { selector: 'span[style*="monospace"]' })).toBeNull();
  }, 60_000);

  it('clicking an artifact in the gap list opens it', async () => {
    h = await startApp({ initialRoute: '/traceability' });
    const req = await addRequirement(h, 'Unlinked requirement');
    await h.settle();

    fireEvent.click(await screen.findByRole('button', { name: /^gaps/i }));
    fireEvent.click(await screen.findByText(req.id, { selector: 'span[style*="monospace"]' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByRole('textbox')[0]).toHaveValue('Unlinked requirement');
  }, 60_000);

  it('an orphan link (target file removed outside the app) is shown and can be removed', async () => {
    h = await startApp({ initialRoute: '/traceability' });
    const a = await addRequirement(h, 'Login');
    const b = await addRequirement(h, 'Logout');
    const link = await act(() => h.app().createLink(a.id, b.id, 'related_to'));
    // e.g. removed by hand or by a pull; the app itself never removes artifact files
    fs.rmSync(path.join(h.dir, `requirements/${b.id}.md`));
    await h.restart();

    fireEvent.click(await screen.findByRole('button', { name: /^gaps/i }));
    expect(await screen.findByText('Orphan link')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Remove the orphan link'));
    await h.settle();

    expect(h.app().links).toEqual([]);
    expect(h.exists(`links/${link.id}.md`)).toBe(false);
    expect(await h.invisibleDirtyPaths()).toEqual([]);
  }, 60_000);

  it('a risk is covered when a requirement mitigates it, not by any link', async () => {
    h = await startApp({ initialRoute: '/traceability' });
    const req = await addRequirement(h, 'Login');
    const tc = await addTestCase(h, 'Log in works');
    const mitigated = await addRisk(h, 'Lockout');
    const onlyRelated = await addRisk(h, 'Supplier goes away');
    const doc = (await act(() =>
      h.app().addArtifact('document', {
        title: 'Login spec',
        structure: [],
        dateCreated: Date.now(),
      } as never)
    ))!;
    await act(() => h.app().createLink(tc.id, req.id, 'verifies'));
    await act(() => h.app().createLink(req.id, mitigated.id, 'mitigates'));
    await act(() => h.app().createLink(req.id, onlyRelated.id, 'related_to'));
    await act(() => h.app().createLink(doc.id, req.id, 'related_to'));
    await h.settle();

    // Overview counts all five artifacts; only the risk nothing mitigates is a gap
    expect((await screen.findByText('Total Artifacts')).previousSibling).toHaveTextContent('5');
    fireEvent.click(screen.getByRole('button', { name: 'Gaps (1)' }));
    const [row] = screen.getAllByText('Every risk is mitigated');
    expect(within(row.parentElement!).getByText(onlyRelated.id)).toBeInTheDocument();
  }, 60_000);

  it('rules in tracyfy.yaml replace the defaults, for the gaps and for the link dialog', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    const req = await addRequirement(h, 'Login');
    await addTestCase(h, 'Log in works');
    fs.writeFileSync(
      path.join(h.dir, 'tracyfy.yaml'),
      [
        'schemaVersion: 1',
        'name: project',
        'traceability:',
        '  allowed:',
        '    - [testCase, verifies, requirement]',
        '  coverage:',
        '    - name: Every requirement has a test',
        '      kind: requirement',
        '      needs: { incoming: verifies, from: testCase }',
        '',
      ].join('\n')
    );
    await act(() => h.app().reloadConfig());

    // The link dialog offers only what the rules allow
    fireEvent.click(await screen.findByText('Login'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Relationships' }));
    fireEvent.click(within(dialog).getByRole('button', { name: '+ Add Link' }));
    const linkDialog = (await screen.findAllByRole('dialog')).at(-1)!;
    expect(within(linkDialog).getByRole('button', { name: 'REQ' })).toBeDisabled();
    fireEvent.click(within(linkDialog).getByRole('button', { name: 'TC' }));
    const offered = within(within(linkDialog).getByLabelText('Relation Type'))
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(offered).toEqual(['Verified by']);
    fireEvent.click(within(linkDialog).getByRole('button', { name: /cancel/i }));
    fireEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));

    // The gap is named by the project's rule; the default test case rule is gone
    fireEvent.click(screen.getByRole('link', { name: 'Traceability Dashboard' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Gaps (1)' }));
    const [row] = screen.getAllByText('Every requirement has a test');
    expect(within(row.parentElement!).getByText(req.id)).toBeInTheDocument();
  }, 60_000);
});
