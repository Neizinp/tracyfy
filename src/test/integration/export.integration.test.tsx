/**
 * Export / import through the real UI with real data.
 *
 * Replaces exportCompleteness.test.ts, which only checked that export source
 * files contained words like "requirements". Here a project with one of every
 * artifact type and a link is exported, and the produced file is inspected.
 *
 * Only the OS file dialogs are replaced: "Save as" (showSaveFilePicker)
 * captures the written bytes, and the import file picker hands over a File.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import * as XLSX from 'xlsx';
import { startApp, type Harness } from './appHarness';

const base = { description: '', status: 'draft', priority: 'medium', dateCreated: Date.now() };

/** One artifact of every type in the current project, plus a link */
async function populate(h: Harness) {
  const app = () => h.app();
  const req = await act(() =>
    app().requirements.handleAddRequirement({
      ...base,
      title: 'Login',
      text: 'Shall log in',
    } as never)
  );
  const uc = await act(() =>
    app().useCases.handleAddUseCase({ ...base, title: 'Sign in', actor: 'User' } as never)
  );
  const tc = await act(() =>
    app().testCases.handleAddTestCase({ ...base, title: 'Login works' } as never)
  );
  const info = await act(() =>
    app().information.handleAddInformation({ ...base, title: 'Glossary', text: 'Terms' } as never)
  );
  const risk = await act(() =>
    app().risks.handleAddRisk({ ...base, title: 'Outage', mitigation: 'Redundancy' } as never)
  );
  const doc = await act(() =>
    app().documents.handleAddDocument({
      ...base,
      title: 'Spec',
      projectId: app().project.currentProjectId,
      structure: [],
    } as never)
  );
  const link = await act(() => app().fileSystem.createLink(req!.id, uc!.id, 'satisfies'));
  await h.settle();
  return { req: req!, uc: uc!, tc: tc!, info: info!, risk: risk!, doc: doc!, link };
}

/** jsdom's Blob has no arrayBuffer(); FileReader works */
function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/** Replace the "Save as" dialog; resolves with the bytes the app writes */
function captureSaveAs(): Promise<Uint8Array> {
  return new Promise((resolve) => {
    (window as unknown as Record<string, unknown>).showSaveFilePicker = async () => ({
      createWritable: async () => {
        const parts: Blob[] = [];
        return {
          write: async (data: Blob | BufferSource) => {
            parts.push(data instanceof Blob ? data : new Blob([data]));
          },
          close: async () => resolve(await blobBytes(new Blob(parts))),
        };
      },
    });
  });
}

async function exportVia(format: RegExp): Promise<Uint8Array> {
  const saved = captureSaveAs();
  fireEvent.click(screen.getByTestId('export-button'));
  fireEvent.click(await screen.findByText(format));
  fireEvent.click(screen.getByRole('button', { name: /generate export/i }));
  return saved;
}

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).showSaveFilePicker;
  vi.restoreAllMocks();
});

describe('integration: export', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('JSON export contains every artifact type and the links', async () => {
    h = await startApp();
    const a = await populate(h);

    const json = JSON.parse(new TextDecoder().decode(await exportVia(/json data/i)));

    expect(json.requirements.map((r: { id: string }) => r.id)).toEqual([a.req.id]);
    expect(json.useCases.map((r: { id: string }) => r.id)).toEqual([a.uc.id]);
    expect(json.testCases.map((r: { id: string }) => r.id)).toEqual([a.tc.id]);
    expect(json.information.map((r: { id: string }) => r.id)).toEqual([a.info.id]);
    expect(json.risks.map((r: { id: string }) => r.id)).toEqual([a.risk.id]);
    expect(json.documents.map((r: { id: string }) => r.id)).toEqual([a.doc.id]);
    expect(json.links.map((r: { id: string }) => r.id)).toEqual([a.link.id]);
  }, 90_000);

  it('Excel export has a sheet per type containing the artifacts', async () => {
    h = await startApp();
    const a = await populate(h);

    const wb = XLSX.read(await exportVia(/excel sheet/i), { type: 'array' });
    const ids = (sheet: string) =>
      XLSX.utils
        .sheet_to_json<Record<string, unknown>>(wb.Sheets[sheet] ?? {})
        .map((row) => row['ID']);

    expect(wb.SheetNames).toEqual(
      expect.arrayContaining(['Requirements', 'Use Cases', 'Test Cases', 'Information', 'Risks'])
    );
    expect(ids('Requirements')).toContain(a.req.id);
    expect(ids('Use Cases')).toContain(a.uc.id);
    expect(ids('Test Cases')).toContain(a.tc.id);
    expect(ids('Information')).toContain(a.info.id);
    expect(ids('Risks')).toContain(a.risk.id);
  }, 90_000);

  it('JSON export → import into an empty project folder restores everything', async () => {
    h = await startApp();
    const a = await populate(h);
    const exported = await exportVia(/json data/i);
    h.cleanup();

    // A fresh folder, new user/project
    h = await startApp({ userName: 'Other User', projectName: 'Imported' });
    // The OS file picker: capture the hidden <input type=file> the app clicks
    const pickers: HTMLInputElement[] = [];
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
      this: HTMLInputElement
    ) {
      pickers.push(this);
    });
    fireEvent.click(screen.getByTestId('import-button'));
    fireEvent.click(await screen.findByText('Import JSON'));
    const input = pickers[0];
    expect(input).toBeDefined();
    Object.defineProperty(input, 'files', {
      value: [new File([exported as BlobPart], 'export.json', { type: 'application/json' })],
    });
    await act(async () => {
      input.onchange?.({ target: input } as unknown as Event);
      await new Promise((r) => setTimeout(r, 200));
    });
    await h.settle();

    const g = h.app().globalState;
    await waitFor(() => expect(g.requirements.map((r) => r.id)).toContain(a.req.id));
    expect(h.app().globalState.useCases.map((r) => r.id)).toContain(a.uc.id);
    expect(h.app().globalState.testCases.map((r) => r.id)).toContain(a.tc.id);
    expect(h.app().globalState.information.map((r) => r.id)).toContain(a.info.id);
    expect(h.app().globalState.risks.map((r) => r.id)).toContain(a.risk.id);
    expect(h.app().globalState.documents.map((r) => r.id)).toContain(a.doc.id);
    expect(h.app().fileSystem.links).toEqual([
      expect.objectContaining({ sourceId: a.req.id, targetId: a.uc.id, type: 'satisfies' }),
    ]);
    // Imported artifacts are visible in the project the user imported into
    expect(h.app().requirements.requirements.map((r) => r.id)).toContain(a.req.id);
    expect(h.exists(`requirements/${a.req.id}.md`)).toBe(true);
    // Nothing left that the user can't commit
    expect(await h.invisibleDirtyPaths()).toEqual([]);
  }, 120_000);
});
