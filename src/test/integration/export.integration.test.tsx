/**
 * Export / import through the real UI with real data: a real project folder
 * and git repository, the export dialog, and the produced file inspected.
 *
 * Only the OS file dialogs are replaced: "Save as" (showSaveFilePicker)
 * captures the written bytes, and the import file picker hands over a File.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { startApp, type Harness } from './appHarness';
import { ARTIFACT_KINDS, kindOfId } from '../../domain/artifactKinds';
import { fingerprint } from '../../domain/fingerprint';
import { isSuspect } from '../../domain/traceability';
import type { AppState } from '../../state/store';
import type { ArtifactDocument } from '../../types';

const now = () => Date.now();

/** One artifact of every kind, each with a valid status for its kind, plus a link */
async function populate(h: Harness) {
  const app = () => h.app();
  const add = (k: Parameters<ReturnType<typeof app>['addArtifact']>[0], data: object) =>
    act(() => app().addArtifact(k, { description: '', dateCreated: now(), ...data } as never));
  const req = await add('requirement', { title: 'Login', text: 'Shall log in' });
  const uc = await add('useCase', { title: 'Sign in', actor: 'User' });
  const tc = await add('testCase', { title: 'Login works' });
  const info = await add('information', { title: 'Glossary', text: 'Terms' });
  const risk = await add('risk', {
    title: 'Outage',
    status: 'identified',
    mitigation: 'Redundancy',
  });
  const doc = await add('document', {
    title: 'Spec',
    structure: [
      { type: 'heading', title: 'Introduction', level: 1 },
      { type: 'artifact', id: 'REQ-001', artifactType: 'requirement' },
    ],
  });
  const link = await act(() => app().createLink(req!.id, uc!.id, 'satisfies'));
  await h.settle();
  return { req: req!, uc: uc!, tc: tc!, info: info!, risk: risk!, doc: doc!, link };
}

/** Each link as the user sees it: its ends, type and whether it is suspect */
function linkView(app: AppState) {
  return app.links.map((l) => {
    const k = kindOfId(l.targetId)!;
    const target = app.artifacts[k].find((a) => a.id === l.targetId)!;
    return { ...l, suspect: isSuspect(l, fingerprint(k, target)) };
  });
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

/** Open the export dialog, pick the format, let `adjust` change options, generate */
async function exportVia(format: RegExp, adjust?: () => void): Promise<Uint8Array> {
  const saved = captureSaveAs();
  fireEvent.click(screen.getByTestId('export-button'));
  fireEvent.click(await screen.findByText(format));
  adjust?.();
  fireEvent.click(screen.getByRole('button', { name: /generate export/i }));
  return saved;
}

/** A blank RGB PNG of the given size */
function png(width: number, height: number): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(zlib.crc32(body), body.length + 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const pixels = Buffer.alloc((width * 3 + 1) * height);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const pdfText = (bytes: Uint8Array) => new TextDecoder('latin1').decode(bytes);
const readJson = (bytes: Uint8Array) => JSON.parse(new TextDecoder().decode(bytes));
const rowsOf = (wb: XLSX.WorkBook, sheet: string) =>
  XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheet] ?? {});

async function commitAll(h: Harness, message: string) {
  await h.settle();
  for (const p of await h.dirtyPaths()) await act(() => h.app().commitFile(p, message));
}

/** Tags and commits have whole seconds; keep commits after a baseline out of its second */
const nextSecond = () => new Promise((r) => setTimeout(r, 1100));

/** The app's file picker: capture the hidden <input type=file> it clicks, hand it `file` */
async function importVia(h: Harness, item: string, file: File) {
  const pickers: HTMLInputElement[] = [];
  vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
    this: HTMLInputElement
  ) {
    pickers.push(this);
  });
  fireEvent.click(screen.getByTestId('import-button'));
  fireEvent.click(await screen.findByText(item));
  const input = pickers[0];
  expect(input).toBeDefined();
  Object.defineProperty(input, 'files', { value: [file] });
  await act(async () => {
    input.onchange?.({ target: input } as unknown as Event);
    await new Promise((r) => setTimeout(r, 300));
  });
  await h.settle();
}

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).showSaveFilePicker;
  vi.restoreAllMocks();
});

