/**
 * Traceability rules (DESIGN.md §3.3, P2): which links are allowed, and what
 * counts as coverage. They are data in tracyfy.yaml, with the defaults below,
 * so strictness is a per-project choice:
 *
 *   traceability:
 *     allowed:            # source kind, link type, target kind ('*' = any kind)
 *       - [testCase, verifies, requirement]
 *       - ['*', related_to, '*']
 *     coverage:
 *       - name: Every requirement is verified
 *         kind: requirement
 *         needs: { incoming: verifies, from: testCase }
 *
 * From them, derived and pure: the link types the link dialog offers for two
 * artifacts, and the gaps (rule violations by rule name, links the rules do
 * not allow, links to artifacts that do not exist).
 *
 * Pure TypeScript: no React, no IO.
 */
import { kindOfId, type ArtifactKindId } from './artifactKinds';
import { LINK_TYPE_IDS, isSymmetricType, linkLabelFrom, type LinkType } from './linkTypes';

/** A kind, or '*' for any kind */
export type KindPattern = ArtifactKindId | '*';

/** [source kind, link type, target kind] */
export type AllowedLink = readonly [KindPattern, LinkType, KindPattern];

export interface CoverageRule {
  /** Shown as the gap: "Every requirement is verified" */
  name: string;
  /** The kind every artifact of which must meet the rule */
  kind: ArtifactKindId;
  /** At least one link like this; `from`/`to` limit the kind at the other end */
  needs:
    | { incoming: LinkType; from?: ArtifactKindId }
    | { outgoing: LinkType; to?: ArtifactKindId };
}

export interface TraceabilityRules {
  allowed: readonly AllowedLink[];
  coverage: readonly CoverageRule[];
}

export const DEFAULT_TRACEABILITY: TraceabilityRules = {
  allowed: [
    ['testCase', 'verifies', 'requirement'],
    ['testCase', 'verifies', 'useCase'],
    ['requirement', 'refines', 'requirement'],
    ['useCase', 'refines', 'useCase'],
    ['requirement', 'satisfies', 'useCase'],
    ['requirement', 'mitigates', 'risk'],
    ['requirement', 'derived_from', 'information'],
    ['requirement', 'derived_from', 'requirement'],
    ['useCase', 'derived_from', 'information'],
    ['requirement', 'depends_on', 'requirement'],
    ['requirement', 'constrains', 'requirement'],
    ['requirement', 'conflicts_with', 'requirement'],
    ['useCase', 'requires', 'useCase'],
    ['*', 'duplicates', '*'],
    ['*', 'related_to', '*'],
  ],
  coverage: [
    {
      name: 'Every requirement is verified',
      kind: 'requirement',
      needs: { incoming: 'verifies', from: 'testCase' },
    },
    {
      name: 'Every risk is mitigated',
      kind: 'risk',
      needs: { incoming: 'mitigates', from: 'requirement' },
    },
    {
      name: 'Every test case verifies something',
      kind: 'testCase',
      needs: { outgoing: 'verifies' },
    },
  ],
};

const matches = (pattern: KindPattern, kindId: ArtifactKindId) =>
  pattern === '*' || pattern === kindId;

/** Whether the rules allow `source type target` */
export function isAllowed(
  rules: TraceabilityRules,
  source: ArtifactKindId,
  type: LinkType,
  target: ArtifactKindId
): boolean {
  return rules.allowed.some(
    ([s, t, g]) =>
      t === type &&
      ((matches(s, source) && matches(g, target)) ||
        (isSymmetricType(type) && matches(s, target) && matches(g, source)))
  );
}

/** One way to link two artifacts, as offered from the one the user starts at */
export interface LinkOption {
  type: LinkType;
  /** 'forward': stored as start → other; 'backward': stored as other → start */
  direction: 'forward' | 'backward';
  /** How it reads from the start: "Verifies" or "Verified by" */
  label: string;
  /** Unique key for a menu */
  key: string;
}

/**
 * The links the rules allow between an artifact of kind `from` and one of
 * kind `to`, as they read from `from`. "Verified by" from a requirement to a
 * test case is stored as the test case verifying the requirement.
 */
export function linkOptions(
  rules: TraceabilityRules,
  from: ArtifactKindId,
  to: ArtifactKindId
): LinkOption[] {
  const options: LinkOption[] = [];
  for (const type of LINK_TYPE_IDS) {
    if (isAllowed(rules, from, type, to)) {
      options.push({ type, direction: 'forward', label: linkLabelFrom(type, 'source'), key: type });
    }
    if (!isSymmetricType(type) && isAllowed(rules, to, type, from)) {
      options.push({
        type,
        direction: 'backward',
        label: linkLabelFrom(type, 'target'),
        key: `${type}:backward`,
      });
    }
  }
  return options;
}

