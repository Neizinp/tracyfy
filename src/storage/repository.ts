/**
 * The project repository: everything the app reads from and writes to the
 * project folder and its git history, behind one small, kind-agnostic API
 * (docs/DESIGN.md §5). Callers never pick a file service, a folder or a git
 * module themselves.
 *
 * FsGitRepository is the only implementation: files through fileSystemService
 * (Electron or the browser's File System Access API) and git through
 * shared/gitOps.js.
 */
import type {
  BaseArtifact,
  CommitInfo,
  Link,
  Person,
  Project,
  ProjectBaseline,
  SyncStatus,
} from '../types';
import type { LinkType } from '../domain/linkTypes';
import type { CustomAttributeDefinition } from '../types/customAttributes';
import { ARTIFACT_KINDS, kind, type ArtifactKindId } from '../domain/artifactKinds';
import { projectOf, settingsOf, type ProjectSettings } from '../domain/projectConfig';
import { artifactService } from '../services/artifactServices';
import type { FileProblem } from '../services/baseArtifactService';
import { diskLinkService } from '../services/diskLinkService';
import { STORED_TYPES, type StoredType } from '../services/storedTypes';
import { realGitService, type FileStatus, type PullResult } from '../services/realGitService';
import type { ProjectSnapshot } from '../services/git/gitHistoryService';
import { fileSystemService } from '../services/fileSystemService';
import { idAllocator } from './idAllocator';
import { projectConfigStore } from './projectConfigStore';

export interface LoadedProject {
  project: Project;
  artifacts: Record<ArtifactKindId, BaseArtifact[]>;
  links: Link[];
  /** Custom attribute definitions (from tracyfy.yaml) */
  customAttributes: CustomAttributeDefinition[];
  /** Lifecycle and traceability rules (from tracyfy.yaml, with defaults) */
  settings: ProjectSettings;
  /** Files that could not be read; they are not in `artifacts` / `links` */
  problems: FileProblem[];
}

export interface ProjectRepository {
  /** Open the git repository of the selected folder (creating it if needed) */
  open(directoryHandle?: FileSystemDirectoryHandle): Promise<boolean>;
  load(): Promise<LoadedProject>;
  save(kindId: ArtifactKindId, artifact: BaseArtifact): Promise<void>;
  saveProject(project: Project): Promise<void>;
  /** `reviewed`: the target's fingerprint, so the new link is not suspect */
  createLink(
    sourceId: string,
    targetId: string,
    type: LinkType,
    reviewed: string | undefined
  ): Promise<Link>;
  saveLink(link: Link): Promise<void>;
  updateLink(id: string, updates: Partial<Link>): Promise<Link | null>;
  /** A committed link stays as a file marked deleted, so its ID is not reused */
  deleteLink(id: string): Promise<void>;
  /** The next free ID: one more than the highest file of that type */
  nextId(type: StoredType): Promise<string>;
  nextIds(type: StoredType, count: number): Promise<string[]>;

  status(): Promise<FileStatus[]>;
  commit(path: string, message: string): Promise<void>;
  revert(path: string): Promise<void>;
  /** Commits that changed one artifact, newest first */
  history(kindId: ArtifactKindId, id: string): Promise<CommitInfo[]>;
  /** The project's commits, newest first */
  commits(depth?: number): Promise<CommitInfo[]>;
  readAt(path: string, commit: string): Promise<string | null>;
  snapshot(commit: string): Promise<ProjectSnapshot>;
  /** A file in the project folder as bytes (an image in assets/), or null; at `commit` when given */
  readAsset(path: string, commit?: string): Promise<Uint8Array | null>;
  baselines(): Promise<ProjectBaseline[]>;
  createBaseline(name: string, description: string): Promise<void>;
  author(): Promise<Person | null>;
  setAuthor(person: Person): Promise<void>;
  pull(): Promise<PullResult>;
  push(): Promise<void>;
  hasRemote(): Promise<boolean>;
  /** How the branch stands against the remote's */
  syncStatus(): Promise<SyncStatus>;
}

class FsGitRepository implements ProjectRepository {
  async open(directoryHandle?: FileSystemDirectoryHandle): Promise<boolean> {
    idAllocator.reset();
    const opened = await realGitService.init(directoryHandle);
    if (!opened) return false;
    for (const { folder } of Object.values(STORED_TYPES)) {
      await fileSystemService.getOrCreateDirectory(folder);
    }
    return true;
  }

