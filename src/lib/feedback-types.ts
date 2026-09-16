import { z } from "zod";

export const feedbackPositionSchema = z.enum(["primary", "runner-up-1", "runner-up-2"]);
export const feedbackVoteSchema = z.enum(["up", "down"]);
export const feedbackRequestSchema = z.strictObject({
  position: feedbackPositionSchema,
  vote: feedbackVoteSchema,
});

export type FeedbackPosition = z.infer<typeof feedbackPositionSchema>;
export type FeedbackVote = z.infer<typeof feedbackVoteSchema>;
export type ResultVotes = Record<FeedbackPosition, FeedbackVote | null>;

export const feedbackPositions = feedbackPositionSchema.options;

export function emptyResultVotes(): ResultVotes {
  return { primary: null, "runner-up-1": null, "runner-up-2": null };
}