// ---- Gaps ----

/** The parts of an artifact and a link the gap analysis reads */
export interface TracedArtifact {
  id: string;
  isDeleted?: boolean;
  /** Its content fingerprint; without one, links to it are never suspect */
  fingerprint?: string;
}
export interface TracedLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: LinkType;
  /** The target's fingerprint when the link was last reviewed */
  reviewed?: string;
}

export type Gap =
  /** An artifact does not meet a coverage rule */
  | { issue: 'coverage'; artifactId: string; rule: string }
  /** A link whose kinds and type the rules do not allow */
  | { issue: 'not_allowed'; artifactId: string; linkId: string }
  /** A link with an end that is not in the project (removed by hand, or by a pull) */
  | { issue: 'orphan_link'; artifactId: string; linkId: string; missingId: string }
  /**
   * The target changed since the link was last reviewed (or the link was never
   * reviewed): its source may no longer be right. Reported on the source.
   */
  | { issue: 'suspect'; artifactId: string; linkId: string; changedId: string };

/** Whether the target changed since the link was reviewed; false if the target is unknown */
export function isSuspect(link: { reviewed?: string }, targetFingerprint: string | undefined) {
  return targetFingerprint !== undefined && link.reviewed !== targetFingerprint;
}

/** Every rule violation in the project, in artifact order */
export function findGaps(
  rules: TraceabilityRules,
  artifacts: readonly TracedArtifact[],
  links: readonly TracedLink[]
): Gap[] {
  const live = new Set(artifacts.filter((a) => !a.isDeleted).map((a) => a.id));
  const fingerprints = new Map(artifacts.map((a) => [a.id, a.fingerprint]));
  const known = new Set(artifacts.map((a) => a.id));
  const gaps: Gap[] = [];
  const byArtifact = new Map<string, Gap[]>();
  const add = (gap: Gap) => {
    const list = byArtifact.get(gap.artifactId) ?? [];
    list.push(gap);
    byArtifact.set(gap.artifactId, list);
  };

  // Links that count: both ends exist and are not deleted
  const counted: TracedLink[] = [];
  for (const link of links) {
    const sourceKnown = known.has(link.sourceId);
    const targetKnown = known.has(link.targetId);
    if (!sourceKnown || !targetKnown) {
      if (sourceKnown || targetKnown) {
        add({
          issue: 'orphan_link',
          artifactId: sourceKnown ? link.sourceId : link.targetId,
          linkId: link.id,
          missingId: sourceKnown ? link.targetId : link.sourceId,
        });
      }
      continue;
    }
    const source = kindOfId(link.sourceId);
    const target = kindOfId(link.targetId);
    if (source && target && !isAllowed(rules, source, link.type, target)) {
      add({ issue: 'not_allowed', artifactId: link.sourceId, linkId: link.id });
    }
    if (live.has(link.sourceId) && live.has(link.targetId)) {
      counted.push(link);
      if (isSuspect(link, fingerprints.get(link.targetId))) {
        add({
          issue: 'suspect',
          artifactId: link.sourceId,
          linkId: link.id,
          changedId: link.targetId,
        });
      }
    }
  }

  for (const rule of rules.coverage) {
    for (const artifact of artifacts) {
      if (artifact.isDeleted || kindOfId(artifact.id) !== rule.kind) continue;
      if (!meets(rule, artifact.id, counted)) {
        add({ issue: 'coverage', artifactId: artifact.id, rule: rule.name });
      }
    }
  }

  for (const artifact of artifacts) gaps.push(...(byArtifact.get(artifact.id) ?? []));
  return gaps;
}

/** The artifact at the other end of `link` from `id`, read in `direction` */
function otherEnd(link: TracedLink, id: string, direction: 'incoming' | 'outgoing') {
  if (direction === 'incoming' && link.targetId === id) return link.sourceId;
  if (direction === 'outgoing' && link.sourceId === id) return link.targetId;
  if (isSymmetricType(link.type)) {
    if (link.sourceId === id) return link.targetId;
    if (link.targetId === id) return link.sourceId;
  }
  return undefined;
}

function meets(rule: CoverageRule, id: string, links: readonly TracedLink[]): boolean {
  const [direction, type, kindAtOtherEnd] =
    'incoming' in rule.needs
      ? (['incoming', rule.needs.incoming, rule.needs.from] as const)
      : (['outgoing', rule.needs.outgoing, rule.needs.to] as const);
  return links.some((link) => {
    if (link.type !== type) return false;
    const other = otherEnd(link, id, direction);
    return other !== undefined && (!kindAtOtherEnd || kindOfId(other) === kindAtOtherEnd);
  });
}
