import { describe, it, expect, vi, beforeEach } from 'vitest';
import { realGitService } from '../realGitService';
import { fileSystemService } from '../fileSystemService';
import git from 'isomorphic-git';

// Mock dependencies
vi.mock('../fileSystemService', () => ({
  fileSystemService: {
    readFile: vi.fn(),
    readFileBinary: vi.fn(),
    writeFile: vi.fn(),
    checkGitExists: vi.fn(),
  },
}));

vi.mock('isomorphic-git');

describe('RealGitService - Deletions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock init as true by cheating private prop or using init
    // simplest is to mock init call to return true and set initialized
    vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
    vi.mocked(fileSystemService.readFile).mockResolvedValue('ref: refs/heads/main');
    // We'll call init in test or cast to any to set initialized
  });

  it('should use git.remove when file does not exist on disk', async () => {
    // Setup service as initialized
    (realGitService as any).initialized = true;

    const filepath = 'deleted-file.md';
    const message = 'Delete file';

    // Mock file NOT existing (readFileBinary returns null)
    vi.mocked(fileSystemService.readFileBinary).mockResolvedValue(null);

    // Mock git functions
    vi.mocked(git.remove).mockResolvedValue(undefined as any);
    vi.mocked(git.commit).mockResolvedValue('oid-123');

    await realGitService.commitFile(filepath, message);

    expect(git.remove).toHaveBeenCalled();
    expect(git.add).not.toHaveBeenCalled();
    expect(git.commit).toHaveBeenCalled();
  });

  it('should use git.add when file exists on disk', async () => {
    (realGitService as any).initialized = true;

    const filepath = 'existing-file.md';
    const message = 'Update file';

    // Mock file existing (readFileBinary returns binary content)
    vi.mocked(fileSystemService.readFileBinary).mockResolvedValue(new Uint8Array([1, 2, 3]));

    vi.mocked(git.add).mockResolvedValue(undefined as any);
    vi.mocked(git.commit).mockResolvedValue('oid-456');

    await realGitService.commitFile(filepath, message);

    expect(git.add).toHaveBeenCalled();
    expect(git.remove).not.toHaveBeenCalled();
    expect(git.commit).toHaveBeenCalled();
  });
});
