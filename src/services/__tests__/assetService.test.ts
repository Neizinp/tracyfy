import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assetService } from '../assetService';
import { fileSystemService } from '../fileSystemService';

// Mock fileSystemService
vi.mock('../fileSystemService', () => ({
  fileSystemService: {
    writeFileBinary: vi.fn().mockResolvedValue(undefined),
    readFileBinary: vi.fn(),
    listFiles: vi.fn().mockResolvedValue([]),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock realGitService
vi.mock('../realGitService', () => ({
  realGitService: {
    commitFile: vi.fn().mockResolvedValue(undefined),
  },
}));

// Helper to create a mock file with arrayBuffer method
function createMockFile(name: string, type: string, content: string = 'test data'): File {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  // Polyfill arrayBuffer if not available
  if (!file.arrayBuffer) {
    (file as any).arrayBuffer = () =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(blob);
      });
  }
  return file;
}

// Helper to create a mock blob with arrayBuffer method
function createMockBlob(content: string, type: string): Blob {
  const blob = new Blob([content], { type });
  // Polyfill arrayBuffer if not available
  if (!blob.arrayBuffer) {
    (blob as any).arrayBuffer = () =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(blob);
      });
  }
  return blob;
}

describe('AssetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadAsset', () => {
    it('should upload an image file and return the relative path', async () => {
      const mockFile = createMockFile('test-image.png', 'image/png');

      const result = await assetService.uploadAsset(mockFile);

      expect(result).toMatch(/^\.\/assets\/[a-f0-9-]+\.png$/);
      expect(fileSystemService.writeFileBinary).toHaveBeenCalledWith(
        expect.stringMatching(/^assets\/[a-f0-9-]+\.png$/),
        expect.any(Uint8Array)
      );
    });

    it('should throw error for non-image files', async () => {
      const mockFile = createMockFile('test.txt', 'text/plain');

      await expect(assetService.uploadAsset(mockFile)).rejects.toThrow(
        'Only image files are supported'
      );
    });

    it('should preserve file extension from filename', async () => {
      const mockFile = createMockFile('photo.jpg', 'image/jpeg');

      const result = await assetService.uploadAsset(mockFile);

      expect(result).toMatch(/\.jpg$/);
    });
  });

  describe('uploadAssetFromBlob', () => {
    it('should upload a blob and return the relative path', async () => {
      const mockBlob = createMockBlob('image data', 'image/png');

      const result = await assetService.uploadAssetFromBlob(mockBlob);

      expect(result).toMatch(/^\.\/assets\/[a-f0-9-]+\.png$/);
      expect(fileSystemService.writeFileBinary).toHaveBeenCalled();
    });

    it('should use suggested name extension when provided', async () => {
      const mockBlob = createMockBlob('image data', 'image/jpeg');

      const result = await assetService.uploadAssetFromBlob(mockBlob, 'custom.gif');

      expect(result).toMatch(/\.gif$/);
    });
  });

  describe('getAssetUrl', () => {
    it('should return null when asset not found', async () => {
      vi.mocked(fileSystemService.readFileBinary).mockResolvedValue(null);

      const result = await assetService.getAssetUrl('./assets/nonexistent.png');

      expect(result).toBeNull();
    });

    it('should return blob URL for existing asset', async () => {
      const mockData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes
      vi.mocked(fileSystemService.readFileBinary).mockResolvedValue(mockData);

      const result = await assetService.getAssetUrl('./assets/test.png');

      expect(result).toMatch(/^blob:/);
    });

    it('should normalize path by removing leading ./', async () => {
      const mockData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      vi.mocked(fileSystemService.readFileBinary).mockResolvedValue(mockData);

      await assetService.getAssetUrl('./assets/test.png');

      expect(fileSystemService.readFileBinary).toHaveBeenCalledWith('assets/test.png');
    });
  });

  describe('listAssets', () => {
    it('should return only image files', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([
        'image1.png',
        'image2.jpg',
        'document.pdf',
        'photo.webp',
        'readme.txt',
      ]);

      const result = await assetService.listAssets();

      expect(result).toEqual(['image1.png', 'image2.jpg', 'photo.webp']);
    });

    it('should return empty array when no assets exist', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);

      const result = await assetService.listAssets();

      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(fileSystemService.listFiles).mockRejectedValue(new Error('Not found'));

      const result = await assetService.listAssets();

      expect(result).toEqual([]);
    });
  });

  describe('deleteAsset', () => {
    it('should delete the asset file', async () => {
      await assetService.deleteAsset('./assets/test.png');

      expect(fileSystemService.deleteFile).toHaveBeenCalledWith('assets/test.png');
    });

    it('should normalize path before deleting', async () => {
      await assetService.deleteAsset('./assets/nested/image.jpg');

      expect(fileSystemService.deleteFile).toHaveBeenCalledWith('assets/nested/image.jpg');
    });
  });
});
