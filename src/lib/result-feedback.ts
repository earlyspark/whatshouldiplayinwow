import { Redis } from "@upstash/redis";
import { feedbackPositions, type FeedbackPosition, type FeedbackVote, type ResultVotes, emptyResultVotes } from "@/lib/feedback-types";
import { quizStatsMonthKey, quizStatsMonthsKey } from "@/lib/quiz-stats";
import { redisConfig } from "@/lib/redis-config";
import { resultExpiresAt } from "@/lib/result-retention";
import type { SavedResult } from "@/lib/result-schema";

const prefix = "wow-forever:result-feedback:v1";
const voteScript = `
  local previous = redis.call("HGET", KEYS[1], ARGV[1])
  if previous == ARGV[2] then return 0 end
  if previous then
    redis.call("HINCRBY", KEYS[2], "feedback:" .. ARGV[1] .. ":" .. previous, -1)
  end
  redis.call("HSET", KEYS[1], ARGV[1], ARGV[2])
  redis.call("EXPIREAT", KEYS[1], tonumber(ARGV[3]))
  redis.call("HINCRBY", KEYS[2], "feedback:" .. ARGV[1] .. ":" .. ARGV[2], 1)
  redis.call("SADD", KEYS[3], ARGV[4])
  return 1
`;
const previewVoteScript = `
  local previous = redis.call("HGET", KEYS[1], ARGV[1])
  if previous == ARGV[2] then return 0 end
  redis.call("HSET", KEYS[1], ARGV[1], ARGV[2])
  redis.call("EXPIREAT", KEYS[1], tonumber(ARGV[3]))
  return 1
`;

declare global {
  var __wowForeverFeedback: Map<string, ResultVotes> | undefined;
}

const memory = globalThis.__wowForeverFeedback ?? new Map<string, ResultVotes>();
if (process.env.NODE_ENV !== "production") globalThis.__wowForeverFeedback = memory;

function isProductionDeployment() {
  return process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
}

function isPreviewDeployment() {
  return process.env.VERCEL === "1" && process.env.VERCEL_ENV === "preview";
}

function feedbackRedis() {
  const config = redisConfig();
  if (!config) throw new Error("Feedback storage is not configured.");
  return new Redis(config);
}

function feedbackKey(id: string) {
  return `${prefix}:${isPreviewDeployment() ? "preview:" : ""}result:${id}`;
}

export async function readResultVotes(result: SavedResult): Promise<ResultVotes> {
  if (!isProductionDeployment() && !isPreviewDeployment()) return { ...emptyResultVotes(), ...memory.get(result.id) };
  const raw = await feedbackRedis().hgetall<Record<string, string>>(feedbackKey(result.id)) ?? {};
  const votes = emptyResultVotes();
  for (const position of feedbackPositions) {
    if (raw[position] === "up" || raw[position] === "down") votes[position] = raw[position];
  }
  return votes;
}

export async function saveResultVote(result: SavedResult, position: FeedbackPosition, vote: FeedbackVote): Promise<boolean> {
  if (!isProductionDeployment() && !isPreviewDeployment()) {
    const votes = { ...emptyResultVotes(), ...memory.get(result.id) };
    if (votes[position] === vote) return false;
    votes[position] = vote;
    memory.set(result.id, votes);
    return true;
  }
  const expiry = resultExpiresAt(result.createdAt);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) throw new Error("Result has expired.");
  if (isPreviewDeployment()) {
    const changed = await feedbackRedis().eval<string[], number>(
      previewVoteScript,
      [feedbackKey(result.id)],
      [position, vote, String(Math.ceil(expiry / 1000))],
    );
    return changed === 1;
  }
  const month = result.createdAt.slice(0, 7);
  const changed = await feedbackRedis().eval<string[], number>(
    voteScript,
    [feedbackKey(result.id), quizStatsMonthKey(month), quizStatsMonthsKey],
    [position, vote, String(Math.ceil(expiry / 1000)), month],
  );
  return changed === 1;
}
