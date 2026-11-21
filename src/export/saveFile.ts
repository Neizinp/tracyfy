/**
 * Saving an export: the browser's "Save as" dialog where there is one,
 * otherwise a download.
 *
 * The dialog needs a recent click, so it is opened before the export is
 * built: `chooseSaveTarget` first, the slow work, then `save`.
 */

export interface FileKind {
  description: string;
  mime: string;
  extension: string;
}

export const FILE_KINDS = {
  pdf: { description: 'PDF Document', mime: 'application/pdf', extension: '.pdf' },
  excel: {
    description: 'Excel Spreadsheet',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
  },
  json: { description: 'JSON File', mime: 'application/json', extension: '.json' },
} as const satisfies Record<string, FileKind>;

interface Writable {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}
interface SaveHandle {
  createWritable(): Promise<Writable>;
}
type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<SaveHandle>;

/** Where an export goes; null when the user cancelled the dialog */
export interface SaveTarget {
  save(data: Blob): Promise<void>;
}

function download(name: string, data: Blob) {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Ask where to save `name`. Resolves to null if the user cancels. */
export async function chooseSaveTarget(name: string, kind: FileKind): Promise<SaveTarget | null> {
  const picker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
  if (!picker) return { save: async (data) => download(name, data) };
  let handle: SaveHandle;
  try {
    handle = await picker({
      suggestedName: name,
      types: [{ description: kind.description, accept: { [kind.mime]: [kind.extension] } }],
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return null;
    console.error('The save dialog failed; downloading instead', err);
    return { save: async (data) => download(name, data) };
  }
  return {
    save: async (data) => {
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
    },
  };
}
