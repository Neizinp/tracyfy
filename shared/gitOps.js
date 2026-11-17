/**
 * Git operations shared by both runtimes.
 *
 * The app runs in two environments that reach the disk differently:
 * - Electron: the main process uses Node's fs (electron/ipcHandlers.js)
 * - Browser: the renderer uses the File System Access API (fsAdapter)
 *
 * Only the `fs` (and `http`) implementation differs. All git logic lives here,
 * once, and both environments call it with their own fs. Plain JavaScript so
 * the Electron main process can import it without a build step; types are in
 * gitOps.d.ts.
 */

/** Author of commits made before the user has set user.name in the repository */
export const DEFAULT_AUTHOR = Object.freeze({ name: 'Tracyfy User', email: 'user@tracyfy.local' });

/** Error thrown when a commit would discard commits on main (see ensureHeadAttached) */
export class DetachedHeadError extends Error {
  constructor() {
    super(
      'HEAD is detached at a commit that is not on the main branch. ' +
        'Committing would discard commits on main; check out main before committing.'
    );
    this.name = 'DetachedHeadError';
  }
}

/**
 * @param {object} deps
 * @param {any} deps.fs - isomorphic-git compatible fs (Node fs or fsAdapter)
 * @param {any} deps.git - isomorphic-git module
 * @param {() => Promise<any>} [deps.getHttp] - lazily loads the http client for remote ops
 * @param {string} [deps.corsProxy] - CORS proxy for remote ops (browser only)
 */
