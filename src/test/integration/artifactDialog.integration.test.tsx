/**
 * The artifact dialog, through the real UI, for what is easy to get wrong
 * per kind: every field reaches the file, Delete works for every kind, and
 * custom attributes behave like the built-in fields.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';
import { ARTIFACT_KINDS, kind, type ArtifactKindId } from '../../domain/artifactKinds';

let h: Harness;
afterEach(() => h?.cleanup());

const titleInput = (dialog: HTMLElement) => within(dialog).getAllByRole('textbox')[0];

/** Create an artifact of `kindId` through Create New, filling the title and required inputs */
async function createThroughUi(
  kindId: ArtifactKindId,
  title: string,
  fill?: (d: HTMLElement) => Promise<void>
) {
  const k = kind(kindId);
  fireEvent.click(screen.getByRole('button', { name: /create new/i }));
  fireEvent.click(await screen.findByText(`New ${k.label.singular}`));
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(titleInput(dialog), { target: { value: title } });
  dialog.querySelectorAll<HTMLInputElement>('input[required]').forEach((el) => {
    if (!el.value) fireEvent.change(el, { target: { value: 'Someone' } });
  });
  await fill?.(dialog);
  fireEvent.click(
    within(dialog).getByRole('button', { name: new RegExp(`create ${k.label.singular}`, 'i') })
  );
  await h.settle();
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  const created = h.app().artifacts[kindId].find((a) => a.title === title);
  expect(created, `${title} created`).toBeDefined();
  return created!;
}

describe('integration: every field of the dialog reaches the file', () => {
  it("a use case's flows and conditions are saved and shown again", async () => {
    h = await startApp({ initialRoute: '/use-cases' });

    const uc = await createThroughUi('useCase', 'Sign in', async (dialog) => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Flows' }));
      fireEvent.change(await within(dialog).findByPlaceholderText(/User does X/), {
        target: { value: 'User enters a password' },
      });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Conditions' }));
      const [pre] = await within(dialog).findAllByRole('textbox');
      fireEvent.change(pre, { target: { value: 'User has an account' } });
    });

    const file = h.readFile(`use-cases/${uc.id}.md`)!;
    expect(file).toContain('## Main Flow\nUser enters a password');
    expect(file).toContain('## Preconditions\nUser has an account');

    await h.restart();
    fireEvent.click(await screen.findByText('Sign in'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Flows' }));
    expect(await within(dialog).findByDisplayValue('User enters a password')).toBeInTheDocument();
  }, 60_000);
});

describe.each(ARTIFACT_KINDS.map((k) => ({ id: k.id, name: k.label.singular })))(
  'integration: Delete in the $name dialog',
  ({ id: kindId, name }) => {
    it('moves it to the trash: marked deleted on disk and gone from the list', async () => {
      h = await startApp({ initialRoute: `/${kind(kindId).folder}` });
      const created = await createThroughUi(kindId, `Doomed ${name}`);

      fireEvent.click(await screen.findByText(`Doomed ${name}`));
      const dialog = await screen.findByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));
      fireEvent.click(within(dialog).getByRole('button', { name: /confirm delete/i }));
      await h.settle();

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(h.readFile(`${kind(kindId).folder}/${created.id}.md`)).toMatch(/isDeleted: true/);
      expect(h.app().artifacts[kindId].find((a) => a.id === created.id)?.isDeleted).toBe(true);
      expect(screen.queryByText(`Doomed ${name}`)).not.toBeInTheDocument();
    }, 60_000);
  }
);

describe('integration: custom attributes in the dialog', () => {
  const defineComponent = async () => {
    const config = path.join(h.dir, 'tracyfy.yaml');
    fs.writeFileSync(
      config,
      [
        'schemaVersion: 1',
        'name: project',
        'customAttributes:',
        '  - id: ATTR-001',
        '    name: Component',
        '    type: dropdown',
        '    required: true',
        '    defaultValue: Backend',
        '    options: [UI, Backend]',
        '    appliesTo: [risk]',
        '',
      ].join('\n')
    );
    await act(() => h.app().reloadConfig());
  };

  it('a new artifact is saved with the default the dialog showed', async () => {
    h = await startApp({ initialRoute: '/risks' });
    await defineComponent();

    const risk = await createThroughUi('risk', 'Outage', async (dialog) => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Custom Attributes' }));
      expect(within(dialog).getByLabelText(/Component/)).toHaveValue('Backend');
    });

    expect(risk.customAttributes).toEqual([{ attributeId: 'ATTR-001', value: 'Backend' }]);
    expect(h.readFile(`risks/${risk.id}.md`)).toContain('attributeId: ATTR-001');
  }, 60_000);

  it('a required one that is empty keeps the dialog open and says which', async () => {
    h = await startApp({ initialRoute: '/risks' });
    await defineComponent();

    fireEvent.click(screen.getByRole('button', { name: /create new/i }));
    fireEvent.click(await screen.findByText('New Risk'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(titleInput(dialog), { target: { value: 'Outage' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Custom Attributes' }));
    fireEvent.change(within(dialog).getByLabelText(/Component/), { target: { value: '' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /create risk/i }));
    await h.settle();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Component');
    expect(h.app().artifacts.risk).toEqual([]);
  }, 60_000);
});

describe('integration: dialog defaults and navigation', () => {
  it('a new artifact starts with its kind’s first status, not another kind’s', async () => {
    h = await startApp({ initialRoute: '/risks' });
    const risk = await createThroughUi('risk', 'Outage');
    expect(risk.status).toBe('identified');
    expect(h.readFile(`risks/${risk.id}.md`)).toContain('status: identified');
  }, 60_000);

  it('Back returns to the artifact a link was followed from', async () => {
    h = await startApp({ initialRoute: '/requirements' });
    const req = await createThroughUi('requirement', 'Login');
    const tc = await createThroughUi('testCase', 'Login works');
    await act(() => h.app().createLink(req.id, tc.id, 'verified_by'));
    await h.settle();

    fireEvent.click(await screen.findByText('Login'));
    let dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Relationships' }));
    fireEvent.click(within(dialog).getByText(tc.id));

    dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(titleInput(dialog)).toHaveValue('Login works'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Back' }));

    dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(titleInput(dialog)).toHaveValue('Login'));
  }, 60_000);
});
