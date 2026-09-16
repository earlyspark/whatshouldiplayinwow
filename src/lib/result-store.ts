import { Redis } from "@upstash/redis";
import { redisConfig } from "@/lib/redis-config";
import { savedResultSchema, type SavedResult } from "@/lib/result-schema";
import { resultExpiresAt } from "@/lib/result-retention";

const prefix = "wow-forever-result";

function isExpired(result: SavedResult) {
  const expiry = resultExpiresAt(result.createdAt);
  return !Number.isFinite(expiry) || expiry <= Date.now();
}

declare global {
  var __wowForeverResults: Map<string, SavedResult> | undefined;
}

const memory = globalThis.__wowForeverResults ?? new Map<string, SavedResult>();
if (process.env.NODE_ENV !== "production") globalThis.__wowForeverResults = memory;

function redis() {
  const config = redisConfig();
  return config ? new Redis(config) : null;
}

export async function saveResult(result: SavedResult) {
  const expiry = resultExpiresAt(result.createdAt);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) throw new Error("Result creation date is invalid.");
  const client = redis();
  if (client) {
    await client.set(`${prefix}:${result.id}`, JSON.stringify(result), { exat: Math.ceil(expiry / 1000) });
    return;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Result storage is not configured.");
  memory.set(result.id, result);
}

export async function getResult(id: string): Promise<SavedResult | null> {
  if (!/^[A-Za-z0-9_-]{12}$/.test(id)) return null;
  const client = redis();
  const raw = client ? await client.get<unknown>(`${prefix}:${id}`) : memory.get(id);
  if (!raw) return null;
  let value: unknown;
  try { value = typeof raw === "string" ? JSON.parse(raw) : raw; }
  catch { return null; }
  const parsed = savedResultSchema.safeParse(value);
  if (!parsed.success) return null;
  if (isExpired(parsed.data)) {
    if (client) await client.del(`${prefix}:${id}`).catch(() => {});
    else memory.delete(id);
    return null;
  }
  return parsed.data;
}

export async function keepStoreAlive() {
  const client = redis();
  if (!client) throw new Error("Redis is not configured.");
  await client.set("wow-forever:keepalive", new Date().toISOString());
}
