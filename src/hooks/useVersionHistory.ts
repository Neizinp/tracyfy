/**
 * useVersionHistory Hook
 *
 * Manages state, data loading, and filtering logic for version history.
 * Extracted from VersionHistory component for better separation of concerns.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { debug } from '../utils/debug';
import type { ProjectBaseline, CommitInfo } from '../types';
import { realGitService } from '../services/realGitService';

export type TabType = 'baselines' | 'commits' | 'global';

// Configuration for artifact type filters
export const ARTIFACT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  requirements: { label: 'REQ', color: 'var(--color-info)' },
  usecases: { label: 'UC', color: 'var(--color-accent)' },
  testcases: { label: 'TC', color: 'var(--color-success)' },
  information: { label: 'INFO', color: 'var(--color-warning)' },
  risks: { label: 'RISK', color: 'var(--color-error)' },
  projects: { label: 'PROJ', color: 'var(--color-text-muted)' },
  links: { label: 'LINK', color: 'var(--color-text-secondary)' },
  workflows: { label: 'WF', color: 'var(--color-info-light)' },
  users: { label: 'USER', color: 'var(--color-accent)' },
  counters: { label: 'CTR', color: 'var(--color-text-muted)' },
  other: { label: 'OTHER', color: 'var(--color-text-muted)' },
};

// Folders that map to known artifact types
const FOLDER_TO_TYPE: Record<string, string> = {
  requirements: 'requirements',
  usecases: 'usecases',
  testcases: 'testcases',
  information: 'information',
  risks: 'risks',
  projects: 'projects',
  links: 'links',
  workflows: 'workflows',
  users: 'users',
  counters: 'counters',
};

// Get artifact type from file path (returns 'other' for unrecognized folders)
export const getArtifactTypeFromPath = (filePath: string): string => {
  const folderName = filePath.split('/')[0];
  return FOLDER_TO_TYPE[folderName] || 'other';
};

// Default selected artifact types
const DEFAULT_SELECTED_TYPES = new Set([
  'requirements',
  'usecases',
  'testcases',
  'information',
  'risks',
  'projects',
  'links',
  'workflows',
  'users',
  'counters',
  'other',
]);

interface UseVersionHistoryOptions {
  isOpen: boolean;
  baselines: ProjectBaseline[];
  projectName: string | null;
  onCreateBaseline: (name: string, message: string) => void;
}

export function useVersionHistory({
  isOpen,
  baselines,
  projectName,
  onCreateBaseline,
}: UseVersionHistoryOptions) {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('baselines');

  // Baseline creation state
  const [isCreatingBaseline, setIsCreatingBaseline] = useState(false);
  const [baselineName, setBaselineName] = useState('');
  const [baselineMessage, setBaselineMessage] = useState('');

  // Commits state
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [globalCommits, setGlobalCommits] = useState<CommitInfo[]>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [isLoadingGlobalCommits, setIsLoadingGlobalCommits] = useState(false);

  // Tag/baseline mapping state
  const [baselineCommitHashes, setBaselineCommitHashes] = useState<Map<string, string[]>>(
    new Map()
  );
  const [tagToCommitHash, setTagToCommitHash] = useState<Map<string, string>>(new Map());
  const [commitFiles, setCommitFiles] = useState<Map<string, string[]>>(new Map());

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(DEFAULT_SELECTED_TYPES);

  // Snapshot viewing state
  const [viewingSnapshot, setViewingSnapshot] = useState<{
    commitHash: string;
    name: string;
    timestamp: number;
  } | null>(null);

  // Project-specific baseline helpers
  const projectPrefix = projectName ? `[${projectName}] ` : '';
  const isProjectBaseline = useCallback(
    (tagName: string) => projectName && tagName.startsWith(projectPrefix),
    [projectName, projectPrefix]
  );

  // Filter baselines for current project
  const projectBaselines = useMemo(
    () => baselines.filter((b) => isProjectBaseline(b.name)),
    [baselines, isProjectBaseline]
  );

  const getVersionFromTag = useCallback(
    (tagName: string) =>
      tagName.startsWith(projectPrefix) ? tagName.slice(projectPrefix.length) : tagName,
    [projectPrefix]
  );

  // Load tags
  const loadTags = useCallback(async () => {
    try {
      const tags = await realGitService.getTagsWithDetails();
      debug.log('[VersionHistory] Tags loaded:', tags);

      const hashToTags = new Map<string, string[]>();
      const tagToHash = new Map<string, string>();

      tags.forEach((tag) => {
        const existing = hashToTags.get(tag.commit) || [];
        existing.push(tag.name);
        hashToTags.set(tag.commit, existing);
        tagToHash.set(tag.name, tag.commit);
      });

      setBaselineCommitHashes(hashToTags);
      setTagToCommitHash(tagToHash);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, []);

  // Load project-specific commits
  const loadCommits = useCallback(async () => {
    if (!projectName) return;

    setIsLoadingCommits(true);
    try {
      const projectFilePath = `projects/${projectName}.md`;
      const history = await realGitService.getHistory(projectFilePath);
      setCommits(history);
    } catch (error) {
      console.error('Failed to load commits:', error);
    } finally {
      setIsLoadingCommits(false);
    }
  }, [projectName]);

  // Load global commits
  const loadGlobalCommits = useCallback(async () => {
    setIsLoadingGlobalCommits(true);
    try {
      const history = await realGitService.getHistory();
      setGlobalCommits(history);

      const filesMap = new Map<string, string[]>();
      await Promise.all(
        history.map(async (commit) => {
          const files = await realGitService.getCommitFiles(commit.hash);
          filesMap.set(commit.hash, files);
        })
      );
      setCommitFiles(filesMap);
    } catch (error) {
      console.error('Failed to load global commits:', error);
    } finally {
      setIsLoadingGlobalCommits(false);
    }
  }, []);

  // Load tags on open
  useEffect(() => {
    if (isOpen) {
      loadTags();
    }
  }, [isOpen, loadTags]);

  // Load commits when tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'commits') {
      loadCommits();
    }
  }, [isOpen, activeTab, loadCommits]);

  // Load global commits when tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'global') {
      loadGlobalCommits();
    }
  }, [isOpen, activeTab, loadGlobalCommits]);

  // Toggle artifact type filter
  const handleToggleType = useCallback((type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // Filter global commits based on selected types
  const filteredGlobalCommits = useMemo(() => {
    return globalCommits.filter((commit) => {
      const files = commitFiles.get(commit.hash) || [];
      if (files.length === 0) return true;

      return files.some((file) => {
        const artifactType = getArtifactTypeFromPath(file);
        return selectedTypes.has(artifactType);
      });
    });
  }, [globalCommits, commitFiles, selectedTypes]);

  // Start creating baseline
  const handleStartCreating = useCallback(() => {
    setBaselineName(`${projectBaselines.length + 1}.0`);
    setBaselineMessage('');
    setIsCreatingBaseline(true);
  }, [projectBaselines.length]);

  // Submit baseline creation
  const handleCreateBaselineSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (baselineName.trim() && projectName) {
        const fullTagName = `${projectPrefix}${baselineName.trim()}`;
        onCreateBaseline(
          fullTagName,
          baselineMessage.trim() || `Baseline ${baselineName.trim()} for ${projectName}`
        );
        setBaselineName('');
        setBaselineMessage('');
        setIsCreatingBaseline(false);
      }
    },
    [baselineName, baselineMessage, projectName, projectPrefix, onCreateBaseline]
  );

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Baseline creation
    isCreatingBaseline,
    setIsCreatingBaseline,
    baselineName,
    setBaselineName,
    baselineMessage,
    setBaselineMessage,
    handleStartCreating,
    handleCreateBaselineSubmit,

    // Project baselines
    projectBaselines,
    projectPrefix,
    getVersionFromTag,

    // Commits
    commits,
    globalCommits,
    filteredGlobalCommits,
    isLoadingCommits,
    isLoadingGlobalCommits,
    commitFiles,

    // Tag mappings
    baselineCommitHashes,
    tagToCommitHash,

    // Filters
    selectedTypes,
    handleToggleType,

    // Snapshot
    viewingSnapshot,
    setViewingSnapshot,
  };
}
