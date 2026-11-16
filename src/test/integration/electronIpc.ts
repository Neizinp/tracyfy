/**
 * Runs the real Electron preload (electron/preload.js) against the real IPC
 * handlers (electron/ipcHandlers.js), with only the Electron runtime faked.
 * Arguments and results pass through structuredClone like real IPC.
 */
import fs from 'node:fs';
import path from 'node:path';
// @ts-expect-error - plain JS module without types
import { registerIpcHandlers } from '../../../electron/ipcHandlers.js';

type Handler = (event: unknown, ...args: unknown[]) => unknown;

export interface ElectronIpc {
  /** Channel → handler, exactly as registered by electron/ipcHandlers.js */
  handlers: Map<string, Handler>;
  /** The object preload.js exposes as window.electronAPI */
  api: Record<string, unknown>;
  /** Channels invoked so far (in order) */
  invoked: string[];
}

export function createElectronIpc(options: {
  /** Directory returned by the native "choose folder" dialog */
  pickedDirectory: string;
  userDataDir: string;
}): ElectronIpc {
  const handlers = new Map<string, Handler>();
  registerIpcHandlers({
    ipcMain: { handle: (channel: string, fn: Handler) => handlers.set(channel, fn) },
    dialog: {
      showOpenDialog: async () => ({ canceled: false, filePaths: [options.pickedDirectory] }),
    },
    safeStorage: {
      isEncryptionAvailable: () => true,
      encryptString: (s: string) => Buffer.from(s, 'utf8'),
      decryptString: (b: Buffer) => Buffer.from(b).toString('utf8'),
    },
    getUserDataPath: () => options.userDataDir,
  });

  const invoked: string[] = [];
  const ipcRenderer = {
    invoke: async (channel: string, ...args: unknown[]) => {
      invoked.push(channel);
      const handler = handlers.get(channel);
      if (!handler) throw new Error(`No IPC handler registered for "${channel}"`);
      const result = await handler({}, ...structuredClone(args));
      return result === undefined ? undefined : structuredClone(result);
    },
  };

  let api: Record<string, unknown> | null = null;
  const preloadSource = fs.readFileSync(
    path.resolve(__dirname, '../../../electron/preload.js'),
    'utf8'
  );
  const fakeRequire = (name: string) => {
    if (name !== 'electron') throw new Error(`preload tried to require "${name}"`);
    return {
      contextBridge: {
        exposeInMainWorld: (key: string, value: Record<string, unknown>) => {
          if (key === 'electronAPI') api = value;
        },
      },
      ipcRenderer,
    };
  };
  new Function('require', 'process', preloadSource)(fakeRequire, process);
  if (!api) throw new Error('preload.js did not expose electronAPI');

  return { handlers, api, invoked };
}
