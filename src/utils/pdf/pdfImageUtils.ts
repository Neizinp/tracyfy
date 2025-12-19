/**
 * PDF Image Utilities
 *
 * Handles image extraction from markdown, loading from filesystem, and embedding in PDF.
 */

import jsPDF from 'jspdf';
import { fileSystemService } from '../../services/fileSystemService';
import type { PageRef } from './types';

// Image cache to avoid loading the same image multiple times
const imageCache = new Map<string, string>();

/**
 * Extract image paths from markdown content
 * Matches ![alt](./assets/...) pattern
 */
export function extractImagePaths(markdown: string): string[] {
  const regex = /!\[[^\]]*\]\((\.[^)]+)\)/g;
  const paths: string[] = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

/**
 * Load an image from the file system and convert to base64 data URL
 * Returns null if image cannot be loaded
 */
export async function loadImageAsBase64(relativePath: string): Promise<string | null> {
  // Check cache first
  if (imageCache.has(relativePath)) {
    return imageCache.get(relativePath)!;
  }

  try {
    // Normalize path (remove leading ./)
    const normalizedPath = relativePath.replace(/^\.\//, '');

    // Read binary data
    const data = await fileSystemService.readFileBinary(normalizedPath);
    if (!data) {
      console.warn(`[PDF Export] Image not found: ${relativePath}`);
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
    };
    const mimeType = mimeTypes[ext] || 'image/png';

    // Convert to base64 data URL
    const base64 = btoa(String.fromCharCode(...data));
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Cache the result
    imageCache.set(relativePath, dataUrl);

    return dataUrl;
  } catch (error) {
    console.error(`[PDF Export] Failed to load image: ${relativePath}`, error);
    return null;
  }
}

/**
 * Add images from markdown content to the PDF at the current position
 * Returns the new Y position after adding images
 */
export async function addImagesFromMarkdown(
  doc: jsPDF,
  markdown: string,
  startY: number,
  contentLeft: number,
  contentWidth: number,
  pageRef: PageRef
): Promise<number> {
  const imagePaths = extractImagePaths(markdown);
  if (imagePaths.length === 0) return startY;

  let currentY = startY;
  const maxImageHeight = 60; // Maximum image height in mm
  const maxImageWidth = contentWidth;

  for (const imagePath of imagePaths) {
    const dataUrl = await loadImageAsBase64(imagePath);
    if (!dataUrl) continue;

    try {
      // Get image dimensions
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = dataUrl;
      });

      // Calculate scaled dimensions to fit within bounds
      let imgWidth = img.width;
      let imgHeight = img.height;

      // Convert pixels to mm (assuming 96 DPI)
      const pxToMm = 0.264583;
      imgWidth *= pxToMm;
      imgHeight *= pxToMm;

      // Scale to fit within max dimensions
      if (imgWidth > maxImageWidth) {
        const scale = maxImageWidth / imgWidth;
        imgWidth = maxImageWidth;
        imgHeight *= scale;
      }
      if (imgHeight > maxImageHeight) {
        const scale = maxImageHeight / imgHeight;
        imgHeight = maxImageHeight;
        imgWidth *= scale;
      }

      // Check if we need a new page
      if (currentY + imgHeight > 270) {
        doc.addPage();
        pageRef.page++;
        currentY = 20;
      }

      // Determine format (jsPDF only supports JPEG, PNG, WEBP)
      const ext = imagePath.split('.').pop()?.toLowerCase() || 'png';
      const format = ext === 'jpg' ? 'JPEG' : ext.toUpperCase();

      // Add the image
      doc.addImage(dataUrl, format, contentLeft, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 3; // Add some spacing after image
    } catch (error) {
      console.error(`[PDF Export] Failed to add image to PDF: ${imagePath}`, error);
    }
  }

  return currentY;
}

/**
 * Clear the image cache (useful for testing or memory management)
 */
export function clearImageCache(): void {
  imageCache.clear();
}
