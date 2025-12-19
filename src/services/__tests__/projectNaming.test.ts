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

// Mock realGitService
vi.mock('../realGitService', () => ({
  realGitService: {
    commitFile: vi.fn().mockResolvedValue(undefined),
    isInitialized: vi.fn().mockReturnValue(true),
  },
}));

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
    it('should save project with ID as filename', async () => {
      const name = 'My New Project';
      const description = 'A description';

      const project = await diskProjectService.createProject(name, description);

      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`projects/${project.id}\\.md$`)),
        expect.any(String)
      );
    });

    it('should throw error if project with same name exists', async () => {
      const name = 'Existing Project';

      // Setup existing project file
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['proj-123.md']);

      vi.mocked(fileSystemService.readFile).mockResolvedValue(`---
id: "proj-123"
name: "${name}"
---
# ${name}`);

      await expect(diskProjectService.createProject(name, 'desc')).rejects.toThrow(
        /Project with name .* already exists/
      );
    });
  });

  describe('updateProject', () => {
    it('should not rename file if project name changes (uses ID)', async () => {
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
        riskIds: [],
        lastModified: Date.now(),
      };

      // Mock listFiles to return the file
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([`${projectId}.md`]);

      // Mock readFile to return content
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path === `projects/${projectId}.md`) {
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

      // Should updated existing file, no delete/rename needed
      expect(fileSystemService.deleteFile).not.toHaveBeenCalled();
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        `projects/${projectId}.md`,
        expect.stringContaining(`name: "${newName}"`)
      );
    });

    it('should throw error if updating to another existing project name', async () => {
      const oldName = 'Old Name';
      const newName = 'Existing Name';
      const projectId = 'proj-123';
      const otherProjectId = 'proj-456';

      // Mock files: Old Project and Existing Project
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([
        `${projectId}.md`,
        `${otherProjectId}.md`,
      ]);

      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path.includes(projectId)) {
          return `---
id: "${projectId}"
name: "${oldName}"
---`;
        }
        if (path.includes(otherProjectId)) {
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
        riskIds: [],
        lastModified: 0,
      };

      await expect(diskProjectService.updateProject(updatedProject)).rejects.toThrow(
        /Project with name .* already exists/
      );
    });
  });

  describe('loadProject', () => {
    it('should load project by its ID-based filename', async () => {
      const projectId = 'proj-target';
      const projectName = 'Target Project';

      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path === `projects/${projectId}.md`) {
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
    it('should soft-delete project by setting isDeleted flag', async () => {
      const projectId = 'proj-del';
      const projectName = 'Delete Me';

      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path.includes(projectId)) {
          return `---
id: "${projectId}"
name: "${projectName}"
lastModified: 12345
---`;
        }
        return null;
      });

      await diskProjectService.deleteProject(projectId);

      // Should write file with isDeleted: true
      expect(fileSystemService.writeFile).toHaveBeenCalled();
      const writeCall = vi
        .mocked(fileSystemService.writeFile)
        .mock.calls.find((call) => call[0].includes(projectId));
      expect(writeCall).toBeDefined();
      expect(writeCall![1]).toContain('isDeleted: true');
    });
  });

  describe('permanentDeleteProject', () => {
    it('should delete file corresponding to the project ID', async () => {
      const projectId = 'proj-del';

      await diskProjectService.permanentDeleteProject(projectId);

      expect(fileSystemService.deleteFile).toHaveBeenCalledWith(`projects/${projectId}.md`);
    });
  });
});
