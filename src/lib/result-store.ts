import { Redis } from "@upstash/redis";
import { savedResultSchema, type SavedResult } from "@/lib/result-schema";

const prefix = "wow-forever-result";

declare global {
  var __wowForeverResults: Map<string, SavedResult> | undefined;
}

const memory = globalThis.__wowForeverResults ?? new Map<string, SavedResult>();
if (process.env.NODE_ENV !== "production") globalThis.__wowForeverResults = memory;

function redisConfig() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export function hasRedisConfig() {
  return Boolean(redisConfig());
}

function redis() {
  const config = redisConfig();
  return config ? new Redis(config) : null;
}

export async function saveResult(result: SavedResult) {
  const client = redis();
  if (client) {
    await client.set(`${prefix}:${result.id}`, JSON.stringify(result));
    return;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Result storage is not configured.");
  memory.set(result.id, result);
}

export async function getResult(id: string): Promise<SavedResult | null> {
  const client = redis();
  const raw = client ? await client.get<unknown>(`${prefix}:${id}`) : memory.get(id);
  if (!raw) return null;
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;
  const parsed = savedResultSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function keepStoreAlive() {
  const client = redis();
  if (!client) throw new Error("Redis is not configured.");
  await client.set("wow-forever:keepalive", new Date().toISOString());
}
