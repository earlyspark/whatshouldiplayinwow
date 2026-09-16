/** Results expire 12 calendar months after creation. */
export function resultExpiresAt(createdAt: string): number {
  const created = new Date(createdAt);
  if (!Number.isFinite(created.getTime())) return Number.NaN;
  const year = created.getUTCFullYear() + 1;
  const month = created.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Date.UTC(
    year, month, Math.min(created.getUTCDate(), lastDay),
    created.getUTCHours(), created.getUTCMinutes(), created.getUTCSeconds(), created.getUTCMilliseconds(),
  );
}
