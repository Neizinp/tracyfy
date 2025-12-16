/**
 * Asset Service - Manages image and file assets for artifacts
 *
 * Images are stored in the assets/ folder at the root of the project.
 * Files are named with UUIDs to avoid conflicts.
 * Reference format: ![alt](./assets/uuid.png)
 */

import { debug } from '../utils/debug';
import { fileSystemService } from './fileSystemService';

const ASSETS_DIR = 'assets';

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
  };
  return mimeToExt[mimeType] || 'png';
}

/**
 * Get file extension from filename
 */
function getExtensionFromFilename(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts.pop()!.toLowerCase();
  }
  return 'png';
}

class AssetService {
  /**
   * Upload an asset (image file) and return the markdown reference path
   * @param file - The file to upload (from input or clipboard)
   * @returns The relative path to use in markdown: ./assets/uuid.ext
   */
  async uploadAsset(file: File): Promise<string> {
    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are supported');
    }

    // Generate unique filename
    const ext = getExtensionFromFilename(file.name) || getExtensionFromMimeType(file.type);
    const uuid = generateUUID();
    const filename = `${uuid}.${ext}`;
    const path = `${ASSETS_DIR}/${filename}`;

    debug.log(`[uploadAsset] Uploading image: ${file.name} -> ${path}`);

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    debug.log(`[uploadAsset] Writing ${uint8Array.length} bytes to ${path}`);

    // Write to disk
    await fileSystemService.writeFileBinary(path, uint8Array);

    debug.log(`[uploadAsset] Successfully wrote to ${path}`);

    // Return relative path for markdown
    return `./${path}`;
  }

  /**
   * Upload an asset from a Blob (e.g., from clipboard)
   * @param blob - The blob to upload
   * @param suggestedName - Optional suggested filename
   * @returns The relative path to use in markdown
   */
  async uploadAssetFromBlob(blob: Blob, suggestedName?: string): Promise<string> {
    const ext = suggestedName
      ? getExtensionFromFilename(suggestedName)
      : getExtensionFromMimeType(blob.type);
    const uuid = generateUUID();
    const filename = `${uuid}.${ext}`;
    const path = `${ASSETS_DIR}/${filename}`;

    // Read blob as ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Write to disk
    await fileSystemService.writeFileBinary(path, uint8Array);

    // Return relative path for markdown
    return `./${path}`;
  }

  /**
   * Get a blob URL for displaying an asset
   * @param relativePath - The relative path (e.g., ./assets/uuid.png)
   * @returns A blob URL that can be used in img src
   */
  async getAssetUrl(relativePath: string): Promise<string | null> {
    // Normalize the path (remove leading ./)
    const normalizedPath = relativePath.replace(/^\.\//, '');

    // Read the binary data
    const data = await fileSystemService.readFileBinary(normalizedPath);
    if (!data) {
      console.warn(`[AssetService] Asset not found: ${relativePath}`);
      return null;
    }

    // Determine MIME type from extension
    const ext = normalizedPath.split('.').pop()?.toLowerCase() || 'png';
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      tiff: 'image/tiff',
    };
    const mimeType = mimeTypes[ext] || 'image/png';

    // Create blob URL - cast to ArrayBuffer to satisfy TypeScript
    const arrayBuffer = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * List all assets in the assets folder
   * @returns Array of asset filenames
   */
  async listAssets(): Promise<string[]> {
    try {
      const files = await fileSystemService.listFiles(ASSETS_DIR);
      return files.filter((f) => {
        const ext = f.split('.').pop()?.toLowerCase();
        return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(ext || '');
      });
    } catch {
      return [];
    }
  }

  /**
   * Delete an asset
   * @param relativePath - The relative path (e.g., ./assets/uuid.png)
   */
  async deleteAsset(relativePath: string): Promise<void> {
    const normalizedPath = relativePath.replace(/^\.\//, '');
    await fileSystemService.deleteFile(normalizedPath);
  }
}

export const assetService = new AssetService();
