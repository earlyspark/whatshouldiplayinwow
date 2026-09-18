const RESULT_RETENTION_DAYS = 90;
const RETENTION_MS = RESULT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
// Results saved under the earlier 12-month policy stay available until at least this date.
const LEGACY_RESULTS_KEPT_UNTIL = Date.UTC(2027, 0, 1);

export function resultExpiresAt(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return Number.NaN;
  return Math.max(created + RETENTION_MS, LEGACY_RESULTS_KEPT_UNTIL);
}
