import git from 'isomorphic-git';
import FS from '@isomorphic-git/lightning-fs';
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
    status: string; // 'new', 'modified', 'unchanged', 'deleted'
}

// Initialize Lightning FS for browser
const fs = new FS('reqtrace-fs');
const pfs = fs.promises;

class BrowserGitService {
    private repoDir = '/reqtrace-repo';
    private initialized = false;

    // Initialize the central git repository (call once on app startup)
    async init(): Promise<void> {
        if (this.initialized) return;

        try {
            // Create base directory
            await pfs.mkdir(this.repoDir).catch(() => { });

            // Check if git repo already exists
            try {
                await git.resolveRef({ fs, dir: this.repoDir, ref: 'HEAD' });
                console.log('Git repository already exists');
                this.initialized = true;
                return;
            } catch {
                // Repo doesn't exist, create it
            }

            // Initialize Git repository
            await git.init({
                fs,
                dir: this.repoDir,
                defaultBranch: 'main'
            });

            // Create initial empty commit
            await pfs.writeFile(`${this.repoDir}/README.md`, '# Requirements Management Tool\n\nThis is the central repository for all requirements, use cases, test cases, and information.');

            await git.add({
                fs,
                dir: this.repoDir,
                filepath: 'README.md'
            });

            await git.commit({
                fs,
                dir: this.repoDir,
                message: 'Initial commit',
                author: {
                    name: 'User',
                    email: 'user@reqtrace.local'
                }
            });

            this.initialized = true;
            console.log('Git repository initialized successfully at:', this.repoDir);
        } catch (error) {
            console.error('Failed to initialize git repository:', error);
            throw error;
        }
    }

    async getProjectPath(projectName: string): Promise<string> {
        // Sanitize project name for folder usage
        const safeName = projectName.replace(/[^a-z0-9-_]/gi, '_');
        return `projects/${safeName}`;
    }

    // Initialize a new project (creates folders only, repo exists)
    async initProject(projectName: string): Promise<string> {
        await this.init(); // Ensure repo is initialized

        const projectPath = await this.getProjectPath(projectName);
        const fullPath = `${this.repoDir}/${projectPath}`;

        try {
            // Create 'projects' directory if it doesn't exist
            await pfs.mkdir(`${this.repoDir}/projects`).catch(() => { });

            // Create project directory structure
            await pfs.mkdir(fullPath).catch(() => { });
            await pfs.mkdir(`${fullPath}/requirements`).catch(() => { });
            await pfs.mkdir(`${fullPath}/usecases`).catch(() => { });
            await pfs.mkdir(`${fullPath}/testcases`).catch(() => { });
            await pfs.mkdir(`${fullPath}/information`).catch(() => { });

            console.log(`Initialized project folders at: ${projectPath}`);
            return projectPath;
        } catch (error) {
            console.error('Failed to initialize project:', error);
            throw error;
        }
    }

    // Write artifact to file as Markdown (No Commit) - Global Storage
    async saveArtifact(
        type: 'requirements' | 'usecases' | 'testcases' | 'information',
        artifact: Requirement | UseCase | TestCase | Information
    ): Promise<void> {
        await this.init(); // Ensure repo is initialized

        // Convert to Markdown based on type
        let markdown: string;
        let filename: string;

        switch (type) {
            case 'requirements':
                markdown = requirementToMarkdown(artifact as Requirement);
                filename = `${artifact.id}.md`;
                break;
            case 'usecases':
                markdown = useCaseToMarkdown(artifact as UseCase);
                filename = `${artifact.id}.md`;
                break;
            case 'testcases':
                markdown = testCaseToMarkdown(artifact as TestCase);
                filename = `${artifact.id}.md`;
                break;
            case 'information':
                markdown = informationToMarkdown(artifact as Information);
                filename = `${artifact.id}.md`;
                break;
        }

        // Use global artifacts directory
        const relativePath = `artifacts/${type}/${filename}`;
        const filePath = `${this.repoDir}/${relativePath}`;
        const dirPath = `${this.repoDir}/artifacts/${type}`;

        try {
            // Ensure directory exists
            await pfs.mkdir(`${this.repoDir}/artifacts`).catch(() => { });
            await pfs.mkdir(dirPath).catch(() => { });

            await pfs.writeFile(filePath, markdown, 'utf8');
            console.log(`✅ Saved artifact to: ${relativePath}`);
        } catch (error) {
            console.error(`❌ Failed to save artifact ${filename}:`, error);
            throw error;
        }
    }

