/**
 * Real Git Service - Uses isomorphic-git with File System Access API
 * 
 * This service wraps isomorphic-git to work with the real filesystem
 * via the File System Access API adapter.
 */

import git from 'isomorphic-git';
import { fileSystemService } from './fileSystemService';
import type { Requirement, UseCase, TestCase, Information } from '../types';
import {
    requirementToMarkdown,
    markdownToRequirement,
    useCaseToMarkdown,
    markdownToUseCase,
    testCaseToMarkdown,
    markdownToTestCase,
    informationToMarkdown,
    markdownToInformation
} from '../utils/markdownUtils';

export interface CommitInfo {
    hash: string;
    message: string;
    author: string;
    timestamp: number;
}

export interface FileStatus {
    path: string;
    status: string;
}

/**
 * File System Access API adapter for isomorphic-git
 * Adapts the File System Access API to the fs interface expected by isomorphic-git
 */
class FSAdapter {
    private rootHandle: FileSystemDirectoryHandle | null = null;

    setRoot(handle: FileSystemDirectoryHandle) {
        this.rootHandle = handle;
    }

    private async getHandle(path: string): Promise<FileSystemDirectoryHandle | FileSystemFileHandle | null> {
        if (!this.rootHandle) return null;

        const parts = path.split('/').filter(p => p && p !== '.');
        let current: FileSystemDirectoryHandle = this.rootHandle;

        for (let i = 0; i < parts.length - 1; i++) {
            try {
                current = await current.getDirectoryHandle(parts[i]);
            } catch {
                return null;
            }
        }

        const lastName = parts[parts.length - 1];
        if (!lastName) return current;

        try {
            return await current.getFileHandle(lastName);
        } catch {
            try {
                return await current.getDirectoryHandle(lastName);
            } catch {
                return null;
            }
        }
    }

