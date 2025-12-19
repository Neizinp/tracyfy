import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compositeGitService } from '../compositeGitService';
import { gitCoreService } from '../gitCoreService';
import { gitHistoryService } from '../gitHistoryService';
import { gitRemoteService } from '../gitRemoteService';
import { gitSyncService } from '../gitSyncService';
import { gitBaselineService } from '../gitBaselineService';
import { fileSystemService } from '../../fileSystemService';

// Mock all sub-services
vi.mock('../gitCoreService', () => ({
  gitCoreService: {
    setInitialized: vi.fn(),
    setAddToCacheFn: vi.fn(),
    setEnsureTokenLoadedFn: vi.fn(),
    init: vi.fn(),
    saveArtifact: vi.fn(),
    commitFile: vi.fn(),
    getStatus: vi.fn(),
  },
}));

vi.mock('../gitHistoryService', () => ({
  gitHistoryService: {
    setInitialized: vi.fn(),
    getHistory: vi.fn(),
    getCommitFiles: vi.fn(),
    readFileAtCommit: vi.fn(),
  },
}));

vi.mock('../gitSyncService', () => ({
  gitSyncService: {
    setInitialized: vi.fn(),
    setFetchFn: vi.fn(),
    setPushFn: vi.fn(),
    setHasRemoteFn: vi.fn(),
    setReadFileAtCommitFn: vi.fn(),
    setGetHistoryFn: vi.fn(),
    pullCounters: vi.fn(),
  },
}));

vi.mock('../gitRemoteService', () => ({
  gitRemoteService: {
    setInitialized: vi.fn(),
    getRemotes: vi.fn(),
    fetch: vi.fn(),
    push: vi.fn(),
  },
}));

vi.mock('../gitBaselineService', () => ({
  gitBaselineService: {
    setInitialized: vi.fn(),
    createTag: vi.fn(),
  },
}));

vi.mock('../../fileSystemService', () => ({
  fileSystemService: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

describe('CompositeGitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization Propagation', () => {
    it('should propagate initialized status to all sub-services', () => {
      compositeGitService.initialized = true;

      expect(gitCoreService.setInitialized).toHaveBeenCalledWith(true);
      expect(gitHistoryService.setInitialized).toHaveBeenCalledWith(true);
      expect(gitSyncService.setInitialized).toHaveBeenCalledWith(true);
      expect(gitRemoteService.setInitialized).toHaveBeenCalledWith(true);
      expect(gitBaselineService.setInitialized).toHaveBeenCalledWith(true);
    });
  });

  describe('Core Operations Facade', () => {
    it('should delegate init and set initialized on success', async () => {
      vi.mocked(gitCoreService.init).mockResolvedValue(true);
      const res = await compositeGitService.init();

      expect(res).toBe(true);
      expect(gitCoreService.init).toHaveBeenCalled();
      expect(compositeGitService.initialized).toBe(true);
    });

    it('should delegate saveArtifact with type casting', async () => {
      const artifact = { id: 'REQ-1' };
      await compositeGitService.saveArtifact('requirements', 'REQ-1', artifact);

      expect(gitCoreService.saveArtifact).toHaveBeenCalledWith('requirements', 'REQ-1', artifact);
    });

    it('should delegate commitFile', async () => {
      await compositeGitService.commitFile('path/to/file', 'feat: update');
      expect(gitCoreService.commitFile).toHaveBeenCalledWith(
        'path/to/file',
        'feat: update',
        undefined
      );
    });
  });

  describe('History Operations Facade', () => {
    it('should delegate getHistory', async () => {
      await compositeGitService.getHistory('path', 10);
      expect(gitHistoryService.getHistory).toHaveBeenCalledWith('path', 10, undefined);
    });
  });

  describe('Commit Cache', () => {
    it('should cache commit files and save to disk', async () => {
      const hash = 'abc123';
      const files = ['file1.md', 'file2.md'];

      vi.mocked(gitHistoryService.getCommitFiles).mockResolvedValue(files);
      vi.mocked(fileSystemService.readFile).mockResolvedValue(null); // No cache on disk

      const res = await compositeGitService.getCommitFiles(hash);

      expect(res).toEqual(files);
      expect(gitHistoryService.getCommitFiles).toHaveBeenCalledWith(hash);

      // Secondary call should be cached
      const res2 = await compositeGitService.getCommitFiles(hash);
      expect(res2).toEqual(files);
      expect(gitHistoryService.getCommitFiles).toHaveBeenCalledTimes(1);

      // Should save to disk
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        '.tracyfy/commit-cache.json',
        expect.stringContaining(hash)
      );
    });

    it('should load cache from disk on first use', async () => {
      const hash = 'disk-hash';
      const files = ['disk-file.md'];
      const diskCache = { [hash]: files };

      vi.mocked(fileSystemService.readFile).mockResolvedValue(JSON.stringify(diskCache));

      const res = await compositeGitService.getCommitFiles(hash);

      expect(res).toEqual(files);
      expect(gitHistoryService.getCommitFiles).not.toHaveBeenCalled();
      expect(fileSystemService.readFile).toHaveBeenCalled();
    });
  });

  describe('Other Modules Facade', () => {
    it('should delegate pullCounters to sync service', async () => {
      await compositeGitService.pullCounters('origin', 'main');
      expect(gitSyncService.pullCounters).toHaveBeenCalledWith('origin', 'main');
    });

    it('should delegate remote methods to remote service', async () => {
      await compositeGitService.getRemotes();
      expect(gitRemoteService.getRemotes).toHaveBeenCalled();

      await compositeGitService.fetch('upstream', 'main');
      expect(gitRemoteService.fetch).toHaveBeenCalledWith('upstream', 'main');
    });

    it('should delegate tag creation to baseline service', async () => {
      await compositeGitService.createTag('v1.0.0', 'Release');
      expect(gitBaselineService.createTag).toHaveBeenCalledWith('v1.0.0', 'Release');
    });
  });
});