    // Save project manifest (tracks which artifacts belong to a project)
    async saveProjectManifest(
        projectName: string,
        manifest: {
            requirementIds: string[];
            useCaseIds: string[];
            testCaseIds: string[];
            informationIds: string[];
        }
    ): Promise<void> {
        await this.init();
        const projectPath = await this.getProjectPath(projectName);
        const manifestPath = `${projectPath}/_manifest.json`;
        const filePath = `${this.repoDir}/${manifestPath}`;

        try {
            await pfs.mkdir(`${this.repoDir}/projects`).catch(() => { });
            await pfs.mkdir(`${this.repoDir}/${projectPath}`).catch(() => { });

            await pfs.writeFile(filePath, JSON.stringify(manifest, null, 2), 'utf8');
            console.log(`✅ Saved project manifest: ${manifestPath}`);
        } catch (error) {
            console.error(`❌ Failed to save project manifest:`, error);
            throw error;
        }
    }

    // Save arbitrary file to project (e.g. _links.json)
    async saveFile(projectName: string, subDir: string, filename: string, content: string): Promise<void> {
        await this.init();
        const projectPath = await this.getProjectPath(projectName);
        const dirPath = `${this.repoDir}/${projectPath}/${subDir}`;
        const filePath = `${dirPath}/${filename}`;

        try {
            // Ensure directory exists
            await pfs.mkdir(`${this.repoDir}/projects`).catch(() => { });
            await pfs.mkdir(`${this.repoDir}/${projectPath}`).catch(() => { });
            await pfs.mkdir(dirPath).catch(() => { });

            await pfs.writeFile(filePath, content, 'utf8');
            console.log(`✅ Saved file to: ${projectPath}/${subDir}/${filename}`);
        } catch (error) {
            console.error(`❌ Failed to save file ${filename}:`, error);
            throw error;
        }
    }

    // Commit changes (Baseline)
    async commit(projectName: string, message: string): Promise<string> {
        await this.init();

        try {
            // Add all changes
            await git.add({
                fs,
                dir: this.repoDir,
                filepath: '.'
            });

            await git.commit({
                fs,
                dir: this.repoDir,
                message: `[${projectName}] ${message}`,
                author: {
                    name: 'User',
                    email: 'user@reqtrace.local'
                }
            });

            const commits = await git.log({ fs, dir: this.repoDir, depth: 1 });
            return commits[0].oid;
        } catch (error) {
            console.error('Failed to commit:', error);
            throw error;
        }
    }

    // Commit a single artifact file with its own message - Global Storage
    async commitArtifact(
        type: 'requirements' | 'usecases' | 'testcases' | 'information',
        artifactId: string,
        commitMessage: string
    ): Promise<string> {
        await this.init();

        // Use global artifacts path - type is already plural
        const relativeFilePath = `artifacts/${type}/${artifactId}.md`;

        try {
            // Add the file
            await git.add({
                fs,
                dir: this.repoDir,
                filepath: relativeFilePath
            });

            // Commit it
            await git.commit({
                fs,
                dir: this.repoDir,
                message: commitMessage,  // No project prefix needed - artifacts are global
                author: {
                    name: 'User',
                    email: 'user@reqtrace.local'
                }
            });

            const commits = await git.log({ fs, dir: this.repoDir, depth: 1 });
            console.log(`✅ Committed ${artifactId}: ${commitMessage}`);
            return commits[0].oid;
        } catch (error) {
            console.error('Failed to commit artifact:', error);
            throw error;
        }
    }

    // Get list of uncommitted changes (global artifacts only)
    async getPendingChanges(): Promise<FileStatus[]> {
        await this.init();

        try {
            const status = await git.statusMatrix({
                fs,
                dir: this.repoDir
            });

            const changes: FileStatus[] = [];

            for (const [filepath, headStatus, workdirStatus] of status) {
                // Skip .git directory, README, and project manifests
                if (filepath.startsWith('.git') || filepath === 'README.md' || filepath.includes('_manifest.json')) continue;

                // Only include artifacts directory
                if (!filepath.startsWith('artifacts/')) continue;

                let fileStatus: string;

                if (headStatus === 1 && workdirStatus === 2) {
                    // Modified
                    fileStatus = 'modified';
                } else if (headStatus === 0 && workdirStatus === 2) {
                    // New (untracked)
                    fileStatus = 'new';
                } else if (headStatus === 1 && workdirStatus === 0) {
                    // Deleted
                    fileStatus = 'deleted';
                } else {
                    // Unchanged or staged
                    continue;
                }

                changes.push({
                    path: filepath,
                    status: fileStatus
                });
            }

            console.log(`Found ${changes.length} pending changes in global artifacts`);
            return changes;
        } catch (error) {
            console.error('Failed to get pending changes:', error);
            return [];
        }
    }

