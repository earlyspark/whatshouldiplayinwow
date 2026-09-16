import {
  DATA_CHECKED_AT,
  DATA_CHECKED_LABEL,
  DATA_SOURCES,
  DATA_VERSION,
  classById,
  classes,
  raceById,
  races,
  type ClassId,
  type RaceId,
} from "@/data/forever";
import { questionById, questions, QUIZ_VERSION, type QuestionId } from "@/data/questions";
import { questionWeights, scoring } from "@/data/scoring-config";
import type { CandidateSnapshot, QuizAnswers, SavedResult } from "@/lib/result-schema";

const RANK_FACTORS: Record<number, number[]> = {
  1: [1],
  2: [5 / 8, 3 / 8],
  3: [5 / 9, 3 / 9, 1 / 9],
};

interface CandidateScore {
  raceId: RaceId;
  classId: ClassId;
  score: number;
  classScore: number;
  raceScore: number;
  firstRankScore: number;
  tempoScore: number;
  classSignals: { questionId: QuestionId; optionId: string; value: number }[];
  raceSignals: { questionId: QuestionId; optionId: string; value: number }[];
}

export interface ScoredResult {
  primary: CandidateSnapshot;
  alternatives: [CandidateSnapshot, CandidateSnapshot];
}

const classMaximum = Object.values(questionWeights).reduce((sum, weight) => sum + Math.max(weight.class, 0) * 3, 0);
const raceMaximum = Object.values(questionWeights).reduce((sum, weight) => sum + Math.max(weight.race, 0) * 3, 0);

export function normalizedRankFactors(count: number) {
  return RANK_FACTORS[Math.min(Math.max(count, 1), 3)];
}

function selectedLabel(questionId: QuestionId, optionId: string) {
  return questionById[questionId]?.options.find((option) => option.id === optionId)?.label ?? optionId;
}

