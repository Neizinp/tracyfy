/**
 * Review: what is waiting for someone to look at it (DESIGN.md §3.4, P6).
 *
 * - Artifacts in review: approve them or send them back. Each decision is
 *   committed at once, so git records who decided, when, and why.
 * - Suspect links: links whose target changed since they were last reviewed.
 *
 * Replaces the workflows, which were a separate artifact that was not
 * connected to status.
 */
import React, { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../state';
import { useOpenArtifact } from '../hooks/useOpenArtifact';
import { ARTIFACT_KINDS, kind, kindOfId, type ArtifactKindId } from '../domain/artifactKinds';
import { fingerprintsOf } from '../domain/fingerprint';
import { isSuspect } from '../domain/traceability';
import { linkLabelFrom } from '../domain/linkTypes';
import { notifyError } from '../state';

interface InReview {
  kindId: ArtifactKindId;
  id: string;
  title: string;
  author?: string;
}

/** Every artifact that is waiting for review, in registry and ID order */
export function artifactsInReview(
  artifacts: Record<ArtifactKindId, readonly object[]>
): InReview[] {
  return ARTIFACT_KINDS.flatMap((k) => {
    const pending = k.lifecycle.review?.pending;
    if (!pending) return [];
    return (
      artifacts[k.id] as {
        id: string;
        title: string;
        author?: string;
        status?: string;
        isDeleted?: boolean;
      }[]
    )
      .filter((a) => !a.isDeleted && a.status === pending)
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
      .map((a) => ({ kindId: k.id, id: a.id, title: a.title, author: a.author }));
  });
}

const ArtifactId: React.FC<{ id: string }> = ({ id }) => {
  const openArtifact = useOpenArtifact();
  const k = kindOfId(id);
  return (
    <button
      type="button"
      className="tf-link-target"
      style={k ? { color: kind(k).color.text } : undefined}
      onClick={() => openArtifact(id)}
    >
      <span className="tf-mono">{id}</span>
    </button>
  );
};

const ReviewRow: React.FC<{ item: InReview }> = ({ item }) => {
  const approve = useAppStore((s) => s.approveArtifact);
  const sendBack = useAppStore((s) => s.sendBackArtifact);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const decide = async (action: typeof approve) => {
    setBusy(true);
    try {
      await action(item.kindId, item.id, comment);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="tf-review-row" aria-label={`${item.id} ${item.title}`}>
      <div className="tf-review-head">
        <span className="tf-chip">{kind(item.kindId).label.singular}</span>
        <ArtifactId id={item.id} />
        <span className="tf-link-title">{item.title}</span>
        {item.author && <span className="tf-field-help">by {item.author}</span>}
      </div>
      <div className="tf-review-actions">
        <input
          className="tf-input"
          aria-label={`Comment on ${item.id}`}
          placeholder="Comment (goes in the commit message)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button
          type="button"
          className="tf-button tf-button-primary"
          disabled={busy}
          onClick={() => decide(approve)}
        >
          Approve
        </button>
        <button
          type="button"
          className="tf-button"
          disabled={busy}
          onClick={() => decide(sendBack)}
        >
          Send back
        </button>
      </div>
    </li>
  );
};

export const ReviewPage: React.FC = () => {
  const artifacts = useAppStore((s) => s.artifacts);
  const links = useAppStore((s) => s.links);
  const markLinkReviewed = useAppStore((s) => s.markLinkReviewed);

  const inReview = useMemo(
    () => artifactsInReview(artifacts as unknown as Record<ArtifactKindId, object[]>),
    [artifacts]
  );
  const suspect = useMemo(() => {
    const fingerprintOf = fingerprintsOf(artifacts);
    return links.filter(
      (l) => fingerprintOf(l.sourceId) !== undefined && isSuspect(l, fingerprintOf(l.targetId))
    );
  }, [links, artifacts]);

  return (
    <div className="tf-review">
      <section>
        <h2>In review ({inReview.length})</h2>
        {inReview.length === 0 ? (
          <div className="tf-empty">
            <CheckCircle2 size={32} />
            <p>
              Nothing is waiting for review. Set an artifact&apos;s status to In review to ask for
              it.
            </p>
          </div>
        ) : (
          <ul className="tf-link-list">
            {inReview.map((item) => (
              <ReviewRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Suspect links ({suspect.length})</h2>
        <p className="tf-hint">
          The target changed since the link was last reviewed. Check that the link still holds, then
          mark it reviewed.
        </p>
        {suspect.length === 0 ? (
          <div className="tf-empty">No suspect links.</div>
        ) : (
          <ul className="tf-link-list">
            {suspect.map((link) => (
              <li key={link.id} className="tf-link-row" aria-label={link.id}>
                <ArtifactId id={link.sourceId} />
                <span className="tf-chip">{linkLabelFrom(link.type, 'source')}</span>
                <ArtifactId id={link.targetId} />
                <span className="tf-link-title">{link.targetId} changed</span>
                <button
                  type="button"
                  className="tf-button tf-button-small"
                  onClick={() =>
                    markLinkReviewed(link.id).catch((err) =>
                      notifyError('Could not mark the link reviewed', err)
                    )
                  }
                >
                  Mark reviewed
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
