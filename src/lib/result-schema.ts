import { z } from "zod";

export const answersSchema = z.record(
  z.string().regex(/^q\d+$/),
  z.array(z.string().min(1)).min(1).max(3),
);

export const racialTraitSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const candidateSnapshotSchema = z.object({
  raceId: z.string(),
  raceName: z.string(),
  classId: z.string(),
  className: z.string(),
  score: z.number(),
  verdict: z.string(),
  whyClass: z.string(),
  whyRace: z.string(),
  classTagline: z.string(),
  raceTagline: z.string(),
  racials: z.array(racialTraitSchema),
  tradeoff: z.string().optional(),
});

export const savedResultSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  quizVersion: z.string(),
  dataVersion: z.string(),
  dataCheckedAt: z.string(),
  dataCheckedLabel: z.string(),
  provisional: z.boolean(),
  createdAt: z.string(),
  answers: answersSchema,
  primary: candidateSnapshotSchema,
  alternatives: z.array(candidateSnapshotSchema).length(2),
  sources: z.array(z.object({ label: z.string(), url: z.string().url() })),
});

export type QuizAnswers = z.infer<typeof answersSchema>;
export type CandidateSnapshot = z.infer<typeof candidateSnapshotSchema>;
export type SavedResult = z.infer<typeof savedResultSchema>;
