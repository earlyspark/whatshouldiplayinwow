import { Redis } from "@upstash/redis";
import { questions } from "@/data/questions";
import { redisConfig } from "@/lib/redis-config";
import type { SavedResult } from "@/lib/result-schema";

export interface MonthlyQuizStats {
  month: string;
  counts: Record<string, number>;
}

const statsPrefix = "wow-forever:quiz-stats:v1";
const completionScript = `
  if redis.call("EXISTS", KEYS[1]) == 1 then return 0 end
  redis.call("SET", KEYS[1], "1")
  for i = 2, #ARGV, 2 do
    redis.call("HINCRBY", KEYS[2], ARGV[i], tonumber(ARGV[i + 1]))
  end
  redis.call("SADD", KEYS[3], ARGV[1])
  return 1
`;

function isProductionDeployment() {
  return process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
}

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
  const args = [month, ...Object.entries(increments).flatMap(([field, value]) => [field, String(value)])];
  const added = await client.eval<string[], number>(
    completionScript,
    [`${statsPrefix}:counted:${result.id}`, `${statsPrefix}:month:${month}`, `${statsPrefix}:months`],
    args,
  );
  return added === 1;
}

export async function readMonthlyQuizStats(): Promise<MonthlyQuizStats[]> {
  if (!isProductionDeployment()) return [];
  const client = statsRedis();
  const months = (await client.smembers<string[]>(`${statsPrefix}:months`)).sort().reverse();
  return Promise.all(months.map(async (month) => {
    const raw = await client.hgetall<Record<string, string | number>>(`${statsPrefix}:month:${month}`) ?? {};
    return { month, counts: Object.fromEntries(Object.entries(raw).map(([field, value]) => [field, Number(value)])) };
  }));
}
