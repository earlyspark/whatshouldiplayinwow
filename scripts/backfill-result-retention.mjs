import { Redis } from "@upstash/redis";

const apply = process.argv.includes("--apply");
const url = ["WOWFOREVER_KV_REST_API_URL", "KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"]
  .map((name) => process.env[name]).find(Boolean);
const token = ["WOWFOREVER_KV_REST_API_TOKEN", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN"]
  .map((name) => process.env[name]).find(Boolean);
if (!url || !token) throw new Error("Redis credentials are missing.");

const client = new Redis({ url, token });
const now = Date.now();
const totals = { alreadyExpiring: 0, scheduled: 0, expired: 0, invalid: 0 };

function expiryOf(raw) {
  let result = raw;
  if (typeof result === "string") {
    try { result = JSON.parse(result); } catch { return null; }
  }
  const created = new Date(result?.createdAt);
  if (!Number.isFinite(created.getTime())) return null;
  const year = created.getUTCFullYear() + 1;
  const month = created.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Date.UTC(
    year, month, Math.min(created.getUTCDate(), lastDay),
    created.getUTCHours(), created.getUTCMinutes(), created.getUTCSeconds(), created.getUTCMilliseconds(),
  );
}

async function* matchingKeys(pattern) {
  let cursor = "0";
  do {
    const [next, keys] = await client.scan(cursor, { match: pattern, count: 100 });
    cursor = next;
    for (const key of keys) yield key;
  } while (cursor !== "0");
}

async function setExpiry(key, expiry) {
  if (expiry === null) { totals.invalid += 1; return; }
  if (expiry <= now) {
    totals.expired += 1;
    if (apply) await client.del(key);
    return;
  }
  totals.scheduled += 1;
  if (apply) await client.expireat(key, Math.ceil(expiry / 1000));
}

for await (const key of matchingKeys("wow-forever-result:*")) {
  if (await client.ttl(key) !== -1) { totals.alreadyExpiring += 1; continue; }
  await setExpiry(key, expiryOf(await client.get(key)));
}

const markerPrefix = "wow-forever:quiz-stats:v1:counted:";
for await (const key of matchingKeys(`${markerPrefix}*`)) {
  if (await client.ttl(key) !== -1) { totals.alreadyExpiring += 1; continue; }
  const id = key.slice(markerPrefix.length);
  const expiry = expiryOf(await client.get(`wow-forever-result:${id}`));
  // A counted marker cannot be used once its result has been removed.
  await setExpiry(key, expiry ?? 0);
}

console.log(`${apply ? "Applied" : "Dry run"}:`, totals);
if (!apply) console.log("Rerun with --apply to set expiry dates and remove expired records.");
