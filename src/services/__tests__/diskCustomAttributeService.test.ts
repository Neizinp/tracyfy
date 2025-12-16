/**
 * DiskCustomAttributeService Tests
 *
 * Tests for CRUD operations on CustomAttributeDefinition entities stored as Markdown files.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { diskCustomAttributeService } from '../diskCustomAttributeService';
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

describe('DiskCustomAttributeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const sampleDefinitionMarkdown = `---
id: ATTR-001
name: Target Release
type: dropdown
description: Target release for this item
options: v1.0, v1.1, v2.0
appliesTo: requirement, useCase
required: false
dateCreated: 1700000000000
lastModified: 1700000100000
---

# ATTR-001: Target Release

Target release for this item
`;

  const checkboxDefinitionMarkdown = `---
id: ATTR-002
name: Safety Critical
type: checkbox
description: Is this a safety-critical item?
options: 
appliesTo: requirement, testCase
required: true
dateCreated: 1700000000000
lastModified: 1700000000000
---

# ATTR-002: Safety Critical

Is this a safety-critical item?
`;

  describe('initialize', () => {
    it('should create the custom-attributes directory', async () => {
      await diskCustomAttributeService.initialize();

      expect(fileSystemService.getOrCreateDirectory).toHaveBeenCalledWith('custom-attributes');
    });
  });

  describe('getAllDefinitions', () => {
    it('should load all definitions from the custom-attributes directory', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['ATTR-001.md', 'ATTR-002.md']);
      vi.mocked(fileSystemService.readFile)
        .mockResolvedValueOnce(sampleDefinitionMarkdown)
        .mockResolvedValueOnce(checkboxDefinitionMarkdown);

      const definitions = await diskCustomAttributeService.getAllDefinitions();

      expect(fileSystemService.listFiles).toHaveBeenCalledWith('custom-attributes');
      expect(definitions).toHaveLength(2);
      expect(definitions[0].id).toBe('ATTR-001');
      expect(definitions[0].name).toBe('Target Release');
      expect(definitions[0].type).toBe('dropdown');
      // Options stored as comma-separated string in YAML
      expect(definitions[0].options).toContain('v1.0');
      expect(definitions[1].id).toBe('ATTR-002');
    });

    it('should return empty array when directory is empty', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);

      const definitions = await diskCustomAttributeService.getAllDefinitions();

      expect(definitions).toEqual([]);
    });

    it('should skip non-markdown files', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([
        'ATTR-001.md',
        'readme.txt',
        '.gitkeep',
      ]);
      vi.mocked(fileSystemService.readFile).mockResolvedValue(sampleDefinitionMarkdown);

      const definitions = await diskCustomAttributeService.getAllDefinitions();

      expect(definitions).toHaveLength(1);
      expect(fileSystemService.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle directory not existing', async () => {
      vi.mocked(fileSystemService.listFiles).mockRejectedValue(new Error('Directory not found'));

      const definitions = await diskCustomAttributeService.getAllDefinitions();

      expect(definitions).toEqual([]);
    });
  });

  describe('getDefinitionById', () => {
    it('should return the definition with the given ID', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(sampleDefinitionMarkdown);

      const definition = await diskCustomAttributeService.getDefinitionById('ATTR-001');

      expect(definition).not.toBeNull();
      expect(definition!.id).toBe('ATTR-001');
      expect(definition!.name).toBe('Target Release');
      expect(definition!.appliesTo).toContain('requirement');
      expect(definition!.appliesTo).toContain('useCase');
    });

    it('should return null if definition does not exist', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(null);

      const definition = await diskCustomAttributeService.getDefinitionById('ATTR-999');

      expect(definition).toBeNull();
    });
  });

  describe('createDefinition', () => {
    it('should create a new definition file with generated ID', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(null); // Counter doesn't exist
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);
      vi.mocked(fileSystemService.getOrCreateDirectory).mockResolvedValue(
        undefined as unknown as FileSystemDirectoryHandle
      );

      const definition = await diskCustomAttributeService.createDefinition({
        name: 'Test Attribute',
        type: 'text',
        description: 'A test attribute',
        appliesTo: ['requirement'],
        required: false,
      });

      expect(definition.id).toBe('ATTR-001');
      expect(definition.name).toBe('Test Attribute');
      expect(definition.type).toBe('text');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'custom-attributes/ATTR-001.md',
        expect.any(String)
      );
    });

    it('should increment counter for subsequent definitions', async () => {
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path === 'counters/custom-attributes.md') return '5';
        return null;
      });
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);
      vi.mocked(fileSystemService.getOrCreateDirectory).mockResolvedValue(
        undefined as unknown as FileSystemDirectoryHandle
      );

      const definition = await diskCustomAttributeService.createDefinition({
        name: 'New Attribute',
        type: 'number',
        description: '',
        appliesTo: ['testCase'],
        required: false,
      });

      expect(definition.id).toBe('ATTR-006');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'counters/custom-attributes.md',
        '6'
      );
    });

    it('should set dateCreated and lastModified', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(null);
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);
      vi.mocked(fileSystemService.getOrCreateDirectory).mockResolvedValue(
        undefined as unknown as FileSystemDirectoryHandle
      );

      const before = Date.now();
      const definition = await diskCustomAttributeService.createDefinition({
        name: 'Test',
        type: 'text',
        description: '',
        appliesTo: ['requirement'],
        required: false,
      });
      const after = Date.now();

      expect(definition.dateCreated).toBeGreaterThanOrEqual(before);
      expect(definition.dateCreated).toBeLessThanOrEqual(after);
      expect(definition.lastModified).toBe(definition.dateCreated);
    });
  });

  describe('updateDefinition', () => {
    it('should update definition name', async () => {
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path === 'custom-attributes/ATTR-001.md') return sampleDefinitionMarkdown;
        return null;
      });
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['ATTR-001.md']);
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const updated = await diskCustomAttributeService.updateDefinition('ATTR-001', {
        name: 'Updated Name',
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated Name');
      // Verify writeFile was called with correct path
      expect(fileSystemService.writeFile).toHaveBeenCalled();
      const callArgs = vi.mocked(fileSystemService.writeFile).mock.calls[0];
      expect(callArgs[0]).toBe('custom-attributes/ATTR-001.md');
      expect(callArgs[1]).toContain('Updated Name');
    });

    it('should update lastModified timestamp', async () => {
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path === 'custom-attributes/ATTR-001.md') return sampleDefinitionMarkdown;
        return null;
      });
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['ATTR-001.md']);
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const before = Date.now();
      const updated = await diskCustomAttributeService.updateDefinition('ATTR-001', {
        description: 'Updated description',
      });
      const after = Date.now();

      expect(updated!.lastModified).toBeGreaterThanOrEqual(before);
      expect(updated!.lastModified).toBeLessThanOrEqual(after);
    });

    it('should return null if definition does not exist', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(null);
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);

      const updated = await diskCustomAttributeService.updateDefinition('ATTR-999', {
        name: 'New Name',
      });

      expect(updated).toBeNull();
    });
  });

  describe('deleteDefinition (soft delete)', () => {
    it('should soft delete the definition by setting isDeleted flag', async () => {
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path === 'custom-attributes/ATTR-001.md') return sampleDefinitionMarkdown;
        return null;
      });
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      await diskCustomAttributeService.deleteDefinition('ATTR-001');

      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'custom-attributes/ATTR-001.md',
        expect.stringContaining('isDeleted: true')
      );
    });
  });

  describe('permanentDeleteDefinition', () => {
    it('should delete the definition file', async () => {
      vi.mocked(fileSystemService.deleteFile).mockResolvedValue(undefined);

      await diskCustomAttributeService.permanentDeleteDefinition('ATTR-001');

      expect(fileSystemService.deleteFile).toHaveBeenCalledWith('custom-attributes/ATTR-001.md');
    });

    it('should throw error if deletion fails', async () => {
      vi.mocked(fileSystemService.deleteFile).mockRejectedValue(new Error('Delete failed'));

      await expect(
        diskCustomAttributeService.permanentDeleteDefinition('ATTR-999')
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('getDefinitionsForArtifactType', () => {
    it('should filter definitions by artifact type', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['ATTR-001.md', 'ATTR-002.md']);
      vi.mocked(fileSystemService.readFile)
        .mockResolvedValueOnce(sampleDefinitionMarkdown) // requirement, useCase
        .mockResolvedValueOnce(checkboxDefinitionMarkdown); // requirement, testCase

      const definitions =
        await diskCustomAttributeService.getDefinitionsForArtifactType('requirement');

      expect(definitions).toHaveLength(2);
      expect(definitions[0].name).toBe('Target Release');
      expect(definitions[1].name).toBe('Safety Critical');
    });

    it('should return only matching definitions', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['ATTR-001.md', 'ATTR-002.md']);
      vi.mocked(fileSystemService.readFile)
        .mockResolvedValueOnce(sampleDefinitionMarkdown) // requirement, useCase
        .mockResolvedValueOnce(checkboxDefinitionMarkdown); // requirement, testCase

      const definitions = await diskCustomAttributeService.getDefinitionsForArtifactType('useCase');

      expect(definitions).toHaveLength(1);
      expect(definitions[0].name).toBe('Target Release');
    });
  });
});
