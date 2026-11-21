/**
 * Hands out new IDs from the file names in a folder (P4 in docs/DESIGN.md).
 *
 * The next ID is one more than the highest file in the folder, or than the
 * highest ID this session already handed out, whichever is higher. The latter
 * covers IDs that were allocated but not saved yet, so two quick creates never
 * get the same ID. Allocation is serialized per folder.
 */
import { fileSystemService } from '../services/fileSystemService';
import { nextIds } from '../domain/ids';
import { KeyedLock } from '../utils/keyedLock';

const ID_FILE = /\.md$/;

class IdAllocator {
  private lock = new KeyedLock();
  /** Highest ID per folder handed out this session */
  private handedOut = new Map<string, string>();

  /** IDs (file names without .md) in a folder; a missing folder has none */
  private async idsInFolder(folder: string): Promise<string[]> {
    try {
      const files = await fileSystemService.listFiles(folder);
      return files.filter((f) => ID_FILE.test(f)).map((f) => f.replace(ID_FILE, ''));
    } catch {
      return [];
    }
  }

  async next(folder: string, prefix: string): Promise<string> {
    const [id] = await this.nextMany(folder, prefix, 1);
    return id;
  }

  async nextMany(folder: string, prefix: string, count: number): Promise<string[]> {
    if (count <= 0) return [];
    return this.lock.run(folder, async () => {
      const existing = await this.idsInFolder(folder);
      const last = this.handedOut.get(folder);
      if (last) existing.push(last);
      const ids = nextIds(prefix, existing, count);
      this.handedOut.set(folder, ids[ids.length - 1]);
      return ids;
    });
  }

  /** Forget what was handed out (another project folder was opened) */
  reset(): void {
    this.handedOut.clear();
  }
}

export const idAllocator = new IdAllocator();
