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
import { ARTIFACT_KINDS } from '../domain/artifactKinds';

export type TabType = 'baselines' | 'commits';

// Commit filter categories: one per artifact kind, plus files that are not artifacts
export const ARTIFACT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  ...Object.fromEntries(
    ARTIFACT_KINDS.map((k) => [k.id, { label: k.prefix, color: k.color.text }])
  ),
  project: { label: 'PROJ', color: 'var(--color-text-muted)' },
  link: { label: 'LINK', color: 'var(--color-text-secondary)' },
  workflow: { label: 'WF', color: 'var(--color-info-light)' },
  user: { label: 'USER', color: 'var(--color-accent)' },
  counter: { label: 'CTR', color: 'var(--color-text-muted)' },
  other: { label: 'OTHER', color: 'var(--color-text-muted)' },
};

const FOLDER_TO_TYPE: Record<string, string> = {
  ...Object.fromEntries(ARTIFACT_KINDS.map((k) => [k.folder, k.id])),
  'project.md': 'project',
  links: 'link',
  workflows: 'workflow',
  users: 'user',
  counters: 'counter',
};

// Filter category of a file path ('other' for unrecognized folders)
export const getArtifactTypeFromPath = (filePath: string): string => {
  const folderName = filePath.split('/')[0];
  return FOLDER_TO_TYPE[folderName] || 'other';
};

// Everything is shown by default
const DEFAULT_SELECTED_TYPES = new Set(Object.keys(ARTIFACT_TYPE_CONFIG));

interface UseVersionHistoryOptions {
  isOpen: boolean;
  baselines: ProjectBaseline[];
  onCreateBaseline: (name: string, message: string) => void;
}

export function useVersionHistory({
  isOpen,
  baselines,
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
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);

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

  // Load all commits
  const loadCommits = useCallback(async () => {
    setIsLoadingCommits(true);
    try {
      const history = await realGitService.getHistory();
      setCommits(history);

      const filesMap = new Map<string, string[]>();
      await Promise.all(
        history.map(async (commit) => {
          const files = await realGitService.getCommitFiles(commit.hash);
          filesMap.set(commit.hash, files);
        })
      );
      setCommitFiles(filesMap);
    } catch (error) {
      console.error('Failed to load commits:', error);
    } finally {
      setIsLoadingCommits(false);
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

  // Select all artifact types
  const handleSelectAll = useCallback(() => {
    setSelectedTypes(new Set(Object.keys(ARTIFACT_TYPE_CONFIG)));
  }, []);

  // Deselect all artifact types
  const handleDeselectAll = useCallback(() => {
    setSelectedTypes(new Set());
  }, []);

  // Filter commits based on selected types
  const filteredCommits = useMemo(() => {
    return commits.filter((commit) => {
      const files = commitFiles.get(commit.hash) || [];
      if (files.length === 0) return true;

      return files.some((file) => {
        const artifactType = getArtifactTypeFromPath(file);
        return selectedTypes.has(artifactType);
      });
    });
  }, [commits, commitFiles, selectedTypes]);

  // Start creating baseline
  const handleStartCreating = useCallback(() => {
    setBaselineName(`${baselines.length + 1}.0`);
    setBaselineMessage('');
    setIsCreatingBaseline(true);
  }, [baselines.length]);

  // Submit baseline creation
  const handleCreateBaselineSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const name = baselineName.trim();
      if (name) {
        onCreateBaseline(name, baselineMessage.trim() || `Baseline ${name}`);
        setBaselineName('');
        setBaselineMessage('');
        setIsCreatingBaseline(false);
      }
    },
    [baselineName, baselineMessage, onCreateBaseline]
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

    // Commits
    commits,
    filteredCommits,
    isLoadingCommits,
    commitFiles,

    // Tag mappings
    baselineCommitHashes,
    tagToCommitHash,

    // Filters
    selectedTypes,
    handleToggleType,
    handleSelectAll,
    handleDeselectAll,

    // Snapshot
    viewingSnapshot,
    setViewingSnapshot,
  };
}
