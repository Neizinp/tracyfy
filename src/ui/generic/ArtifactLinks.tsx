/**
 * The links of one artifact, each read from this artifact's side: a
 * requirement shows "Verified by TC-007" for the link "TC-007 verifies
 * REQ-012". Used as the Relationships tab of the artifact dialog.
 */
import React, { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { useAppStore, notifyError } from '../../state';
import { kind, kindOfId } from '../../domain/artifactKinds';
import { linkLabelFrom } from '../../domain/linkTypes';
import type { Link } from '../../types';

interface ArtifactLinksProps {
  /** Undefined while the artifact is being created */
  artifactId: string | undefined;
  /** "requirement", for the hint shown before the first save */
  kindLabel: string;
  onAddLink: () => void;
  onNavigate: (id: string) => void;
}

/** A link as seen from one of its ends */
interface LinkRow {
  link: Link;
  label: string;
  otherId: string;
}

export function linkRowsOf(links: readonly Link[], id: string): LinkRow[] {
  const rows: LinkRow[] = [];
  for (const link of links) {
    if (link.sourceId === id) {
      rows.push({ link, label: linkLabelFrom(link.type, 'source'), otherId: link.targetId });
    } else if (link.targetId === id) {
      rows.push({ link, label: linkLabelFrom(link.type, 'target'), otherId: link.sourceId });
    }
  }
  return rows.sort((a, b) => a.label.localeCompare(b.label) || a.otherId.localeCompare(b.otherId));
}

export const ArtifactLinks: React.FC<ArtifactLinksProps> = ({
  artifactId,
  kindLabel,
  onAddLink,
  onNavigate,
}) => {
  const links = useAppStore((s) => s.links);
  const artifacts = useAppStore((s) => s.artifacts);
  const deleteLink = useAppStore((s) => s.deleteLink);
  const rows = useMemo(
    () => (artifactId ? linkRowsOf(links, artifactId) : []),
    [links, artifactId]
  );

  if (!artifactId) {
    return <div className="tf-empty">Save the {kindLabel} first to add links.</div>;
  }

  const titleOf = (id: string) => {
    const k = kindOfId(id);
    return k ? artifacts[k].find((a) => a.id === id)?.title : undefined;
  };

  return (
    <div className="tf-links">
      <div className="tf-links-header">
        <span className="tf-field-label">Links ({rows.length})</span>
        <button type="button" className="tf-button" onClick={onAddLink}>
          + Add Link
        </button>
      </div>
      {rows.length === 0 ? (
        <div className="tf-empty">
          No links yet. Add one to trace this {kindLabel} to other artifacts.
        </div>
      ) : (
        <ul className="tf-link-list">
          {rows.map(({ link, label, otherId }) => {
            const k = kindOfId(otherId);
            const title = titleOf(otherId);
            return (
              <li key={link.id} className="tf-link-row">
                <span className="tf-chip">{label}</span>
                <button
                  type="button"
                  className="tf-link-target"
                  onClick={() => onNavigate(otherId)}
                  style={k ? { color: kind(k).color.text } : undefined}
                >
                  <span className="tf-mono">{otherId}</span>
                </button>
                <span className="tf-link-title">{title ?? 'Not in the project'}</span>
                <button
                  type="button"
                  className="tf-icon-button"
                  title="Remove link"
                  onClick={() =>
                    deleteLink(link.id).catch((err) =>
                      notifyError('Could not remove the link', err)
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
