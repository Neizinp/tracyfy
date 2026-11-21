/**
 * The revision history of an export: what changed since the previous
 * baseline, for every kind.
 *
 * Exporting the working copy shows the commits since the newest baseline.
 * Exporting a baseline shows the commits between the baseline before it and
 * that baseline. Without a previous baseline there is nothing to compare
 * with, so there is no history (the first version has none).
 */
import { ARTIFACT_KINDS, type ArtifactKindId } from '../domain/artifactKinds';
import type { CommitInfo, ProjectBaseline } from '../types';
import { exported, type ExportSource } from './exportData';

/** Commits after `after` and, when set, at or before `until` (epoch ms) */
export interface HistoryWindow {
  after: number;
  until: number | null;
}

/** The window to report, or null when there is no previous baseline */
export function historyWindow(
  baselines: readonly ProjectBaseline[],
  selected: ProjectBaseline | null
): HistoryWindow | null {
  const newestFirst = [...baselines].sort((a, b) => b.timestamp - a.timestamp);
  if (!selected) {
    return newestFirst.length > 0 ? { after: newestFirst[0].timestamp, until: null } : null;
  }
  const index = newestFirst.findIndex((b) => b.name === selected.name);
  const previous = index >= 0 ? newestFirst[index + 1] : undefined;
  return previous ? { after: previous.timestamp, until: selected.timestamp } : null;
}

const inWindow = (time: number, w: HistoryWindow) =>
  time > w.after && (w.until === null || time <= w.until);

export interface ArtifactChange {
  kind: ArtifactKindId;
  id: string;
  title: string;
  /** Commits in the window, newest first */
  commits: CommitInfo[];
  /** Its first commit is in the window */
  added: boolean;
  /** Deleted in the window */
  removed: boolean;
}

/** One artifact's change in the window, or null when it did not change */
export function changeOf(
  item: { id: string; title?: string; isDeleted?: boolean; deletedAt?: number },
  kindId: ArtifactKindId,
  history: readonly CommitInfo[],
  w: HistoryWindow
): ArtifactChange | null {
  const commits = history.filter((c) => inWindow(c.timestamp, w));
  const oldest = history.reduce<CommitInfo | null>(
    (o, c) => (o === null || c.timestamp < o.timestamp ? c : o),
    null
  );
  const added = oldest !== null && inWindow(oldest.timestamp, w);
  const removed = !!item.isDeleted && item.deletedAt !== undefined && inWindow(item.deletedAt, w);
  if (commits.length === 0 && !added && !removed) return null;
  return {
    kind: kindId,
    id: item.id,
    title: item.title ?? '',
    commits: [...commits].sort((a, b) => b.timestamp - a.timestamp),
    added,
    removed,
  };
}

/** Every artifact that changed in the window, by kind, then ID */
export async function collectChanges(
  source: Pick<ExportSource, 'artifacts' | 'baselines' | 'baseline' | 'history'>,
  kinds: readonly ArtifactKindId[]
): Promise<ArtifactChange[] | null> {
  const w = historyWindow(source.baselines, source.baseline);
  if (!w) return null;
  const changes: ArtifactChange[] = [];
  for (const k of ARTIFACT_KINDS) {
    if (!kinds.includes(k.id)) continue;
    const removed = source.artifacts[k.id].filter((a) => a.isDeleted);
    for (const item of [...exported(source, k.id), ...removed]) {
      let history: CommitInfo[] = [];
      try {
        history = await source.history(k.id, item.id);
      } catch (err) {
        console.error(`Failed to read the history of ${item.id}`, err);
      }
      const change = changeOf(item as { id: string; title?: string }, k.id, history, w);
      if (change) changes.push(change);
    }
  }
  return changes;
}

/** What a change says in one line: added, removed, or its commit messages */
export function changeSummary(change: ArtifactChange, singular: string): string {
  if (change.removed) return `${singular} removed`;
  if (change.added) return `${singular} added`;
  const messages = change.commits.map((c) => c.message.trim());
  if (messages.length === 1) return messages[0];
  return messages.map((m) => `• ${m}`).join('\n');
}
