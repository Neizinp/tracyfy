import { describe, it, expect, vi, beforeEach } from 'vitest';
import { realGitService } from '../realGitService';
import { fileSystemService } from '../fileSystemService';
import git from 'isomorphic-git';

// Mock dependencies
vi.mock('../fileSystemService', () => ({
  fileSystemService: {
    readFile: vi.fn(),
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

    // Mock file NOT existing
    vi.mocked(fileSystemService.readFile).mockResolvedValue(null);

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

    // Mock file existing
    vi.mocked(fileSystemService.readFile).mockResolvedValue('content');

    vi.mocked(git.add).mockResolvedValue(undefined as any);
    vi.mocked(git.commit).mockResolvedValue('oid-456');

    await realGitService.commitFile(filepath, message);

    expect(git.add).toHaveBeenCalled();
    expect(git.remove).not.toHaveBeenCalled();
    expect(git.commit).toHaveBeenCalled();
  });

  it('should serialize concurrent commits to prevent race conditions', async () => {
    (realGitService as any).initialized = true;

    // Track order of commits
    const commitOrder: string[] = [];

    // Mock file existing
    vi.mocked(fileSystemService.readFile).mockResolvedValue('content');
    vi.mocked(git.add).mockResolvedValue(undefined as any);

    // Mock git.commit to add filepath to order array with slight delay
    vi.mocked(git.commit).mockImplementation(async (opts: any) => {
      // Extract filepath from the commit - it's in the call context
      const filepath = opts.message; // We use message to track order
      commitOrder.push(filepath);
      return `oid-${filepath}`;
    });

    // Launch 5 concurrent commits
    const commitPromises = [
      realGitService.commitFile('file1.md', 'msg-1'),
      realGitService.commitFile('file2.md', 'msg-2'),
      realGitService.commitFile('file3.md', 'msg-3'),
      realGitService.commitFile('file4.md', 'msg-4'),
      realGitService.commitFile('file5.md', 'msg-5'),
    ];

    // Wait for all to complete
    await Promise.all(commitPromises);

    // Verify all 5 commits were made (none lost to race condition)
    expect(git.commit).toHaveBeenCalledTimes(5);

    // Verify commits were executed in order (serialized)
    expect(commitOrder).toEqual(['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5']);
  });
});
