import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { diskProjectService } from '../diskProjectService';
import { fileSystemService } from '../fileSystemService';

// Mock the fileSystemService
vi.mock('../fileSystemService', () => ({
  fileSystemService: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    deleteFile: vi.fn(),
    listFiles: vi.fn(),
    getOrCreateDirectory: vi.fn(),
  },
}));

describe('DiskProjectService - Migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should migrate legacy Name-named files to ID-named files', async () => {
    const legacyName = 'Legacy Project';
    const projectId = 'proj-123';

    // Mock listFiles to return a name-based file
    vi.mocked(fileSystemService.listFiles).mockResolvedValue([`${legacyName}.md`]);

    // Mock readFile to return content
    vi.mocked(fileSystemService.readFile).mockResolvedValue(`---
id: "${projectId}"
name: "${legacyName}"
---
# ${legacyName}`);

    await diskProjectService.migrateLegacyProjectFiles();

    // Should write new file with ID
    expect(fileSystemService.writeFile).toHaveBeenCalledWith(
      `projects/${projectId}.md`,
      expect.stringContaining(`id: "${projectId}"`)
    );

    // Should delete old file with name
    expect(fileSystemService.deleteFile).toHaveBeenCalledWith(`projects/${legacyName}.md`);
  });

  it('should not touch files that are already correctly named (ID-based)', async () => {
    const projectId = 'proj-456';
    const projectName = 'Correct Name';

    vi.mocked(fileSystemService.listFiles).mockResolvedValue([`${projectId}.md`]);
    vi.mocked(fileSystemService.readFile).mockResolvedValue(`---
id: "${projectId}"
name: "${projectName}"
---`);

    await diskProjectService.migrateLegacyProjectFiles();

    expect(fileSystemService.writeFile).not.toHaveBeenCalled();
    expect(fileSystemService.deleteFile).not.toHaveBeenCalled();
  });
});
