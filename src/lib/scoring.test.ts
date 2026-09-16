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

const neutralBase: QuizAnswers = {
  q1: ["many-eras"],
  q2: ["either"],
  q3: ["dungeons"],
  q4: ["damage"],
  q5: ["ranged-magic"],
  q6: ["shift"],
  q7: ["optional"],
  q8: ["open-world"],
  q9: ["arcane"],
  q10: ["reposition"],
  q11: ["no-race-preference"],
  q12: ["none"],
};

function persona(overrides: Partial<QuizAnswers>): QuizAnswers {
  return { ...neutralBase, ...overrides } as QuizAnswers;
}

const classPersonas: { name: string; classId: (typeof classes)[number]["id"]; answers: QuizAnswers }[] = [
  {
    name: "adaptive explorer",
    classId: "druid",
    answers: persona({ q3: ["exploration", "leveling", "dungeons"], q4: ["adapt", "heal", "protect"], q5: ["adaptable", "ranged-magic", "quick-melee"], q6: ["shift"], q8: ["solo", "open-world", "small-group"], q9: ["nature", "elements", "ranger"], q12: ["casting"] }),
  },
  {
    name: "companion-oriented solo explorer",
    classId: "hunter",
    answers: persona({ q3: ["exploration", "leveling", "professions"], q4: ["damage", "control"], q5: ["ranged-companion"], q6: ["backline"], q7: ["central"], q8: ["solo", "duo", "open-world"], q9: ["ranger", "nature"], q12: ["melee"] }),
  },
  {
    name: "deliberate arcane controller",
    classId: "mage",
    answers: persona({ q3: ["pvp", "raids", "dungeons"], q4: ["control", "damage"], q5: ["ranged-magic"], q6: ["backline"], q7: ["none"], q8: ["large-group", "small-group"], q9: ["arcane"], q12: ["melee"] }),
  },
  {
    name: "durable holy protector",
    classId: "paladin",
    answers: persona({ q2: ["alliance"], q3: ["dungeons", "raids", "leveling"], q4: ["protect", "heal", "adapt"], q5: ["heavy-melee", "adaptable"], q6: ["measured-close"], q7: ["none"], q8: ["small-group", "duo", "large-group"], q9: ["holy", "martial"], q11: ["human", "dwarf"], q12: ["companion"] }),
  },
  {
    name: "backline group healer",
    classId: "priest",
    answers: persona({ q3: ["raids", "dungeons", "pvp"], q4: ["heal", "control", "adapt"], q5: ["ranged-magic"], q6: ["second-line"], q7: ["none"], q8: ["large-group", "small-group", "duo"], q9: ["holy", "shadow"], q12: ["melee"] }),
  },
  {
    name: "fast stealth disruptor",
    classId: "rogue",
    answers: persona({ q3: ["pvp", "exploration", "dungeons"], q4: ["damage", "control"], q5: ["quick-melee"], q6: ["dive"], q7: ["none"], q8: ["solo", "open-world", "small-group"], q9: ["stealth", "martial"], q12: ["casting"] }),
  },
  {
    name: "reactive elemental supporter",
    classId: "shaman",
    answers: persona({ q3: ["dungeons", "raids", "leveling"], q4: ["adapt", "heal", "control"], q5: ["adaptable", "ranged-magic", "heavy-melee"], q6: ["second-line"], q7: ["none"], q8: ["small-group", "open-world", "duo"], q9: ["elements", "nature"], q12: ["setup"] }),
  },
  {
    name: "methodical summoned-power player",
    classId: "warlock",
    answers: persona({ q3: ["pvp", "raids", "leveling"], q4: ["damage", "control"], q5: ["ranged-companion", "ranged-magic"], q6: ["backline"], q7: ["central"], q8: ["solo", "large-group", "duo"], q9: ["shadow", "arcane"], q12: ["melee"] }),
  },
  {
    name: "decisive frontline martial player",
    classId: "warrior",
    answers: persona({ q3: ["dungeons", "raids", "pvp"], q4: ["protect", "damage"], q5: ["heavy-melee"], q6: ["dive"], q7: ["none"], q8: ["large-group", "small-group"], q9: ["martial"], q12: ["casting"] }),
  },
];

const answersByClass = Object.fromEntries(classPersonas.map(({ classId, answers }) => [classId, answers])) as Record<(typeof classes)[number]["id"], QuizAnswers>;
const racePersonas: { name: string; raceId: (typeof races)[number]["id"]; answers: QuizAnswers }[] = [
  { name: "Human loyalist", raceId: "human", answers: persona({ ...answersByClass.paladin, q1: ["original-cata"], q2: ["alliance"], q10: ["break-free"], q11: ["human"] }) },
  { name: "Dwarf traditionalist", raceId: "dwarf", answers: persona({ ...answersByClass.paladin, q1: ["many-eras"], q2: ["alliance"], q10: ["resource"], q11: ["dwarf"] }) },
  { name: "Night Elf naturalist", raceId: "night-elf", answers: persona({ ...answersByClass.druid, q1: ["bfa-shadowlands"], q2: ["alliance"], q10: ["finish"], q11: ["night-elf"] }) },
  { name: "Gnome inventor", raceId: "gnome", answers: persona({ ...answersByClass.mage, q1: ["modern"], q2: ["alliance"], q10: ["resource"], q11: ["gnome"] }) },
  { name: "Orc aggressor", raceId: "orc", answers: persona({ ...answersByClass.warrior, q1: ["original-cata"], q2: ["horde"], q10: ["finish"], q11: ["orc"] }) },
  { name: "Undead survivor", raceId: "undead", answers: persona({ ...answersByClass.warlock, q1: ["original-cata"], q2: ["horde"], q10: ["break-free"], q11: ["undead"] }) },
  { name: "Tauren gatherer", raceId: "tauren", answers: persona({ ...answersByClass.druid, q1: ["never"], q2: ["horde"], q10: ["resource"], q11: ["tauren"] }) },
  { name: "Troll regenerator", raceId: "troll", answers: persona({ ...answersByClass.shaman, q1: ["original-cata"], q2: ["horde"], q10: ["recover"], q11: ["troll"] }) },
  { name: "High Order Skyborne explorer", raceId: "skyborne-alliance", answers: persona({ ...answersByClass.druid, q1: ["modern"], q2: ["alliance"], q10: ["reposition"], q11: ["skyborne"] }) },
  { name: "Windshaper Skyborne explorer", raceId: "skyborne-horde", answers: persona({ ...answersByClass.shaman, q1: ["modern"], q2: ["horde"], q10: ["reposition"], q11: ["skyborne"] }) },
];

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

  it.each(classPersonas)("makes the $name persona a $classId", ({ classId, answers }) => {
    expect(scoreQuiz(answers).primary.classId).toBe(classId);
  });

  it.each(racePersonas)("makes the $name persona a $raceId", ({ raceId, answers }) => {
    expect(scoreQuiz(answers).primary.raceId).toBe(raceId);
  });

  it("rejects a ranked race that conflicts with the selected faction", () => {
    const answers = persona({ q2: ["alliance"], q11: ["orc"] });
    expect(() => scoreQuiz(answers)).toThrow("conflicts with the selected faction");
  });

  it("rejects repeated ranked answers", () => {
    const answers = persona({ q3: ["raids", "raids"] });
    expect(() => scoreQuiz(answers)).toThrow("duplicate answers");
  });
});
