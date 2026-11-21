/**
 * The open project: its folder, everything loaded from it, and the actions
 * that write to it. The store follows the disk: state changes only after a
 * write succeeded, so the UI never shows data that is not on disk.
 */
import type { StateCreator } from 'zustand';
import type { AppState } from '../store';
import type { ArtifactByKind, ArtifactsByKind, Link, LinkType, Project } from '../../types';
import type { CustomAttributeDefinition } from '../../types/customAttributes';
import { KIND_IDS, type ArtifactKindId } from '../../domain/artifactKinds';
import { parseArtifact, serializeArtifact } from '../../domain/artifactFormat';
import {
  DEFAULT_SETTINGS,
  projectOf,
  settingsOf,
  withNewAttribute,
  type ProjectSettings,
} from '../../domain/projectConfig';
import type { LifecycleSettings } from '../../domain/lifecycle';
import { fingerprintsOf } from '../../domain/fingerprint';
import { repository } from '../../storage/repository';
import { projectConfigStore } from '../../storage/projectConfigStore';
import { fileSystemService } from '../../services/fileSystemService';
import type { FileProblem } from '../../services/baseArtifactService';
import { STORED_TYPES, type StoredType } from '../../services/storedTypes';
import { withTask } from './tasks';
import { isE2EMode } from '../e2e';

export interface ProjectSlice {
  /** A folder is open and loaded */
  isReady: boolean;
  /** Opening a folder (or restoring the last one) is in progress */
  isLoading: boolean;
  directoryName: string | null;
  /** Why the folder could not be opened; shown by the folder selector */
  folderError: string | null;

  /** The project in this folder (its name and description, from tracyfy.yaml) */
  project: Project;
  artifacts: ArtifactsByKind;
  links: Link[];
  /** Files that could not be read (shown to the user, never silently skipped) */
  fileProblems: FileProblem[];
  /** Custom attribute definitions from tracyfy.yaml */
  attributeDefinitions: CustomAttributeDefinition[];
  /** Lifecycle and traceability rules from tracyfy.yaml, with defaults filled in */
  settings: ProjectSettings;

  /**
   * Called when the app mounts: reopens the folder picked last time and
   * follows changes to tracyfy.yaml. Returns the cleanup for unmount.
   */
  start: () => () => void;
  /** Let the user pick a folder and open it */
  selectFolder: () => Promise<void>;
  /** Forget the folder and go back to the folder selector */
  closeFolder: () => Promise<void>;
  /** Read everything from disk again */
  reload: () => Promise<void>;
  /** Read tracyfy.yaml again (after something changed it) */
  reloadConfig: () => Promise<void>;
  /** Define a custom attribute (in tracyfy.yaml, a pending change); returns it with its ID */
  addAttributeDefinition: (
    def: Omit<CustomAttributeDefinition, 'id'>
  ) => Promise<CustomAttributeDefinition>;
  updateAttributeDefinition: (
    id: string,
    updates: Partial<Omit<CustomAttributeDefinition, 'id'>>
  ) => Promise<void>;

  /** Change lifecycle settings (in tracyfy.yaml, a pending change) */
  updateLifecycleSettings: (updates: Partial<LifecycleSettings>) => Promise<void>;

  /** Write an artifact's file; the store then holds it as the file reads back */
  saveArtifact: <K extends ArtifactKindId>(kind: K, artifact: ArtifactByKind[K]) => Promise<void>;
  /** Rename the project or change its description */
  updateProject: (project: Project) => Promise<void>;
  /**
   * Create a link (a pending change like any other file). It counts as
   * reviewed against the target as it is now.
   */
  createLink: (sourceId: string, targetId: string, type: LinkType) => Promise<Link>;
  /** The link's target was checked: it is no longer suspect (a pending change) */
  markLinkReviewed: (id: string) => Promise<void>;
  saveLink: (link: Link) => Promise<void>;
  updateLink: (id: string, updates: Partial<Link>) => Promise<Link | null>;
  deleteLink: (id: string) => Promise<void>;
  /** The next free ID of a type */
  nextId: (type: StoredType) => Promise<string>;
}

/** Before a folder is opened */
const NO_PROJECT: Project = { name: '', description: '' };

