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

  it('should migrate legacy ID-named files to Name-named files', async () => {
    const legacyId = 'proj-123';
    const projectName = 'Legacy Project';

    // Mock listFiles to return a legacy file
    vi.mocked(fileSystemService.listFiles).mockResolvedValue([`${legacyId}.md`]);

    // Mock readFile to return content
    vi.mocked(fileSystemService.readFile).mockResolvedValue(`---
id: "${legacyId}"
name: "${projectName}"
---
# ${projectName}`);

    // We assume initialize or a specific migration method will trigger this
    await diskProjectService.migrateLegacyProjectFiles();

    // Should write new file with name
    expect(fileSystemService.writeFile).toHaveBeenCalledWith(
      `projects/${projectName}.md`,
      expect.stringContaining(`name: "${projectName}"`)
    );

    // Should delete old file
    expect(fileSystemService.deleteFile).toHaveBeenCalledWith(`projects/${legacyId}.md`);
  });

  it('should not touch files that are already correctly named', async () => {
    const projectName = 'Correct Name';

    vi.mocked(fileSystemService.listFiles).mockResolvedValue([`${projectName}.md`]);
    vi.mocked(fileSystemService.readFile).mockResolvedValue(`---
id: "proj-456"
name: "${projectName}"
---`);

    await diskProjectService.migrateLegacyProjectFiles();

    expect(fileSystemService.writeFile).not.toHaveBeenCalled();
    expect(fileSystemService.deleteFile).not.toHaveBeenCalled();
  });
});
