import type { FeedbackPosition, FeedbackVote } from "@/lib/feedback-types";

export const versionFeedbackField = (version: string, position: FeedbackPosition, vote: FeedbackVote) =>
  `version:${version}:feedback:${position}:${vote}`;

export const versionClassFeedbackField = (version: string, classId: string, position: FeedbackPosition, vote: FeedbackVote) =>
  `version:${version}:feedback:class:${classId}:${position}:${vote}`;

export const versionPairedFeedbackField = (
  version: string,
  alternative: "runner-up-1" | "runner-up-2",
  primaryVote: FeedbackVote,
  alternativeVote: FeedbackVote,
) => `version:${version}:feedback:paired:${alternative}:${primaryVote}:${alternativeVote}`;
