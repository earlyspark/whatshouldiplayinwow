import { Redis } from "@upstash/redis";
import { questions } from "@/data/questions";
import { isProductionDeployment } from "@/lib/deploy-env";
import { redisConfig } from "@/lib/redis-config";
import type { SavedResult } from "@/lib/result-schema";
import { resultExpiresAt } from "@/lib/result-retention";

export interface MonthlyQuizStats {
  month: string;
  counts: Record<string, number>;
}

const statsPrefix = "wow-forever:quiz-stats:v1";
export const quizStatsMonthKey = (month: string) => `${statsPrefix}:month:${month}`;
export const quizStatsMonthsKey = `${statsPrefix}:months`;
// Read and write all counters in one atomic script to avoid one Redis command per answer.
const completionScript = `
  if not redis.call("SET", KEYS[1], "1", "EX", ARGV[2], "NX") then return 0 end

  local fields = {}
  for i = 3, #ARGV, 2 do
    fields[#fields + 1] = ARGV[i]
  end
  local current = redis.call("HMGET", KEYS[2], unpack(fields))
  local updates = {}
  for i = 1, #fields do
    updates[#updates + 1] = fields[i]
    updates[#updates + 1] = tostring(tonumber(current[i] or "0") + tonumber(ARGV[2 * i + 2]))
  end
  redis.call("HSET", KEYS[2], unpack(updates))
  redis.call("SADD", KEYS[3], ARGV[1])
  return 1
`;

function statsRedis() {
  const config = redisConfig();
  if (!config) throw new Error("Quiz stats storage is not configured.");
  return new Redis(config);
}

export function completionIncrements(result: SavedResult): Record<string, number> {
  const increments: Record<string, number> = {
    total: 1,
    [`quiz-version:${result.quizVersion}`]: 1,
    [`data-version:${result.dataVersion}`]: 1,
    [`result:race:${result.primary.raceId}`]: 1,
    [`result:class:${result.primary.classId}`]: 1,
    [`result:pair:${result.primary.raceId}:${result.primary.classId}`]: 1,
    [`version:${result.quizVersion}:result:race:${result.primary.raceId}`]: 1,
    [`version:${result.quizVersion}:result:class:${result.primary.classId}`]: 1,
    [`version:${result.quizVersion}:result:pair:${result.primary.raceId}:${result.primary.classId}`]: 1,
  };
  for (const question of questions) {
    const choices = result.answers[question.id] ?? [];
    for (const optionId of choices) increments[`answer:${question.id}:${optionId}`] = 1;
    if (question.type === "ranked" && choices[0]) increments[`first:${question.id}:${choices[0]}`] = 1;
  }
  return increments;
}

export async function recordQuizCompletion(result: SavedResult): Promise<boolean> {
  // Local and preview testing can share the production Redis credentials.
  // Never count those results, even in an in-memory fallback.
  if (!isProductionDeployment()) return false;
  const month = result.createdAt.slice(0, 7);
  const increments = completionIncrements(result);
  const client = statsRedis();
  const markerTtl = Math.max(1, Math.ceil((resultExpiresAt(result.createdAt) - Date.now()) / 1000));
  const args = [month, String(markerTtl), ...Object.entries(increments).flatMap(([field, value]) => [field, String(value)])];
  const added = await client.eval<string[], number>(
    completionScript,
    [`${statsPrefix}:counted:${result.id}`, quizStatsMonthKey(month), quizStatsMonthsKey],
    args,
  );
  return added === 1;
}

export async function readMonthlyQuizStats(): Promise<MonthlyQuizStats[]> {
  if (!isProductionDeployment()) return [];
  const client = statsRedis();
  const months = (await client.smembers<string[]>(quizStatsMonthsKey)).sort().reverse();
  return Promise.all(months.map(async (month) => {
    const raw = await client.hgetall<Record<string, string | number>>(quizStatsMonthKey(month)) ?? {};
    return { month, counts: Object.fromEntries(Object.entries(raw).map(([field, value]) => [field, Number(value)])) };
  }));
}