    // Get revision history for a specific artifact - Global Storage
    async getArtifactHistory(
        type: 'requirements' | 'usecases' | 'testcases' | 'information',
        artifactId: string
    ): Promise<CommitInfo[]> {
        await this.init();

        // Use global artifacts path
        const relativeFilePath = `artifacts/${type}/${artifactId}.md`;

        try {
            const commits = await git.log({
                fs,
                dir: this.repoDir,
                filepath: relativeFilePath
            });

            return commits.map(commit => ({
                hash: commit.oid,
                message: commit.commit.message,
                author: commit.commit.author.name,
                timestamp: commit.commit.author.timestamp * 1000 // Convert to ms
            }));
        } catch (error) {
            console.error('Failed to get artifact history:', error);
            return [];
        }
    }

    // Load all artifacts for a project
    async loadProjectArtifacts(projectName: string): Promise<{
        requirements: Requirement[];
        useCases: UseCase[];
        testCases: TestCase[];
        information: Information[];
    }> {
        await this.init();
        const projectPath = await this.getProjectPath(projectName);

        const result = {
            requirements: [] as Requirement[],
            useCases: [] as UseCase[],
            testCases: [] as TestCase[],
            information: [] as Information[]
        };

        const types = ['requirements', 'usecases', 'testcases', 'information'] as const;

        for (const type of types) {
            const dirPath = `${this.repoDir}/${projectPath}/${type}`;
            try {
                const files = await pfs.readdir(dirPath);
                for (const file of files) {
                    if (!file.endsWith('.md')) continue;

                    const content = await pfs.readFile(`${dirPath}/${file}`, 'utf8');

                    if (type === 'requirements') {
                        result.requirements.push(markdownToRequirement(content));
                    } else if (type === 'usecases') {
                        result.useCases.push(markdownToUseCase(content));
                    } else if (type === 'testcases') {
                        result.testCases.push(markdownToTestCase(content));
                    } else if (type === 'information') {
                        result.information.push(markdownToInformation(content));
                    }
                }
            } catch (e) {
                // Directory might not exist, which is fine
            }
        }

        // Wait, I can't easily implement the parsing here without the utils.
        // And I don't want to break the build by importing things I don't have.
        // Let's look at the imports in browserGitService.ts again.

        return result;
    }

    // Migrate from old per-project storage to global artifacts storage
    async migrateToGlobalArtifacts(): Promise<void> {
        await this.init();

        const artifactsDir = `${this.repoDir}/artifacts`;

        try {
            // Check if already migrated
            await pfs.readdir(artifactsDir);
            console.log('✅ Already using global artifacts storage');
            return;
        } catch {
            console.log('🔄 Migrating to global artifacts storage...');
        }

        try {
            // Create artifacts directories
            await pfs.mkdir(artifactsDir).catch(() => { });
            await pfs.mkdir(`${artifactsDir}/requirements`).catch(() => { });
            await pfs.mkdir(`${artifactsDir}/usecases`).catch(() => { });
            await pfs.mkdir(`${artifactsDir}/testcases`).catch(() => { });
            await pfs.mkdir(`${artifactsDir}/information`).catch(() => { });

            // Scan projects directory
            const projectsDir = `${this.repoDir}/projects`;
            try {
                const projects = await pfs.readdir(projectsDir);

                for (const projectName of projects) {
                    const projectPath = `${projectsDir}/${projectName}`;
                    const types = ['requirements', 'usecases', 'testcases', 'information'];

                    for (const type of types) {
                        const typePath = `${projectPath}/${type}`;
                        try {
                            const files = await pfs.readdir(typePath);

                            for (const file of files) {
                                if (!file.endsWith('.md')) continue;

                                const sourcePath = `${typePath}/${file}`;
                                const destPath = `${artifactsDir}/${type}/${file}`;

                                // Check if file already exists in global location
                                try {
                                    await pfs.readFile(destPath, 'utf8');
                                    console.log(`  ⏭️  Skipping ${file} (already exists)`);
                                } catch {
                                    // File doesn't exist, move it
                                    const content = await pfs.readFile(sourcePath, 'utf8');
                                    await pfs.writeFile(destPath, content, 'utf8');
                                    console.log(`  ✅ Moved ${type}/${file}`);
                                }
                            }
                        } catch (e) {
                            // Directory might not exist, skip
                        }
                    }
                }
            } catch (e) {
                // Projects directory doesn't exist, nothing to migrate
                console.log('  No projects to migrate');
            }

            console.log('✅ Migration to global artifacts complete');
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }

    async getHistory(filePath?: string): Promise<CommitInfo[]> {
        await this.init();

        try {
            const commits = await git.log({
                fs,
                dir: this.repoDir,
                ...(filePath && { filepath: filePath })
            });

            return commits.map(commit => ({
                hash: commit.oid,
                message: commit.commit.message,
                author: commit.commit.author.name,
                timestamp: commit.commit.author.timestamp * 1000
            }));
        } catch (error) {
            console.error('Failed to get history:', error);
            return [];
        }
    }
}

export const gitService = new BrowserGitService();