export const emptyArtifacts = (): ArtifactsByKind =>
  Object.fromEntries(KIND_IDS.map((k) => [k, []])) as unknown as ArtifactsByKind;

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx < 0) return [...items, item];
  const updated = [...items];
  updated[idx] = item;
  return updated;
}

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

export const createProjectSlice: StateCreator<AppState, [], [], ProjectSlice> = (set, get) => {
  const e2e = isE2EMode();
  // In E2E mode IDs come from a counter, since there is no folder to look at
  const e2eCounters: Partial<Record<StoredType, number>> = {};
  let restoreStarted = false;

  const requireReady = () => {
    if (!get().isReady) throw new Error('Filesystem not ready');
  };

  /** Reopen the folder picked last time, if there is one */
  const restoreFolder = async () => {
    if (!fileSystemService.isSupported()) {
      set({
        folderError: 'File System Access API is not supported. Please use Chrome, Edge, or Opera.',
        isLoading: false,
      });
      return;
    }
    try {
      const result = await fileSystemService.restoreDirectory();
      if (result && (result.handle || result.path)) {
        await withTask(get(), 'Loading project...', async () => {
          if (await repository.open(result.handle)) await loadOpenedFolder();
        });
      }
    } catch (err) {
      // Shown by the folder selector instead of silently asking to pick a folder again
      console.error('Failed to restore directory:', err);
      set({ folderError: `Could not open the project folder: ${errorText(err)}` });
    }
    set({ isLoading: false });
  };

  /** After the repository is open: load data, git status, user and baselines */
  const loadOpenedFolder = async () => {
    set({ directoryName: fileSystemService.getDirectoryName() });
    await Promise.all([get().reload(), get().loadStatus()]);
    set({ isReady: true });
    // Neither blocks the app from showing
    void get().loadUser();
    void get().refreshBaselines();
    void get().checkSync();
  };

  return {
    isReady: e2e,
    isLoading: !e2e,
    directoryName: e2e ? 'E2E Test Directory' : null,
    folderError: null,
    project: e2e ? { name: 'E2E Test Directory', description: '' } : NO_PROJECT,
    artifacts: emptyArtifacts(),
    links: [],
    fileProblems: [],
    attributeDefinitions: [],
    settings: DEFAULT_SETTINGS,

    start: () => {
      const unsubscribe = projectConfigStore.subscribe(() => void get().reloadConfig());
      // React StrictMode runs effects twice; opening must happen once
      if (!restoreStarted && !e2e) {
        restoreStarted = true;
        void restoreFolder();
      }
      return unsubscribe;
    },

    selectFolder: async () => {
      set({ isLoading: true, folderError: null });
      const taskId = get().startTask('Loading project...');
      try {
        const result = await fileSystemService.selectDirectory();

        const { isEmpty, entryCount } = await fileSystemService.checkDirectoryEmpty();
        if (!isEmpty) {
          const confirmed = window.confirm(
            `This folder contains ${entryCount} ${entryCount === 1 ? 'item' : 'items'}.\n\n` +
              `Tracyfy will create project files in this folder. Are you sure you want to use this folder?`
          );
          if (!confirmed) {
            await fileSystemService.clearDirectory();
            set({ folderError: 'Directory selection was cancelled.' });
            return;
          }
        }

        if (!(await repository.open(result.handle))) {
          set({ folderError: 'Git initialization was cancelled. A git repository is required.' });
          return;
        }
        await loadOpenedFolder();
      } catch (err) {
        set({ folderError: errorText(err) });
      } finally {
        get().endTask(taskId);
        set({ isLoading: false });
      }
    },

    closeFolder: async () => {
      await fileSystemService.clearDirectory();
      set({
        isReady: false,
        // false, so the folder selector shows its choices instead of a spinner
        isLoading: false,
        directoryName: null,
        folderError: null,
        project: NO_PROJECT,
        artifacts: emptyArtifacts(),
        links: [],
        fileProblems: [],
        attributeDefinitions: [],
        settings: DEFAULT_SETTINGS,
        pendingChanges: [],
        statusError: null,
        currentUser: null,
        isUserLoading: true,
        baselines: [],
      });
    },

    reload: () =>
      withTask(get(), 'Loading data...', async () => {
        const data = await repository.load();
        set({
          project: data.project,
          artifacts: data.artifacts as unknown as ArtifactsByKind,
          links: data.links,
          fileProblems: data.problems,
          attributeDefinitions: data.customAttributes,
          settings: data.settings,
        });
      }),

    reloadConfig: async () => {
      if (e2e || !get().isReady) return;
      const config = await projectConfigStore.load();
      set({
        project: projectOf(config),
        attributeDefinitions: config.customAttributes,
        settings: settingsOf(config),
      });
    },

    addAttributeDefinition: async (def) => {
      requireReady();
      let created: CustomAttributeDefinition | undefined;
      await projectConfigStore.update((config) => {
        const next = withNewAttribute(config, def);
        created = next.created;
        return next.config;
      });
      await get().reloadConfig();
      get().refreshStatus();
      return created!;
    },

    updateAttributeDefinition: async (id, updates) => {
      requireReady();
      await projectConfigStore.update((config) => ({
        ...config,
        customAttributes: config.customAttributes.map((d) =>
          d.id === id ? { ...d, ...updates, id } : d
        ),
      }));
      await get().reloadConfig();
      get().refreshStatus();
    },

    updateLifecycleSettings: async (updates) => {
      requireReady();
      if (e2e) {
        set((s) => ({
          settings: { ...s.settings, lifecycle: { ...s.settings.lifecycle, ...updates } },
        }));
        return;
      }
      await projectConfigStore.update((config) => ({
        ...config,
        lifecycle: { ...config.lifecycle, ...updates },
      }));
      await get().reloadConfig();
      get().refreshStatus();
    },

    saveArtifact: async (kindId, artifact) => {
      requireReady();
      // What a reload would show, so memory and disk never differ; an
      // artifact the file could not hold (a wrong status) is not written
      const saved = parseArtifact(
        kindId,
        artifact.id,
        serializeArtifact(kindId, artifact)
      ) as ArtifactByKind[typeof kindId];
      if (!e2e) await repository.save(kindId, artifact);
      set((s) => ({
        artifacts: { ...s.artifacts, [kindId]: upsert(s.artifacts[kindId], saved) },
      }));
      if (!e2e) get().refreshStatus(); // Fire-and-forget for a responsive UI
    },

    updateProject: async (updated) => {
      requireReady();
      const name = updated.name.trim();
      if (!name) throw new Error('The project needs a name');
      const project = { name, description: updated.description.trim() };
      if (!e2e) await repository.saveProject(project);
      set({ project });
      if (!e2e) get().refreshStatus();
    },

    createLink: async (sourceId, targetId, type) => {
      requireReady();
      const reviewed = fingerprintsOf(get().artifacts)(targetId);
      let link: Link;
      if (e2e) {
        const now = Date.now();
        link = {
          id: await get().nextId('link'),
          sourceId,
          targetId,
          type,
          reviewed,
          dateCreated: now,
          lastModified: now,
          revision: '01',
        };
      } else {
        link = await repository.createLink(sourceId, targetId, type, reviewed);
      }
      set((s) => ({ links: upsert(s.links, link) }));
      if (!e2e) get().refreshStatus();
      return link;
    },

    saveLink: async (link) => {
      requireReady();
      if (!e2e) await repository.saveLink(link);
      set((s) => ({ links: upsert(s.links, link) }));
      if (!e2e) get().refreshStatus();
    },

    updateLink: async (id, updates) => {
      requireReady();
      const updated = await repository.updateLink(id, updates);
      if (updated) set((s) => ({ links: upsert(s.links, updated) }));
      get().refreshStatus();
      return updated;
    },

    markLinkReviewed: async (id) => {
      const link = get().links.find((l) => l.id === id);
      if (!link) return;
      const reviewed = fingerprintsOf(get().artifacts)(link.targetId);
      if (!reviewed || reviewed === link.reviewed) return;
      await get().saveLink({ ...link, reviewed, lastModified: Date.now() });
    },

    deleteLink: async (id) => {
      requireReady();
      if (!e2e) await repository.deleteLink(id);
      set((s) => ({ links: s.links.filter((l) => l.id !== id) }));
      if (!e2e) get().refreshStatus();
    },

    nextId: async (type) => {
      if (e2e) {
        const next = (e2eCounters[type] ?? 0) + 1;
        e2eCounters[type] = next;
        return `${STORED_TYPES[type].idPrefix}-${String(next).padStart(3, '0')}`;
      }
      return repository.nextId(type);
    },
  };
};
