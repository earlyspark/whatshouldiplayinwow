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

// Strongest bonus is 3.5 weighted points: below a full Q4 answer (6) and a direct fighting-style answer (9).
const q4CombinationBonuses: {
  choices: string[];
  anchors?: [string, string];
  label: string;
  classes: Partial<Record<ClassId, number>>;
}[] = [
  { choices: ["damage", "control"], label: "dealing damage while disrupting enemies", classes: { mage: 1 } },
  { choices: ["heal", "damage"], label: "healing while dealing damage", classes: { priest: 1.5, paladin: 0.5, shaman: 0.5, druid: 0.5 } },
  { choices: ["protect", "heal"], label: "protecting and healing allies", classes: { priest: 1.25, paladin: 0.5, druid: 0.5, shaman: 0.5 } },
  { choices: ["protect", "damage"], label: "protecting allies while dealing damage", classes: { warrior: 1, warlock: 0.75, hunter: 0.75, paladin: 0.25, druid: 0.25 } },
  { choices: ["protect", "damage", "control"], anchors: ["protect", "damage"], label: "protecting, damaging, and disrupting enemies", classes: { warlock: 1.75, hunter: 0.75, priest: 0.5, druid: 0.5, warrior: 0.25 } },
  { choices: ["protect", "damage", "adapt"], anchors: ["protect", "damage"], label: "protecting, damaging, and changing roles", classes: { druid: 1.5, paladin: 1.25, shaman: 1.25, priest: 0.5, warrior: 0.5 } },
];

interface ScoreSignal {
  questionId: QuestionId;
  optionId: string;
  value: number;
  label?: string;
}

interface CandidateScore {
  raceId: RaceId;
  classId: ClassId;
  score: number;
  classScore: number;
  raceScore: number;
  firstRankClassScore: number;
  firstRankRaceScore: number;
  tempoScore: number;
  classSignals: ScoreSignal[];
  raceSignals: ScoreSignal[];
}

export interface ScoredResult {
  primary: CandidateSnapshot;
  alternatives: [CandidateSnapshot, CandidateSnapshot];
}

const maxQ4CombinationBonus = Math.max(...q4CombinationBonuses.flatMap((combination) => Object.values(combination.classes)));
const classMaximum = Object.values(questionWeights).reduce((sum, weight) => sum + Math.max(weight.class, 0) * 3, 0)
  + maxQ4CombinationBonus * questionWeights.q4.class;
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
    .map((signal) => (signal.label ?? selectedLabel(signal.questionId, signal.optionId)).toLowerCase());

  if (!labels.length) return fallback;
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels[0]}, ${labels[1]}, and ${labels[2]}`;
}

export function q4CombinationBonus(classId: ClassId, rankedChoices: string[]) {
  const factors = normalizedRankFactors(rankedChoices.length);
  let best: { value: number; label: string; includesFirst: boolean } | undefined;
  for (const combination of q4CombinationBonuses) {
    const choiceRanks = combination.choices.map((choice) => rankedChoices.indexOf(choice));
    if (choiceRanks.some((rank) => rank < 0)) continue;
    const anchors = combination.anchors ?? [combination.choices[0], combination.choices[1]];
    const anchorRanks = anchors.map((choice) => rankedChoices.indexOf(choice));
    const anchorBaseline = combination.choices.length === 3 ? RANK_FACTORS[3][1] : RANK_FACTORS[2][1];
    const rankStrength = Math.min(...anchorRanks.map((rank) => factors[rank])) / anchorBaseline;
    const rawBonus = combination.classes[classId] ?? 0;
    const value = rawBonus * questionWeights.q4.class * rankStrength;
    if (value > (best?.value ?? 0)) {
      best = { value, label: combination.label, includesFirst: choiceRanks.includes(0) };
    }
  }
  return best;
}

export function validateAnswers(answers: QuizAnswers) {
  const knownIds = new Set<string>(questions.map((question) => question.id));
  if (Object.keys(answers).some((id) => !knownIds.has(id))) throw new Error("The quiz contains an invalid question.");
  for (const question of questions) {
    const chosen = answers[question.id];
    if (!chosen?.length) throw new Error(`Missing answer for ${question.id}.`);
    if (question.type === "single" && chosen.length !== 1) throw new Error(`${question.id} accepts one answer.`);
    if (question.type === "ranked" && chosen.length > (question.maxRank ?? 3)) {
      throw new Error(`${question.id} accepts up to ${question.maxRank ?? 3} answers.`);
    }
    if (question.id === "q12" && chosen.includes("none") && chosen.length > 1) {
      throw new Error("q12 cannot combine 'None of these' with other answers.");
    }
    if (new Set(chosen).size !== chosen.length) throw new Error(`${question.id} contains duplicate answers.`);
    const validIds = new Set(question.options.map((option) => option.id));
    if (chosen.some((id) => !validIds.has(id))) throw new Error(`${question.id} contains an invalid answer.`);
  }
}

function scoreCandidate(raceId: RaceId, classId: ClassId, answers: QuizAnswers): CandidateScore {
  let classScore = 0;
  let raceScore = 0;
  let firstRankClassScore = 0;
  let firstRankRaceScore = 0;
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
      const moodFactor = question.id === "q11" ? atmosphereWeight : 1;
      const classValue = (optionScore?.classes?.[classId] ?? 0) * questionWeights[question.id].class * factor * moodFactor;
      const raceValue = (optionScore?.races?.[raceId] ?? 0) * questionWeights[question.id].race * factor * moodFactor;
      classScore += classValue;
      raceScore += raceValue;
      classSignals.push({ questionId: question.id, optionId, value: classValue });
      raceSignals.push({ questionId: question.id, optionId, value: raceValue });
      if (index === 0 && question.type === "ranked") {
        firstRankClassScore += classValue;
        firstRankRaceScore += raceValue;
      }
      if (question.id === "q6") tempoScore += classValue;
    });
  }

  const bestCombination = q4CombinationBonus(classId, answers.q4);
  // Use the strongest matching combination rather than stacking overlaps.
  if (bestCombination) {
    classScore += bestCombination.value;
    if (bestCombination.includesFirst) firstRankClassScore += bestCombination.value;
    classSignals.push({ questionId: "q4", optionId: "combination", label: bestCombination.label, value: bestCombination.value });
  }

  const normalizedClass = Math.max(0, classScore) / classMaximum;
  const normalizedRace = Math.max(0, raceScore) / raceMaximum;
  return {
    raceId,
    classId,
    score: normalizedClass * 0.65 + normalizedRace * 0.35,
    classScore,
    raceScore,
    firstRankClassScore,
    firstRankRaceScore,
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
  // Select a class before a race. Race preferences cannot turn a stronger
  // class match into a different class recommendation.
  candidates.sort((a, b) =>
    b.classScore - a.classScore ||
    b.firstRankClassScore - a.firstRankClassScore ||
    b.tempoScore - a.tempoScore ||
    (classOrder.get(a.classId) ?? 0) - (classOrder.get(b.classId) ?? 0) ||
    b.raceScore - a.raceScore ||
    b.firstRankRaceScore - a.firstRankRaceScore ||
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
