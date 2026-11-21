/**
 * Lifecycles: which statuses a kind has, where a new artifact starts, and how
 * review works (DESIGN.md §3.4, P6).
 *
 * Review and approval are status transitions, recorded in git: an artifact
 * goes to `in_review`, someone approves it (or sends it back to its initial
 * status), and editing the content of an approved artifact sends it back to
 * review when the project has that rule on (`reviewOnContentChange` in
 * tracyfy.yaml, on unless turned off).
 *
 * Pure TypeScript: no React, no IO.
 */

export interface Lifecycle {
  /** Every status, in the order a status menu shows them */
  states: readonly string[];
  /** The status of a new artifact */
  initial: string;
  /** How the kind is reviewed; kinds without it (risks) have no review */
  review?: {
    /** Waiting for someone to approve it */
    pending: string;
    /** What approving sets */
    approved: string;
    /** Statuses that mean "approved, or further along" */
    approvedStates: readonly string[];
  };
}

export const REVIEW_STATE = 'in_review';

/** A lifecycle with draft -> in_review -> approved, followed by `after` */
function reviewed(after: string[], approvedStates: string[] = ['approved', ...after]): Lifecycle {
  return {
    states: ['draft', REVIEW_STATE, 'approved', ...after],
    initial: 'draft',
    review: { pending: REVIEW_STATE, approved: 'approved', approvedStates },
  };
}

export const LIFECYCLES = {
  /** Requirements and use cases: approved, then built, then verified */
  specification: reviewed(['implemented', 'verified']),
  /** Test cases: approved, then run */
  test: reviewed(['passed', 'failed', 'blocked']),
  /** Information: approved, then archived */
  information: reviewed(['archived'], ['approved']),
  /** Documents: approved, then obsolete */
  document: reviewed(['obsolete'], ['approved']),
  /** Risks are tracked, not approved */
  risk: {
    states: ['identified', 'analyzing', 'mitigating', 'resolved', 'accepted'],
    initial: 'identified',
  } satisfies Lifecycle,
};

/** The project's lifecycle settings, from tracyfy.yaml */
export interface LifecycleSettings {
  reviewOnContentChange: boolean;
}

export const DEFAULT_LIFECYCLE_SETTINGS: LifecycleSettings = { reviewOnContentChange: true };

/**
 * The status an edit should save. Editing the content of an approved
 * artifact sends it back to review, unless the edit chose a status itself.
 */
export function statusAfterEdit(
  lifecycle: Lifecycle,
  settings: LifecycleSettings,
  previous: { status?: string },
  next: { status?: string },
  contentChanged: boolean
): string | undefined {
  const review = lifecycle.review;
  if (
    review &&
    settings.reviewOnContentChange &&
    contentChanged &&
    next.status === previous.status &&
    previous.status !== undefined &&
    review.approvedStates.includes(previous.status)
  ) {
    return review.pending;
  }
  return next.status;
}