function joinSignals(signals: CandidateScore["classSignals"] | CandidateScore["raceSignals"], fallback: string) {
  const labels = signals
    .filter((signal) => signal.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((signal) => selectedLabel(signal.questionId, signal.optionId).toLowerCase());

  if (!labels.length) return fallback;
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels[0]}, ${labels[1]}, and ${labels[2]}`;
}

export function validateAnswers(answers: QuizAnswers) {
  for (const question of questions) {
    const chosen = answers[question.id];
    if (!chosen?.length) throw new Error(`Missing answer for ${question.id}.`);
    if (question.type === "single" && chosen.length !== 1) throw new Error(`${question.id} accepts one answer.`);
    if (question.type === "ranked" && chosen.length > (question.maxRank ?? 3)) {
      throw new Error(`${question.id} accepts up to ${question.maxRank ?? 3} answers.`);
    }
    if (new Set(chosen).size !== chosen.length) throw new Error(`${question.id} contains duplicate answers.`);
    const validIds = new Set(question.options.map((option) => option.id));
    if (chosen.some((id) => !validIds.has(id))) throw new Error(`${question.id} contains an invalid answer.`);
  }
}

function scoreCandidate(raceId: RaceId, classId: ClassId, answers: QuizAnswers): CandidateScore {
  let classScore = 0;
  let raceScore = 0;
  let firstRankScore = 0;
  let tempoScore = 0;
  const classSignals: CandidateScore["classSignals"] = [];
  const raceSignals: CandidateScore["raceSignals"] = [];
  const vibesRank = answers.q3.indexOf("vibes");
  // Give a player who prioritizes community/atmosphere more say in their
  // preferred starting-zone mood, without assigning a "better" faction.
  const atmosphereWeight = vibesRank === 0 ? 1.5 : vibesRank === 1 ? 1.3 : vibesRank === 2 ? 1.15 : 1;

  for (const question of questions) {
    const selections = answers[question.id];
    const factors = normalizedRankFactors(selections.length);
    selections.forEach((optionId, index) => {
      const optionScore = scoring[question.id]?.[optionId];
      const factor = question.type === "ranked" ? factors[index] : 1;
      const classValue = (optionScore?.classes?.[classId] ?? 0) * questionWeights[question.id].class * factor;
      const raceValue = (optionScore?.races?.[raceId] ?? 0) * questionWeights[question.id].race * factor * (question.id === "q11" ? atmosphereWeight : 1);
      classScore += classValue;
      raceScore += raceValue;
      classSignals.push({ questionId: question.id, optionId, value: classValue });
      raceSignals.push({ questionId: question.id, optionId, value: raceValue });
      if (index === 0 && question.type === "ranked") firstRankScore += classValue * 0.65 + raceValue * 0.35;
      if (question.id === "q6") tempoScore += classValue;
    });
  }

  const normalizedClass = Math.max(0, classScore) / classMaximum;
  const normalizedRace = Math.max(0, raceScore) / raceMaximum;
  return {
    raceId,
    classId,
    score: normalizedClass * 0.65 + normalizedRace * 0.35,
    classScore,
    raceScore,
    firstRankScore,
    tempoScore,
    classSignals,
    raceSignals,
  };
}

function snapshot(candidate: CandidateScore, primary?: CandidateScore): CandidateSnapshot {
  const classProfile = classById[candidate.classId];
  const raceProfile = raceById[candidate.raceId];
  const classEvidence = joinSignals(candidate.classSignals, "your overall playstyle");
  const raceEvidence = joinSignals(candidate.raceSignals, "your identity and utility preferences");
  const sameClass = primary?.classId === candidate.classId;

  return {
    raceId: raceProfile.id,
    raceName: raceProfile.name,
    classId: classProfile.id,
    className: classProfile.name,
    score: Number(candidate.score.toFixed(6)),
    verdict: `${raceProfile.name} ${classProfile.name} best balances ${classProfile.tagline} with ${raceProfile.tagline}.`,
    whyClass: `Your preference for ${classEvidence} points toward ${classProfile.name}. ${classProfile.summary}`,
    whyRace: `Your answers around ${raceEvidence} make ${raceProfile.name} a strong fit. ${raceProfile.summary}`,
    classTagline: classProfile.tagline,
    raceTagline: raceProfile.tagline,
    racials: raceProfile.racials,
    tradeoff: primary
      ? sameClass
        ? `Keeps the ${classProfile.name} playstyle, but trades ${raceById[primary.raceId].tagline} for ${raceProfile.tagline}.`
        : `A strong alternative if you want more ${classProfile.tagline}, paired with ${raceProfile.tagline}.`
      : undefined,
  };
}

export function scoreQuiz(answers: QuizAnswers): ScoredResult {
  validateAnswers(answers);
  const candidates: CandidateScore[] = [];

  for (const race of races) {
    for (const classId of race.classes) candidates.push(scoreCandidate(race.id, classId, answers));
  }

  const classOrder = new Map(classes.map((item, index) => [item.id, index]));
  const raceOrder = new Map(races.map((item, index) => [item.id, index]));
  candidates.sort((a, b) =>
    b.score - a.score ||
    b.firstRankScore - a.firstRankScore ||
    b.tempoScore - a.tempoScore ||
    (classOrder.get(a.classId) ?? 0) - (classOrder.get(b.classId) ?? 0) ||
    (raceOrder.get(a.raceId) ?? 0) - (raceOrder.get(b.raceId) ?? 0),
  );

  const primary = candidates[0];
  const sameClassAlternative = candidates.find((item) => item.classId === primary.classId && item.raceId !== primary.raceId);
  const differentClassAlternative = candidates.find((item) => item.classId !== primary.classId);
  if (!sameClassAlternative || !differentClassAlternative) throw new Error("Could not determine two alternatives.");

  return {
    primary: snapshot(primary),
    alternatives: [snapshot(sameClassAlternative, primary), snapshot(differentClassAlternative, primary)],
  };
}

export function createSavedResult(id: string, answers: QuizAnswers): SavedResult {
  const result = scoreQuiz(answers);
  return {
    schemaVersion: 1,
    id,
    quizVersion: QUIZ_VERSION,
    dataVersion: DATA_VERSION,
    dataCheckedAt: DATA_CHECKED_AT,
    dataCheckedLabel: DATA_CHECKED_LABEL,
    provisional: true,
    createdAt: new Date().toISOString(),
    answers,
    primary: result.primary,
    alternatives: result.alternatives,
    sources: DATA_SOURCES.map((source) => ({ ...source })),
  };
}
