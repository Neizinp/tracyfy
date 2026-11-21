/** Types for shared/gitOps.js (plain JS so the Electron main process can import it) */

export interface GitAuthor {
  name: string;
  email: string;
}

export interface GitCommitInfo {
  hash: string;
  message: string;
  author: string;
  authorEmail: string;
  timestamp: number;
  parent: string[];
}

export interface GitTagInfo {
  message: string;
  timestamp: number;
  object: string;
}

export interface GitRemoteOptions {
  remote?: string;
  branch?: string;
  /** Only used in the browser; in Electron the main process supplies the stored token */
  token?: string;
}

export type StatusRow = [string, number, number, number];

export interface GitOps {
  canMoveMainTo(dir: string, oid: string): Promise<boolean>;
  ensureHeadAttached(dir: string): Promise<void>;
  /** The repository's user.name / user.email, or null if no name is set */
  getAuthor(dir: string): Promise<GitAuthor | null>;
  setAuthor(dir: string, author: GitAuthor): Promise<void>;
  init(dir: string): Promise<void>;
  statusMatrix(dir: string, filepaths?: string[]): Promise<StatusRow[]>;
  commitPaths(
    dir: string,
    paths: { add?: string[]; remove?: string[] },
    message: string
  ): Promise<string>;
  checkoutFile(dir: string, filepath: string): Promise<void>;
  log(
    dir: string,
    options?: { depth?: number; filepath?: string; ref?: string }
  ): Promise<GitCommitInfo[]>;
  listFiles(dir: string, ref?: string): Promise<string[]>;
  readBlob(dir: string, oid: string, filepath?: string): Promise<Uint8Array>;
  resolveRef(dir: string, ref: string): Promise<string>;
  isDescendent(dir: string, oid: string, ancestor: string, depth?: number): Promise<boolean>;
  currentBranch(dir: string): Promise<string>;
  annotatedTag(dir: string, ref: string, message: string): Promise<void>;
  listTags(dir: string): Promise<string[]>;
  readTag(dir: string, oid: string): Promise<GitTagInfo>;
  addRemote(dir: string, name: string, url: string): Promise<void>;
  removeRemote(dir: string, name: string): Promise<void>;
  listRemotes(dir: string): Promise<{ name: string; url: string }[]>;
  fetch(dir: string, options?: GitRemoteOptions): Promise<void>;
  push(dir: string, options?: GitRemoteOptions): Promise<void>;
  pull(dir: string, options?: GitRemoteOptions): Promise<{ ok: boolean; conflicts: string[] }>;
}

export type GitOpName = keyof GitOps;

export const DEFAULT_AUTHOR: Readonly<GitAuthor>;
export const GIT_OP_NAMES: readonly GitOpName[];

export class DetachedHeadError extends Error {}

export function createGitOps(deps: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fs: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  git: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getHttp?: () => Promise<any>;
  corsProxy?: string;
}): GitOps;
