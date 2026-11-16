/**
 * A File System Access API directory handle backed by a real folder (Node fs).
 *
 * Lets tests run the browser code path (fileSystemService + fsAdapter +
 * shared/gitOps.js) against a real directory and real git, the way Chrome's
 * showDirectoryPicker() handle would. Implements the subset the app uses.
 */
import fs from 'node:fs';
import path from 'node:path';

const notFound = (p: string) => new DOMException(`${p} not found`, 'NotFoundError');
const typeMismatch = (p: string) =>
  new DOMException(`${p} has the wrong kind`, 'TypeMismatchError');

class NodeFile {
  private readonly filePath: string;
  constructor(filePath: string) {
    this.filePath = filePath;
  }
  get name() {
    return path.basename(this.filePath);
  }
  get size() {
    return fs.statSync(this.filePath).size;
  }
  get lastModified() {
    return fs.statSync(this.filePath).mtimeMs;
  }
  async text() {
    return fs.readFileSync(this.filePath, 'utf8');
  }
  async arrayBuffer() {
    const buf = fs.readFileSync(this.filePath);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
}

class NodeWritable {
  private chunks: Buffer[] = [];
  private readonly filePath: string;
  constructor(filePath: string) {
    this.filePath = filePath;
  }
  async write(data: string | ArrayBuffer | ArrayBufferView | Blob) {
    if (typeof data === 'string') this.chunks.push(Buffer.from(data, 'utf8'));
    else if (data instanceof ArrayBuffer) this.chunks.push(Buffer.from(data));
    else if (ArrayBuffer.isView(data))
      this.chunks.push(Buffer.from(data.buffer, data.byteOffset, data.byteLength));
    else this.chunks.push(Buffer.from(await (data as Blob).text(), 'utf8'));
  }
  async close() {
    fs.writeFileSync(this.filePath, Buffer.concat(this.chunks));
  }
}

class NodeFileHandle {
  readonly kind = 'file';
  private readonly filePath: string;
  constructor(filePath: string) {
    this.filePath = filePath;
  }
  get name() {
    return path.basename(this.filePath);
  }
  async getFile() {
    if (!fs.existsSync(this.filePath)) throw notFound(this.filePath);
    return new NodeFile(this.filePath);
  }
  async createWritable() {
    return new NodeWritable(this.filePath);
  }
}

export class NodeDirectoryHandle {
  readonly kind = 'directory';
  private readonly dirPath: string;
  constructor(dirPath: string) {
    this.dirPath = dirPath;
  }
  get name() {
    return path.basename(this.dirPath);
  }
  async getDirectoryHandle(name: string, options?: { create?: boolean }) {
    const p = path.join(this.dirPath, name);
    if (fs.existsSync(p)) {
      if (!fs.statSync(p).isDirectory()) throw typeMismatch(p);
    } else if (options?.create) {
      fs.mkdirSync(p);
    } else {
      throw notFound(p);
    }
    return new NodeDirectoryHandle(p);
  }
  async getFileHandle(name: string, options?: { create?: boolean }) {
    const p = path.join(this.dirPath, name);
    if (fs.existsSync(p)) {
      if (!fs.statSync(p).isFile()) throw typeMismatch(p);
    } else if (options?.create) {
      fs.writeFileSync(p, '');
    } else {
      throw notFound(p);
    }
    return new NodeFileHandle(p);
  }
  async removeEntry(name: string, options?: { recursive?: boolean }) {
    const p = path.join(this.dirPath, name);
    if (!fs.existsSync(p)) throw notFound(p);
    fs.rmSync(p, { recursive: !!options?.recursive });
  }
  async *entries(): AsyncGenerator<[string, NodeDirectoryHandle | NodeFileHandle]> {
    for (const name of fs.readdirSync(this.dirPath)) {
      const p = path.join(this.dirPath, name);
      yield [
        name,
        fs.statSync(p).isDirectory() ? new NodeDirectoryHandle(p) : new NodeFileHandle(p),
      ];
    }
  }
  async *values() {
    for await (const [, handle] of this.entries()) yield handle;
  }
  async *keys() {
    for await (const [name] of this.entries()) yield name;
  }
  async queryPermission() {
    return 'granted';
  }
  async requestPermission() {
    return 'granted';
  }
}
