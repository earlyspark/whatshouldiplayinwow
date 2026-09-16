/**
 * Resolves Upstash REST credentials from the environment.
 *
 * The Vercel integration namespaces injected variables with a per-project
 * prefix, so the project-specific names take precedence. The unprefixed Vercel
 * KV and Upstash names are kept as fallbacks for alternate setups. Empty values
 * are treated as absent, so placeholder variables copied from .env.example do
 * not register as a configured store.
 */
const URL_KEYS = [
  "WOWFOREVER_KV_REST_API_URL",
  "KV_REST_API_URL",
  "UPSTASH_REDIS_REST_URL",
];

const TOKEN_KEYS = [
  "WOWFOREVER_KV_REST_API_TOKEN",
  "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_TOKEN",
];

function firstValue(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return null;
}

export function redisConfig() {
  const url = firstValue(URL_KEYS);
  const token = firstValue(TOKEN_KEYS);
  return url && token ? { url, token } : null;
}

export function hasRedisConfig() {
  return Boolean(redisConfig());
}