export function createGitOps({ fs, git, getHttp, corsProxy }) {
  const onAuth = (token) =>
    token ? () => ({ username: 'x-access-token', password: token }) : undefined;

  const remoteOptions = async (dir, remote, token) => ({
    fs,
    http: await getHttp(),
    dir,
    remote: remote || 'origin',
    ...(corsProxy ? { corsProxy } : {}),
    onAuth: onAuth(token),
  });

  /**
   * Whether refs/heads/main can be moved to `oid` without losing history:
   * main doesn't exist yet, already points at `oid`, or `oid` descends from main.
   */
  async function canMoveMainTo(dir, oid) {
    let mainOid;
    try {
      mainOid = await git.resolveRef({ fs, dir, ref: 'refs/heads/main' });
    } catch {
      return true; // main doesn't exist yet
    }
    if (mainOid === oid) return true;
    return git.isDescendent({ fs, dir, oid, ancestor: mainOid, depth: -1 });
  }

  /**
   * Make sure HEAD is the symbolic ref to main, so commits move the branch.
   * A detached HEAD is reattached only if that is a fast-forward of main;
   * otherwise DetachedHeadError is thrown and nothing is changed.
   */
  async function ensureHeadAttached(dir) {
    // Symbolic HEAD (also on a fresh repo where main has no commits yet): nothing to do
    if (await git.currentBranch({ fs, dir })) return;
    let head;
    try {
      head = await git.resolveRef({ fs, dir, ref: 'HEAD' });
    } catch {
      return; // no HEAD at all - git.commit will create it
    }
    if (!(await canMoveMainTo(dir, head))) throw new DetachedHeadError();
    await git.writeRef({ fs, dir, ref: 'refs/heads/main', value: head, force: true });
    await git.writeRef({
      fs,
      dir,
      ref: 'HEAD',
      value: 'refs/heads/main',
      symbolic: true,
      force: true,
    });
  }

  /** The repository's user.name / user.email (.git/config), or null if no name is set */
  async function getAuthor(dir) {
    const name = await git.getConfig({ fs, dir, path: 'user.name' });
    if (!name) return null;
    const email = await git.getConfig({ fs, dir, path: 'user.email' });
    return { name, email: email || '' };
  }

  /** The git author is the user (P5 in docs/DESIGN.md) */
  async function authorOf(dir) {
    return (await getAuthor(dir)) || DEFAULT_AUTHOR;
  }

  return {
    canMoveMainTo,
    ensureHeadAttached,
    getAuthor,

    /** Set user.name / user.email in the repository's own config (not committed) */
    async setAuthor(dir, { name, email }) {
      await git.setConfig({ fs, dir, path: 'user.name', value: name });
      await git.setConfig({ fs, dir, path: 'user.email', value: email });
    },

    async init(dir) {
      await git.init({ fs, dir, defaultBranch: 'main' });
    },

    /** Raw isomorphic-git status matrix, optionally limited to some paths */
    async statusMatrix(dir, filepaths) {
      return git.statusMatrix({ fs, dir, cache: {}, ...(filepaths ? { filepaths } : {}) });
    },

    /**
     * Stage the given paths (add = new/modified, remove = deleted) and commit
     * them, after making sure HEAD is safely attached to main.
     * @returns {Promise<string>} the new commit oid
     */
    async commitPaths(dir, { add = [], remove = [] }, message) {
      await ensureHeadAttached(dir);
      const cache = {};
      for (const filepath of remove) await git.remove({ fs, dir, filepath, cache });
      for (const filepath of add) await git.add({ fs, dir, filepath, cache });
      return git.commit({ fs, dir, message, author: await authorOf(dir), cache });
    },

    /** Discard working-tree changes to one file */
    async checkoutFile(dir, filepath) {
      await git.checkout({ fs, dir, ref: 'HEAD', filepaths: [filepath], force: true });
    },

    /** Commit history, newest first, in the app's CommitInfo shape */
    async log(dir, { depth = 100, filepath, ref = 'HEAD' } = {}) {
      const commits = await git.log({ fs, dir, depth, ref, ...(filepath ? { filepath } : {}) });
      return commits.map((c) => ({
        hash: c.oid,
        message: c.commit.message,
        author: c.commit.author.name,
        authorEmail: c.commit.author.email,
        timestamp: c.commit.author.timestamp * 1000,
        parent: c.commit.parent,
      }));
    },

    async listFiles(dir, ref) {
      return git.listFiles({ fs, dir, ref });
    },

    /** File content at a commit, as bytes */
    async readBlob(dir, oid, filepath) {
      const { blob } = await git.readBlob({ fs, dir, oid, filepath });
      return new Uint8Array(blob);
    },

    async resolveRef(dir, ref) {
      return git.resolveRef({ fs, dir, ref });
    },

    async isDescendent(dir, oid, ancestor, depth) {
      return git.isDescendent({ fs, dir, oid, ancestor, depth });
    },

    async currentBranch(dir) {
      return (await git.currentBranch({ fs, dir })) || 'main';
    },

    async annotatedTag(dir, ref, message) {
      await git.annotatedTag({ fs, dir, ref, message, tagger: await authorOf(dir) });
    },

    async listTags(dir) {
      return git.listTags({ fs, dir });
    },

    async readTag(dir, oid) {
      const { tag } = await git.readTag({ fs, dir, oid });
      return { message: tag.message, timestamp: tag.tagger.timestamp * 1000, object: tag.object };
    },

    async addRemote(dir, name, url) {
      await git.addRemote({ fs, dir, remote: name, url });
    },

    async removeRemote(dir, name) {
      await git.deleteRemote({ fs, dir, remote: name });
    },

    async listRemotes(dir) {
      const remotes = await git.listRemotes({ fs, dir });
      return remotes.map((r) => ({ name: r.remote, url: r.url }));
    },

    async fetch(dir, { remote, branch, token } = {}) {
      await git.fetch({
        ...(await remoteOptions(dir, remote, token)),
        ...(branch ? { ref: branch, singleBranch: true } : {}),
      });
    },

    async push(dir, { remote, branch, token } = {}) {
      await git.push({ ...(await remoteOptions(dir, remote, token)), ref: branch || 'main' });
    },

    /** @returns {Promise<{ ok: boolean, conflicts: string[] }>} */
    async pull(dir, { remote, branch, token } = {}) {
      try {
        await git.pull({
          ...(await remoteOptions(dir, remote, token)),
          ref: branch || 'main',
          author: await authorOf(dir),
        });
        return { ok: true, conflicts: [] };
      } catch (error) {
        if (error?.code === 'MergeConflictError' || error?.code === 'CheckoutConflictError') {
          return { ok: false, conflicts: error.data?.filepaths || [] };
        }
        throw error;
      }
    },
  };
}

/** Names of the operations above that take a repository dir as first argument */
export const GIT_OP_NAMES = Object.freeze([
  'canMoveMainTo',
  'ensureHeadAttached',
  'getAuthor',
  'setAuthor',
  'init',
  'statusMatrix',
  'commitPaths',
  'checkoutFile',
  'log',
  'listFiles',
  'readBlob',
  'resolveRef',
  'isDescendent',
  'currentBranch',
  'annotatedTag',
  'listTags',
  'readTag',
  'addRemote',
  'removeRemote',
  'listRemotes',
  'fetch',
  'push',
  'pull',
]);
