/**
 * Images in markdown (`![alt](./assets/diagram.png)`) embedded in the PDF
 * below the text that refers to them.
 */
import type { PdfWriter } from './writer';
import { CONTENT_WIDTH } from './writer';

const MAX_HEIGHT = 60;
const PX_TO_MM = 0.264583;

const FORMATS: Record<string, { mime: string; pdf: string }> = {
  png: { mime: 'image/png', pdf: 'PNG' },
  jpg: { mime: 'image/jpeg', pdf: 'JPEG' },
  jpeg: { mime: 'image/jpeg', pdf: 'JPEG' },
  webp: { mime: 'image/webp', pdf: 'WEBP' },
};

/** The relative paths of the images a markdown text shows */
export function imagePaths(markdown: string): string[] {
  return [...markdown.matchAll(/!\[[^\]]*\]\((\.[^)\s]+)\)/g)].map((m) => m[1]);
}

/** Base64 in chunks: spreading a large array into fromCharCode overflows the stack */
function base64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export type ReadAsset = (path: string) => Promise<Uint8Array | null>;

/** Add the images `markdown` refers to; ones that cannot be read are left out */
export async function writeImages(w: PdfWriter, markdown: string, readAsset: ReadAsset) {
  for (const path of imagePaths(markdown)) {
    const format = FORMATS[path.split('.').pop()?.toLowerCase() ?? ''];
    if (!format) continue;
    try {
      const bytes = await readAsset(path.replace(/^\.\//, ''));
      if (!bytes) continue;
      const dataUrl = `data:${format.mime};base64,${base64(bytes)}`;
      const props = w.doc.getImageProperties(dataUrl);
      let width = props.width * PX_TO_MM;
      let height = props.height * PX_TO_MM;
      const scale = Math.min(1, CONTENT_WIDTH / width, MAX_HEIGHT / height);
      width *= scale;
      height *= scale;
      w.image(dataUrl, format.pdf, width, height);
    } catch (err) {
      console.error(`[PDF export] Could not add image ${path}`, err);
    }
  }
}
