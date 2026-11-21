/**
 * The few rules that belong to one kind rather than to its fields.
 *
 * Pure TypeScript: no React, no IO.
 */
import type { ArtifactKindId } from './artifactKinds';

type Fields = Record<string, unknown>;

/**
 * Fields the app sets itself when an artifact is saved: a test case records
 * when it last ran whenever its status becomes passed or failed, and a
 * requirement when it was approved.
 */
export function savedByTheApp(
  kindId: ArtifactKindId,
  previous: Fields | undefined,
  next: Fields,
  now: number
): Fields {
  const becomes = (status: string) => next.status === status && previous?.status !== status;
  // A requirement records when it was approved, which the Approved field shows
  if (kindId === 'requirement') return becomes('approved') ? { approvalDate: now } : {};
  if (kindId !== 'testCase') return {};
  return becomes('passed') || becomes('failed') ? { lastRun: now } : {};
}

export type RiskLevel = 'low' | 'medium' | 'high';

const SCORE: Record<string, number> = { low: 1, medium: 2, high: 3 };

/** Probability times impact (each low / medium / high), as a level */
export function riskLevel(probability: unknown, impact: unknown): RiskLevel {
  const score = (SCORE[String(probability)] ?? 2) * (SCORE[String(impact)] ?? 2);
  return score <= 2 ? 'low' : score <= 4 ? 'medium' : 'high';
}