    // isomorphic-git fs interface
    promises = {
        readFile: async (path: string, options?: { encoding?: string }): Promise<Uint8Array | string> => {
            const content = await fileSystemService.readFile(path.replace(/^\//, ''));
            if (content === null) {
                throw new Error(`ENOENT: no such file or directory, open '${path}'`);
            }
            if (options?.encoding === 'utf8') {
                return content;
            }
            return new TextEncoder().encode(content);
        },

        writeFile: async (path: string, data: string | Uint8Array): Promise<void> => {
            const content = typeof data === 'string' ? data : new TextDecoder().decode(data);
            await fileSystemService.writeFile(path.replace(/^\//, ''), content);
        },

        unlink: async (path: string): Promise<void> => {
            await fileSystemService.deleteFile(path.replace(/^\//, ''));
        },

        readdir: async (path: string): Promise<string[]> => {
            return await fileSystemService.listFiles(path.replace(/^\//, ''));
        },

        mkdir: async (path: string): Promise<void> => {
            await fileSystemService.getOrCreateDirectory(path.replace(/^\//, ''));
        },

        rmdir: async (_path: string): Promise<void> => {
            // Not implemented - isomorphic-git rarely needs this
        },

        stat: async (path: string): Promise<{ type: string; mode: number; size: number; ino: number; mtimeMs: number; ctimeMs: number }> => {
            const handle = await this.getHandle(path.replace(/^\//, ''));
            if (!handle) {
                throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
            }

            const isDirectory = handle.kind === 'directory';
            let size = 0;

            if (!isDirectory) {
                const file = await (handle as FileSystemFileHandle).getFile();
                size = file.size;
            }

            return {
                type: isDirectory ? 'dir' : 'file',
                mode: isDirectory ? 0o40755 : 0o100644,
                size,
                ino: 0,
                mtimeMs: Date.now(),
                ctimeMs: Date.now()
            };
        },

        lstat: async (path: string) => {
            return this.promises.stat(path);
        },

        readlink: async (_path: string): Promise<string> => {
            throw new Error('Symlinks not supported');
        },

        symlink: async (_target: string, _path: string): Promise<void> => {
            throw new Error('Symlinks not supported');
        },

        chmod: async (_path: string, _mode: number): Promise<void> => {
            // No-op - permissions not supported
        }
    };
}

const fsAdapter = new FSAdapter();

class RealGitService {
    private initialized = false;
    private rootDir = '/';

    /**
     * Initialize git with the selected directory
     */
    async init(directoryHandle: FileSystemDirectoryHandle): Promise<boolean> {
        fsAdapter.setRoot(directoryHandle);

        // Check if .git exists
        const hasGit = await fileSystemService.checkGitExists();

        if (!hasGit) {
            // Ask user if they want to initialize git
            const shouldInit = confirm(
                'This directory is not a git repository.\n\n' +
                'Would you like to initialize it as a git repository?\n\n' +
                'This is required for version tracking.'
            );

            if (!shouldInit) {
                return false;
            }

            // Initialize git repository
            await git.init({
                fs: fsAdapter,
                dir: this.rootDir,
                defaultBranch: 'main'
            });

            // Create initial commit
            await fileSystemService.writeFile('README.md',
                '# Requirements Management\n\nThis repository contains requirements, use cases, test cases, and information managed by ReqTrace.\n'
            );

            await git.add({
                fs: fsAdapter,
                dir: this.rootDir,
                filepath: 'README.md'
            });

            await git.commit({
                fs: fsAdapter,
                dir: this.rootDir,
                message: 'Initial commit',
                author: {
                    name: 'ReqTrace User',
                    email: 'user@reqtrace.local'
                }
            });
        }

        this.initialized = true;
        return true;
    }

    /**
     * Save an artifact to disk (no commit)
     */
    async saveArtifact(
        type: 'requirements' | 'usecases' | 'testcases' | 'information',
        id: string,
        artifact: Requirement | UseCase | TestCase | Information
    ): Promise<void> {
        if (!this.initialized) {
            throw new Error('Git service not initialized');
        }

        // Convert artifact to markdown
        let markdown: string;
        switch (type) {
            case 'requirements':
                markdown = requirementToMarkdown(artifact as Requirement);
                break;
            case 'usecases':
                markdown = useCaseToMarkdown(artifact as UseCase);
                break;
            case 'testcases':
                markdown = testCaseToMarkdown(artifact as TestCase);
                break;
            case 'information':
                markdown = informationToMarkdown(artifact as Information);
                break;
        }

        const filePath = `${type}/${id}.md`;

        // Write file only - no git operations yet
        await fileSystemService.writeFile(filePath, markdown);
    }

    /**
     * Delete an artifact from disk (no commit)
     */
    async deleteArtifact(
        type: 'requirements' | 'usecases' | 'testcases' | 'information',
        id: string
    ): Promise<void> {
        if (!this.initialized) {
            throw new Error('Git service not initialized');
        }

        const filePath = `${type}/${id}.md`;

        try {
            // Delete the file only
            await fileSystemService.deleteFile(filePath);
        } catch (error) {
            console.error('Failed to delete artifact:', error);
        }
    }

    /**
     * Get git status
     */
    async getStatus(): Promise<FileStatus[]> {
        if (!this.initialized) return [];

        try {
            const status = await git.statusMatrix({
                fs: fsAdapter,
                dir: this.rootDir,
            });

            return status.map(([filepath, head, workdir, stage]) => {
                let statusStr = 'unchanged';
                if (head === 1 && workdir === 2 && stage === 2) statusStr = 'modified';
                if (head === 0 && workdir === 2 && stage === 0) statusStr = 'new'; // Untracked
                if (head === 0 && workdir === 2 && stage === 2) statusStr = 'added'; // Staged new
                if (head === 1 && workdir === 0) statusStr = 'deleted';

                return {
                    path: filepath,
                    status: statusStr
                };
            }).filter(f => f.status !== 'unchanged');
        } catch (error) {
            console.error('Failed to get status:', error);
            return [];
        }
    }

    /**
     * Commit a single file (Atomic Commit)
     */
    async commitFile(filepath: string, message: string): Promise<void> {
        if (!this.initialized) {
            throw new Error('Git service not initialized');
        }

        // Check if file exists (for add/modify) or not (for delete)
        const fileExists = await fileSystemService.readFile(filepath) !== null;

        if (fileExists) {
            await git.add({
                fs: fsAdapter,
                dir: this.rootDir,
                filepath
            });
        } else {
            await git.remove({
                fs: fsAdapter,
                dir: this.rootDir,
                filepath
            });
        }

        await git.commit({
            fs: fsAdapter,
            dir: this.rootDir,
            message,
            author: {
                name: 'ReqTrace User',
                email: 'user@reqtrace.local'
            }
        });
    }

    /**
     * Load all artifacts from disk
     */
    async loadAllArtifacts(): Promise<{
        requirements: Requirement[];
        useCases: UseCase[];
        testCases: TestCase[];
        information: Information[];
    }> {
        const requirements: Requirement[] = [];
        const useCases: UseCase[] = [];
        const testCases: TestCase[] = [];
        const information: Information[] = [];

        // Load requirements
        const reqFiles = await fileSystemService.listFiles('requirements');
        for (const file of reqFiles) {
            if (file.endsWith('.md')) {
                const content = await fileSystemService.readFile(`requirements/${file}`);
                if (content) {
                    const req = markdownToRequirement(content);
                    if (req) requirements.push(req);
                }
            }
        }

        // Load use cases
        const ucFiles = await fileSystemService.listFiles('usecases');
        for (const file of ucFiles) {
            if (file.endsWith('.md')) {
                const content = await fileSystemService.readFile(`usecases/${file}`);
                if (content) {
                    const uc = markdownToUseCase(content);
                    if (uc) useCases.push(uc);
                }
            }
        }

        // Load test cases
        const tcFiles = await fileSystemService.listFiles('testcases');
        for (const file of tcFiles) {
            if (file.endsWith('.md')) {
                const content = await fileSystemService.readFile(`testcases/${file}`);
                if (content) {
                    const tc = markdownToTestCase(content);
                    if (tc) testCases.push(tc);
                }
            }
        }

        // Load information
        const infoFiles = await fileSystemService.listFiles('information');
        for (const file of infoFiles) {
            if (file.endsWith('.md')) {
                const content = await fileSystemService.readFile(`information/${file}`);
                if (content) {
                    const info = markdownToInformation(content);
                    if (info) information.push(info);
                }
            }
        }

        return { requirements, useCases, testCases, information };
    }

    /**
     * Get git log for a specific file or all files
     */
    async getHistory(filepath?: string): Promise<CommitInfo[]> {
        if (!this.initialized) {
            return [];
        }

        try {
            const commits = await git.log({
                fs: fsAdapter,
                dir: this.rootDir,
                depth: 100,
                filepath
            });

            return commits.map(commit => ({
                hash: commit.oid,
                message: commit.commit.message,
                author: commit.commit.author.name,
                timestamp: commit.commit.author.timestamp * 1000
            }));
        } catch (error) {
            console.error('Failed to get git history:', error);
            return [];
        }
    }

    /**
     * Create a git tag (baseline)
     */
    /**
     * Create a git tag (baseline)
     */
    async createTag(tagName: string, message: string): Promise<void> {
        if (!this.initialized) {
            throw new Error('Git service not initialized');
        }

        await git.annotatedTag({
            fs: fsAdapter,
            dir: this.rootDir,
            ref: tagName,
            message: message,
            tagger: {
                name: 'ReqTrace User',
                email: 'user@reqtrace.local'
            }
        });
    }

    /**
     * List all tags
     */
    async listTags(): Promise<string[]> {
        if (!this.initialized) {
            return [];
        }

        try {
            return await git.listTags({
                fs: fsAdapter,
                dir: this.rootDir
            });
        } catch {
            return [];
        }
    }

    /**
     * Get all tags with their details (for baselines)
     */
    async getTagsWithDetails(): Promise<Array<{ name: string; message: string; timestamp: number; commit: string }>> {
        if (!this.initialized) return [];

        try {
            const tagNames = await this.listTags();
            const tags = [];

            for (const name of tagNames) {
                try {
                    // Try to resolve as annotated tag first
                    const oid = await git.resolveRef({ fs: fsAdapter, dir: this.rootDir, ref: name });
                    const read = await git.readTag({ fs: fsAdapter, dir: this.rootDir, oid });

                    tags.push({
                        name,
                        message: read.tag.message,
                        timestamp: read.tag.tagger.timestamp * 1000,
                        commit: read.tag.object
                    });
                } catch (e) {
                    // Fallback for lightweight tags or if readTag fails
                    // For lightweight tags, we'd need to read the commit it points to
                    try {
                        const oid = await git.resolveRef({ fs: fsAdapter, dir: this.rootDir, ref: name });
                        const commit = await git.readCommit({ fs: fsAdapter, dir: this.rootDir, oid });
                        tags.push({
                            name,
                            message: commit.commit.message, // Use commit message as fallback
                            timestamp: commit.commit.author.timestamp * 1000,
                            commit: oid
                        });
                    } catch (e2) {
                        console.warn(`Failed to read tag ${name}:`, e2);
                    }
                }
            }

            return tags.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Failed to get tags with details:', error);
            return [];
        }
    }

    /**
     * Check if initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

export const realGitService = new RealGitService();
