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

// Mock markdownUtils to avoid complex parsing logic in tests if possible,
// or just rely on the real one since it's a utility.
// Actually, real utils are better to ensure integration works.
// We mocked fileSystemService, so we control what readFile returns.

describe('DiskProjectService - Project Naming and Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createProject', () => {
    it('should save project with name as filename', async () => {
      const name = 'My New Project';
      const description = 'A description';

      await diskProjectService.createProject(name, description);

      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/projects\/My New Project\.md$/),
        expect.any(String)
      );
    });

    it('should throw error if project with same name exists', async () => {
      const name = 'Existing Project';

      // Setup existing project file
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['Existing Project.md']);

      vi.mocked(fileSystemService.readFile).mockResolvedValue(`---
id: "proj-existing"
name: "${name}"
---
# ${name}`);

      await expect(diskProjectService.createProject(name, 'desc')).rejects.toThrow(
        /Project with name .* already exists/
      );
    });
  });

  describe('updateProject', () => {
    it('should rename file if project name changes', async () => {
      const oldName = 'Old Name';
      const newName = 'New Name';
      const projectId = 'proj-123';

      const existingProject = {
        id: projectId,
        name: oldName,
        description: 'desc',
        requirementIds: [],
        useCaseIds: [],
        testCaseIds: [],
        informationIds: [],
        lastModified: Date.now(),
      };

      // Mock listFiles to return the old file
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([`${oldName}.md`]);

      // Mock readFile to return content when searching for ID
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path === `projects/${oldName}.md`) {
          return `---
id: "${projectId}"
name: "${oldName}"
---
# ${oldName}`;
        }
        return null;
      });

      const updatedProject = { ...existingProject, name: newName };

      await diskProjectService.updateProject(updatedProject);

      // Should delete old file and write new file
      expect(fileSystemService.deleteFile).toHaveBeenCalledWith(`projects/${oldName}.md`);
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        `projects/${newName}.md`,
        expect.any(String)
      );
    });

    it('should throw error if renaming to existing name', async () => {
      const oldName = 'Old Name';
      const newName = 'Existing Name';
      const projectId = 'proj-123';
      const otherProjectId = 'proj-456';

      // Mock files: Old Project and Existing Project
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([`${oldName}.md`, `${newName}.md`]);

      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path.includes(oldName)) {
          return `---
id: "${projectId}"
name: "${oldName}"
---`;
        }
        if (path.includes(newName)) {
          return `---
id: "${otherProjectId}"
name: "${newName}"
---`;
        }
        return null;
      });

      const updatedProject = {
        id: projectId,
        name: newName,
        description: '',
        requirementIds: [],
        useCaseIds: [],
        testCaseIds: [],
        informationIds: [],
        lastModified: 0,
      };

      await expect(diskProjectService.updateProject(updatedProject)).rejects.toThrow(
        /Project with name .* already exists/
      );
    });
  });

  describe('loadProject', () => {
    it('should find project by ID regardless of filename', async () => {
      const projectId = 'proj-target';
      const projectName = 'Target Project';

      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['Other.md', `${projectName}.md`]);

      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path.endsWith('Other.md')) {
          return `---
id: "proj-other"
name: "Other"
---`;
        }
        if (path.endsWith(`${projectName}.md`)) {
          return `---
id: "${projectId}"
name: "${projectName}"
---`;
        }
        return null;
      });

      const project = await diskProjectService.loadProject(projectId);

      expect(project).not.toBeNull();
      expect(project?.id).toBe(projectId);
      expect(project?.name).toBe(projectName);
    });
  });

  describe('deleteProject', () => {
    it('should delete file corresponding to the project ID', async () => {
      const projectId = 'proj-del';
      const projectName = 'Delete Me';

      vi.mocked(fileSystemService.listFiles).mockResolvedValue([`${projectName}.md`]);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path.endsWith(`${projectName}.md`)) {
          return `---
id: "${projectId}"
name: "${projectName}"
---`;
        }
        return null;
      });

      await diskProjectService.deleteProject(projectId);

      expect(fileSystemService.deleteFile).toHaveBeenCalledWith(`projects/${projectName}.md`);
    });
  });
});
