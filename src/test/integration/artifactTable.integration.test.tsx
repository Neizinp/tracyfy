/**
 * The list page of a kind, through the real UI: its columns come from the
 * fields, the Columns menu turns them on and off (remembered per project),
 * and the search box looks at every text field.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';

let h: Harness;
afterEach(() => h?.cleanup());

const header = (name: string) =>
  within(screen.getByRole('table')).queryByRole('columnheader', { name: new RegExp(`^${name}`) });

const toggleColumn = async (label: string) => {
  fireEvent.click(screen.getByRole('button', { name: /columns/i }));
  fireEvent.click(await screen.findByRole('checkbox', { name: label }));
  fireEvent.click(screen.getByRole('button', { name: /columns/i }));
};

describe('integration: artifact tables', () => {
  it("a risk's owner shows in its column", async () => {
    h = await startApp({ initialRoute: '/risks' });
    await act(() =>
      h.app().addArtifact('risk', { title: 'Outage', owner: 'Grace', mitigation: '' } as never)
    );
    await h.settle();

    expect(header('Owner')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Grace')).toBeInTheDocument();
  }, 60_000);

  it('a custom attribute column can be turned on, and stays on after a restart', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    fs.writeFileSync(
      path.join(h.dir, 'tracyfy.yaml'),
      'schemaVersion: 1\nname: project\ncustomAttributes:\n' +
        '  - id: ATTR-001\n    name: Component\n    type: text\n    appliesTo: [requirement]\n'
    );
    await act(() => h.app().reloadConfig());
    await act(() =>
      h.app().addArtifact('requirement', {
        title: 'Login',
        customAttributes: [{ attributeId: 'ATTR-001', value: 'Auth service' }],
      } as never)
    );
    await h.settle();

    expect(header('Component')).not.toBeInTheDocument();
    await toggleColumn('Component');
    expect(header('Component')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Auth service')).toBeInTheDocument();

    // Hiding a built-in column works the same way
    await toggleColumn('Priority');
    expect(header('Priority')).not.toBeInTheDocument();

    await h.restart();
    await screen.findByRole('table');
    expect(header('Component')).toBeInTheDocument();
    expect(header('Priority')).not.toBeInTheDocument();
  }, 60_000);

  it('search finds an artifact by any of its text fields, custom ones included', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    fs.writeFileSync(
      path.join(h.dir, 'tracyfy.yaml'),
      'schemaVersion: 1\nname: project\ncustomAttributes:\n' +
        '  - id: ATTR-001\n    name: Component\n    type: text\n    appliesTo: [requirement]\n'
    );
    await act(() => h.app().reloadConfig());
    await act(() =>
      h.app().addArtifact('requirement', {
        title: 'Login',
        rationale: 'Auditors asked for it',
        customAttributes: [],
      } as never)
    );
    await act(() =>
      h.app().addArtifact('requirement', {
        title: 'Logout',
        customAttributes: [{ attributeId: 'ATTR-001', value: 'Session store' }],
      } as never)
    );
    await h.settle();
    const table = () => within(screen.getByRole('table'));

    await act(async () => h.app().setSearchQuery('auditors'));
    await waitFor(() => expect(table().queryByText('Logout')).not.toBeInTheDocument());
    expect(table().getByText('Login')).toBeInTheDocument();

    await act(async () => h.app().setSearchQuery('session store'));
    await waitFor(() => expect(table().queryByText('Login')).not.toBeInTheDocument());
    expect(table().getByText('Logout')).toBeInTheDocument();
  }, 60_000);
});
