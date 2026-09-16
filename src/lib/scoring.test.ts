import { describe, expect, it } from "vitest";
import { classes, isValidCombination, raceById, races } from "@/data/forever";
import { questions } from "@/data/questions";
import { normalizedRankFactors, scoreQuiz } from "@/lib/scoring";
import type { QuizAnswers } from "@/lib/result-schema";

const frontline: QuizAnswers = {
  q1: ["original-cata"],
  q2: ["horde"],
  q3: ["dungeons", "raids", "pvp"],
  q4: ["protect", "damage", "adapt"],
  q5: ["heavy-melee", "quick-melee", "adaptable"],
  q6: ["dive"],
  q7: ["none"],
  q8: ["small-group", "large-group", "open-world"],
  q9: ["martial", "elements", "nature"],
  q10: ["endure"],
  q11: ["orc", "tauren", "troll"],
  q12: ["casting"],
};

const backline: QuizAnswers = {
  q1: ["modern"],
  q2: ["alliance"],
  q3: ["raids", "dungeons", "pvp"],
  q4: ["damage", "control", "heal"],
  q5: ["ranged-magic", "ranged-companion"],
  q6: ["backline"],
  q7: ["none"],
  q8: ["large-group", "small-group", "solo"],
  q9: ["arcane", "holy", "shadow"],
  q10: ["finish"],
  q11: ["gnome", "human", "skyborne"],
  q12: ["melee"],
};

describe("quiz definition", () => {
  it("contains twelve questions and six ranked questions", () => {
    expect(questions).toHaveLength(12);
    expect(questions.filter((question) => question.type === "ranked")).toHaveLength(6);
  });

  it("normalizes ranked influence", () => {
    for (const count of [1, 2, 3]) {
      expect(normalizedRankFactors(count).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
    }
    expect(normalizedRankFactors(3)[0]).toBeGreaterThan(normalizedRankFactors(3)[1]);
    expect(normalizedRankFactors(3)[1]).toBeGreaterThan(normalizedRankFactors(3)[2]);
  });
});

describe("scoring", () => {
  it("respects the selected faction and valid combinations", () => {
    const result = scoreQuiz(frontline);
    for (const candidate of [result.primary, ...result.alternatives]) {
      expect(raceById[candidate.raceId as keyof typeof raceById].faction).toBe("horde");
      expect(isValidCombination(candidate.raceId as keyof typeof raceById, candidate.classId as (typeof classes)[number]["id"])).toBe(true);
    }
  });

  it("distinguishes frontline and deliberate backline preferences", () => {
    const frontResult = scoreQuiz(frontline);
    const backResult = scoreQuiz(backline);
    expect(["warrior", "paladin", "rogue", "shaman", "druid"]).toContain(frontResult.primary.classId);
    expect(["mage", "warlock", "priest", "hunter"]).toContain(backResult.primary.classId);
  });

  it("returns one same-class race alternative and one different class", () => {
    const result = scoreQuiz(backline);
    expect(result.alternatives[0].classId).toBe(result.primary.classId);
    expect(result.alternatives[0].raceId).not.toBe(result.primary.raceId);
    expect(result.alternatives[1].classId).not.toBe(result.primary.classId);
  });

  it("keeps every configured race and class represented in the valid pool", () => {
    const pool = races.flatMap((race) => race.classes.map((classId) => `${race.id}:${classId}`));
    for (const race of races) expect(pool.some((item) => item.startsWith(`${race.id}:`))).toBe(true);
    for (const profile of classes) expect(pool.some((item) => item.endsWith(`:${profile.id}`))).toBe(true);
  });
});