  async load(): Promise<LoadedProject> {
    const [config, kinds, links] = await Promise.all([
      projectConfigStore.load(),
      Promise.all(ARTIFACT_KINDS.map((k) => artifactService(k.id).loadAllWithProblems())),
      diskLinkService.loadAllWithProblems(),
    ]);
    return {
      project: projectOf(config),
      artifacts: Object.fromEntries(
        ARTIFACT_KINDS.map((k, i) => [k.id, kinds[i].items])
      ) as LoadedProject['artifacts'],
      links: links.items,
      customAttributes: config.customAttributes,
      settings: settingsOf(config),
      problems: [...kinds.flatMap((k) => k.problems), ...links.problems],
    };
  }

  async save(kindId: ArtifactKindId, artifact: BaseArtifact): Promise<void> {
    await artifactService(kindId).save(artifact);
  }

  async saveProject(project: Project): Promise<void> {
    await projectConfigStore.update((config) => ({
      ...config,
      name: project.name,
      description: project.description,
    }));
  }

  createLink(
    sourceId: string,
    targetId: string,
    type: LinkType,
    reviewed: string | undefined
  ): Promise<Link> {
    return diskLinkService.createLink(sourceId, targetId, type, reviewed);
  }

  async saveLink(link: Link): Promise<void> {
    await diskLinkService.save(link);
  }

  updateLink(id: string, updates: Partial<Link>): Promise<Link | null> {
    return diskLinkService.updateLink(id, updates);
  }

  async deleteLink(id: string): Promise<void> {
    const path = `${STORED_TYPES.link.folder}/${id}.md`;
    const isNew = (await this.status()).some((f) => f.path === path && f.status === 'new');
    await diskLinkService.deleteLink(id, !isNew);
  }

  nextId(type: StoredType): Promise<string> {
    const { folder, idPrefix } = STORED_TYPES[type];
    return idAllocator.next(folder, idPrefix);
  }

  nextIds(type: StoredType, count: number): Promise<string[]> {
    const { folder, idPrefix } = STORED_TYPES[type];
    return idAllocator.nextMany(folder, idPrefix, count);
  }

  status(): Promise<FileStatus[]> {
    return realGitService.getStatus();
  }

  commit(path: string, message: string): Promise<void> {
    return realGitService.commitFile(path, message);
  }

  revert(path: string): Promise<void> {
    return realGitService.revertFile(path);
  }

  history(kindId: ArtifactKindId, id: string): Promise<CommitInfo[]> {
    return realGitService.getHistory(`${kind(kindId).folder}/${id}.md`);
  }

  commits(depth?: number): Promise<CommitInfo[]> {
    return realGitService.getHistory(undefined, depth);
  }

  readAt(path: string, commit: string): Promise<string | null> {
    return realGitService.readFileAtCommit(path, commit);
  }

  snapshot(commit: string): Promise<ProjectSnapshot> {
    return realGitService.loadProjectSnapshot(commit);
  }

  async readAsset(path: string, commit?: string): Promise<Uint8Array | null> {
    if (commit) return realGitService.readBytesAtCommit(path, commit);
    return (await fileSystemService.readFileBinary(path)) ?? null;
  }

  async baselines(): Promise<ProjectBaseline[]> {
    const tags = await realGitService.getTagsWithDetails();
    return tags.map((t) => ({
      name: t.name,
      description: t.message.trim(),
      timestamp: t.timestamp,
      commit: t.commit,
    }));
  }

  createBaseline(name: string, description: string): Promise<void> {
    return realGitService.createTag(name, description);
  }

  author(): Promise<Person | null> {
    return realGitService.getAuthor();
  }

  setAuthor(person: Person): Promise<void> {
    return realGitService.setAuthor(person);
  }

  pull(): Promise<PullResult> {
    return realGitService.pull();
  }

  push(): Promise<void> {
    return realGitService.push();
  }

  hasRemote(): Promise<boolean> {
    return realGitService.hasRemote();
  }

  syncStatus(): Promise<SyncStatus> {
    return realGitService.getSyncStatus();
  }
}

export const repository: ProjectRepository = new FsGitRepository();