describe('integration: export', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('JSON export has every kind, keyed by kind, and the links', async () => {
    h = await startApp();
    const a = await populate(h);

    const json = readJson(await exportVia(/json data/i));

    const ids = (k: string) => json.artifacts[k].map((r: { id: string }) => r.id);
    expect(ids('requirement')).toEqual([a.req.id]);
    expect(ids('useCase')).toEqual([a.uc.id]);
    expect(ids('testCase')).toEqual([a.tc.id]);
    expect(ids('information')).toEqual([a.info.id]);
    expect(ids('risk')).toEqual([a.risk.id]);
    expect(ids('document')).toEqual([a.doc.id]);
    expect(json.links.map((r: { id: string }) => r.id)).toEqual([a.link.id]);
    expect(json.baseline).toBeNull();
  }, 90_000);

  it('Excel has a sheet per kind with a column per field, custom attributes included', async () => {
    h = await startApp();
    const attr = await act(() =>
      h.app().addAttributeDefinition({ name: 'Component', type: 'text', appliesTo: ['risk'] })
    );
    const a = await populate(h);
    await act(() =>
      h.app().updateArtifact('risk', a.risk.id, {
        customAttributes: [{ attributeId: attr.id, value: 'Backend' }],
      })
    );
    await h.settle();

    const wb = XLSX.read(await exportVia(/excel sheet/i), { type: 'array' });

    expect(wb.SheetNames).toEqual(
      expect.arrayContaining(ARTIFACT_KINDS.map((k) => k.label.plural))
    );
    const risk = rowsOf(wb, 'Risks').find((r) => r['ID'] === a.risk.id);
    expect(risk).toMatchObject({
      Title: 'Outage',
      Status: 'Identified',
      'Mitigation Strategy': 'Redundancy',
      Component: 'Backend',
    });
    expect(rowsOf(wb, 'Documents').map((r) => r['ID'])).toEqual([a.doc.id]);
  }, 90_000);

  it('Excel and PDF show each relation from both ends, from the links', async () => {
    h = await startApp();
    const app = () => h.app();
    const add = (title: string) =>
      act(() => app().addArtifact('requirement', { title, dateCreated: now() } as never));
    const login = (await add('Login'))!;
    const logout = (await add('Logout'))!;
    const tc = (await act(() =>
      app().addArtifact('testCase', { title: 'Log in and out', dateCreated: now() } as never)
    ))!;
    await act(() => app().createLink(tc.id, login.id, 'verifies'));
    await act(() => app().createLink(tc.id, logout.id, 'verifies'));
    await h.settle();

    const wb = XLSX.read(await exportVia(/excel sheet/i), { type: 'array' });
    expect(rowsOf(wb, 'Test Cases').find((r) => r['ID'] === tc.id)?.['Verifies']).toBe(
      `${login.id}, ${logout.id}`
    );
    expect(rowsOf(wb, 'Requirements').find((r) => r['ID'] === login.id)?.['Verified by']).toBe(
      tc.id
    );

    // jsPDF writes text uncompressed: "(REQ-001, REQ-002) Tj"
    const pdf = pdfText(await exportVia(/pdf document/i));
    expect(pdf).toContain('(Verifies:)');
    expect(pdf).toContain(`(${login.id}, ${logout.id})`);
    expect(pdf).toContain('(Verified by:)');
  }, 90_000);

  it('a baseline export shows the project as it was at the baseline', async () => {
    h = await startApp();
    const req = (await act(() =>
      h.app().addArtifact('requirement', { title: 'Login', dateCreated: now() } as never)
    ))!;
    await commitAll(h, 'Add login');
    await act(() => h.app().createBaseline('1.0', 'First release'));
    await act(() => h.app().updateArtifact('requirement', req.id, { title: 'Sign-in' }));
    await act(() =>
      h.app().addArtifact('risk', { title: 'Added later', dateCreated: now() } as never)
    );
    await commitAll(h, 'Rename');

    const pick10 = () =>
      fireEvent.change(screen.getByLabelText('Project State'), { target: { value: '1.0' } });
    const atBaseline = readJson(await exportVia(/json data/i, pick10));
    expect(atBaseline.baseline).toBe('1.0');
    expect(atBaseline.artifacts.requirement.map((r: { title: string }) => r.title)).toEqual([
      'Login',
    ]);
    expect(atBaseline.artifacts.risk).toEqual([]);

    const pdf = pdfText(await exportVia(/pdf document/i, pick10));
    expect(pdf).toContain(`(${req.id} - Login)`);
    expect(pdf).not.toContain('Sign-in');
    expect(pdf).toContain('(Baseline 1.0)');

    const current = readJson(await exportVia(/json data/i));
    expect(current.artifacts.requirement.map((r: { title: string }) => r.title)).toEqual([
      'Sign-in',
    ]);
  }, 120_000);

  it('a baseline export shows images as they were at the baseline', async () => {
    h = await startApp();
    const writeImage = (w: number, height: number) => {
      fs.mkdirSync(path.join(h.dir, 'assets'), { recursive: true });
      fs.writeFileSync(path.join(h.dir, 'assets', 'diagram.png'), png(w, height));
    };
    writeImage(2, 3);
    await act(() =>
      h.app().addArtifact('requirement', {
        title: 'Login',
        text: 'See ![diagram](./assets/diagram.png)',
        dateCreated: now(),
      } as never)
    );
    await commitAll(h, 'Add login');
    await act(() => h.app().createBaseline('1.0', ''));
    writeImage(5, 7);
    await commitAll(h, 'New diagram');

    const pick10 = () =>
      fireEvent.change(screen.getByLabelText('Project State'), { target: { value: '1.0' } });
    const atBaseline = pdfText(await exportVia(/pdf document/i, pick10));
    expect(atBaseline).toMatch(/\/Width 2\s*\/Height 3/);
    expect(atBaseline).not.toMatch(/\/Width 5\s*\/Height 7/);

    const current = pdfText(await exportVia(/pdf document/i));
    expect(current).toMatch(/\/Width 5\s*\/Height 7/);
  }, 120_000);

  it('the revision history lists changes since the baseline for every kind', async () => {
    h = await startApp();
    await act(() => h.app().addArtifact('risk', { title: 'Outage', dateCreated: now() } as never));
    await act(() =>
      h.app().addArtifact('document', { title: 'Spec', structure: [], dateCreated: now() } as never)
    );
    await commitAll(h, 'First version');
    await act(() => h.app().createBaseline('1.0', ''));
    await nextSecond();
    await act(() => h.app().updateArtifact('risk', 'RISK-001', { owner: 'Ops' }));
    await act(() => h.app().updateArtifact('document', 'DOC-001', { description: 'v2' }));
    await commitAll(h, 'Assign an owner');

    const pdf = pdfText(await exportVia(/pdf document/i));
    expect(pdf).toContain('(1. Revision History)');
    expect(pdf).toContain('(RISK-001)');
    expect(pdf).toContain('(DOC-001)');
    expect(pdf).toContain('(Assign an owner)');

    const wb = XLSX.read(await exportVia(/excel sheet/i), { type: 'array' });
    expect(rowsOf(wb, 'Revision History').map((r) => r['ID'])).toEqual(['RISK-001', 'DOC-001']);
  }, 120_000);

  it('a kind that is unchecked in the dialog is left out', async () => {
    h = await startApp();
    const a = await populate(h);
    const uncheckRisks = () => fireEvent.click(screen.getByRole('checkbox', { name: /^risks/i }));

    const pdf = pdfText(await exportVia(/pdf document/i, uncheckRisks));
    expect(pdf).not.toContain(`(${a.risk.id} - Outage)`);
    expect(pdf).toContain(`(${a.req.id} - Login)`);

    const wb = XLSX.read(await exportVia(/excel sheet/i, uncheckRisks), { type: 'array' });
    expect(wb.SheetNames).not.toContain('Risks');
    expect(wb.SheetNames).toContain('Requirements');
  }, 90_000);

  it('a document in the PDF has its outline and the artifacts it includes', async () => {
    h = await startApp();
    const a = await populate(h);

    const pdf = pdfText(await exportVia(/pdf document/i));

    expect(pdf).toMatch(/\(\d\. Document: Spec\)/);
    expect(pdf).toMatch(/\(\d\.1 Introduction\)/);
    // In the contents, the Requirements section and the document
    expect(pdf.split(`(${a.req.id} - Login)`).length - 1).toBe(3);
  }, 90_000);

  it('JSON export → import into an empty project folder restores everything', async () => {
    h = await startApp();
    const a = await populate(h);
    const exported = await exportVia(/json data/i);
    h.cleanup();

    h = await startApp({ userName: 'Other User' });
    await importVia(
      h,
      'Import JSON',
      new File([exported as BlobPart], 'export.json', { type: 'application/json' })
    );

    await waitFor(() => expect(h.app().artifacts.requirement.map((r) => r.id)).toEqual([a.req.id]));
    const g = h.app().artifacts;
    expect(g.useCase.map((r) => r.id)).toEqual([a.uc.id]);
    expect(g.testCase.map((r) => r.id)).toEqual([a.tc.id]);
    expect(g.information.map((r) => r.id)).toEqual([a.info.id]);
    expect(g.risk.map((r) => r.id)).toEqual([a.risk.id]);
    expect(g.document.map((r) => r.id)).toEqual([a.doc.id]);
    expect(h.app().links).toEqual([
      expect.objectContaining({ sourceId: a.req.id, targetId: a.uc.id, type: 'satisfies' }),
    ]);
    expect(h.exists(`risks/${a.risk.id}.md`)).toBe(true);
    // Every imported file can be read back without problems
    await act(() => h.app().reload());
    expect(h.app().fileProblems).toEqual([]);
    expect(await h.invisibleDirtyPaths()).toEqual([]);
  }, 120_000);

  it('Excel export → edit → import updates every kind', async () => {
    h = await startApp();
    const a = await populate(h);
    const wb = XLSX.read(await exportVia(/excel sheet/i), { type: 'array' });
    h.cleanup();

    // Edit a cell, as someone would in Excel
    const risks = rowsOf(wb, 'Risks');
    risks[0]['Probability'] = 'High';
    wb.Sheets['Risks'] = XLSX.utils.json_to_sheet(risks);
    const bytes = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;

    h = await startApp();
    await importVia(h, 'Import Excel', new File([bytes], 'export.xlsx'));

    await waitFor(() => expect(h.app().artifacts.risk.map((r) => r.id)).toEqual([a.risk.id]));
    expect(h.app().artifacts.risk[0]).toMatchObject({
      title: 'Outage',
      probability: 'high',
      mitigation: 'Redundancy',
    });
    for (const k of ARTIFACT_KINDS) expect(h.app().artifacts[k.id]).toHaveLength(1);
    expect(h.app().artifacts.useCase[0]).toMatchObject({ actor: 'User' });
    await act(() => h.app().reload());
    expect(h.app().fileProblems).toEqual([]);
  }, 120_000);

  it('Excel export → import keeps the links, which are suspect, and the outlines', async () => {
    h = await startApp();
    const a = await populate(h);
    const tcLink = await act(() => h.app().createLink(a.tc.id, a.req.id, 'verifies'));
    // The use case changes after the requirement was linked to it: that link is suspect
    await act(() => h.app().updateArtifact('useCase', a.uc.id, { title: 'Sign in (v2)' }));
    await h.settle();
    const before = linkView(h.app());
    expect(before.map((l) => [l.id, l.suspect])).toEqual([
      [a.link.id, true],
      [tcLink.id, false],
    ]);
    const wb = XLSX.read(await exportVia(/excel sheet/i), { type: 'array' });
    expect(rowsOf(wb, 'Links').map((r) => r['Suspect'] ?? '')).toEqual(['Yes', '']);
    h.cleanup();

    // Someone adds a link in Excel, by the type's label
    const links = rowsOf(wb, 'Links');
    links.push({ 'Link ID': 'LINK-003', Source: a.risk.id, Type: 'Related to', Target: a.info.id });
    wb.Sheets['Links'] = XLSX.utils.json_to_sheet(links);
    const bytes = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;

    h = await startApp();
    await importVia(h, 'Import Excel', new File([bytes], 'export.xlsx'));

    await waitFor(() => expect(h.app().links).toHaveLength(3));
    const view = (l: ReturnType<typeof linkView>[number]) => [
      l.id,
      l.sourceId,
      l.type,
      l.targetId,
      l.suspect,
    ];
    expect(linkView(h.app()).map(view)).toEqual([
      ...before.map(view),
      ['LINK-003', a.risk.id, 'related_to', a.info.id, false],
    ]);
    expect((h.app().artifacts.document[0] as ArtifactDocument).structure).toEqual(
      (a.doc as ArtifactDocument).structure
    );
    await act(() => h.app().reload());
    expect(h.app().fileProblems).toEqual([]);
  }, 120_000);

  it('a document exports to its own PDF from its dialog', async () => {
    h = await startApp();
    const a = await populate(h);
    const saved = captureSaveAs();
    await act(async () =>
      h.app().openModal('document', true, { id: a.doc.id, type: 'document', data: a.doc as never })
    );
    fireEvent.click(await screen.findByRole('button', { name: /export to pdf/i }));

    const pdf = pdfText(await saved);
    expect(pdf).toContain('(Spec)');
    expect(pdf).toContain('(1 Introduction)');
    expect(pdf).toContain(`(${a.req.id} - Login)`);
  }, 90_000);
});
