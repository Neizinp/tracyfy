/**
 * The few rules that belong to one kind rather than to its fields.
 *
 * Pure TypeScript: no React, no IO.
 */
import type { ArtifactKindId } from './artifactKinds';

type Fields = Record<string, unknown>;

/**
 * Fields the app sets itself when an artifact is saved: a test case records
 * when it last ran whenever its status becomes passed or failed.
 */
export function savedByTheApp(
  kindId: ArtifactKindId,
  previous: Fields | undefined,
  next: Fields,
  now: number
): Fields {
  if (kindId !== 'testCase') return {};
  const ran = next.status === 'passed' || next.status === 'failed';
  return ran && previous?.status !== next.status ? { lastRun: now } : {};
}

export type RiskLevel = 'low' | 'medium' | 'high';

const SCORE: Record<string, number> = { low: 1, medium: 2, high: 3 };

/** Probability times impact (each low / medium / high), as a level */
export function riskLevel(probability: unknown, impact: unknown): RiskLevel {
  const score = (SCORE[String(probability)] ?? 2) * (SCORE[String(impact)] ?? 2);
  return score <= 2 ? 'low' : score <= 4 ? 'medium' : 'high';
}
