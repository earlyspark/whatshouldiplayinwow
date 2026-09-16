import { describe, expect, it } from "vitest";
import { classes, isValidCombination, raceById, races } from "@/data/forever";
import { questions } from "@/data/questions";
import { scoring } from "@/data/scoring-config";
import { normalizedRankFactors, scoreQuiz } from "@/lib/scoring";
import type { QuizAnswers } from "@/lib/result-schema";

const frontline: QuizAnswers = {
  q1: ["original-cata"],
  q2: ["horde"],
  q3: ["dungeons", "raids", "pvp"],
  q4: ["protect", "damage", "adapt"],
  q5: ["heavy-melee", "quick-melee", "adaptable"],
  q6: ["act-fast"],
  q7: ["none"],
  q8: ["small-group", "large-group", "open-world"],
  q9: ["martial", "wilds"],
  q10: ["endure"],
  q11: ["open-frontier"],
  q12: ["juggling"],
};

const backline: QuizAnswers = {
  q1: ["modern"],
  q2: ["alliance"],
  q3: ["raids", "dungeons", "pvp"],
  q4: ["damage", "control", "heal"],
  q5: ["ranged-magic", "ranged-companion"],
  q6: ["stick-plan"],
  q7: ["none"],
  q8: ["large-group", "small-group", "solo"],
  q9: ["arcane", "holy"],
  q10: ["finish"],
  q11: ["mountain-outposts"],
  q12: ["cornered"],
};

const neutralBase: QuizAnswers = {
  q1: ["original-cata"],
  q2: ["either"],
  q3: ["dungeons"],
  q4: ["damage"],
  q5: ["ranged-magic"],
  q6: ["improvise"],
  q7: ["optional"],
  q8: ["open-world"],
  q9: ["arcane"],
  q10: ["reposition"],
  q11: ["no-zone-preference"],
  q12: ["none"],
};

function persona(overrides: Partial<QuizAnswers>): QuizAnswers {
  return { ...neutralBase, ...overrides } as QuizAnswers;
}

const classPersonas: { name: string; classId: (typeof classes)[number]["id"]; answers: QuizAnswers }[] = [
  {
    name: "adaptive explorer",
    classId: "druid",
    answers: persona({ q3: ["exploration", "leveling", "dungeons"], q4: ["adapt", "heal", "protect"], q5: ["adaptable", "ranged-magic", "quick-melee"], q6: ["improvise"], q8: ["solo", "open-world", "small-group"], q9: ["wilds", "arcane"], q12: ["downtime"] }),
  },
  {
    name: "companion-oriented solo explorer",
    classId: "hunter",
    answers: persona({ q3: ["exploration", "leveling", "professions"], q4: ["damage", "control"], q5: ["ranged-companion"], q6: ["stick-plan"], q7: ["central"], q8: ["solo", "duo", "open-world"], q9: ["wilds", "martial"], q12: ["juggling"] }),
  },
  {
    name: "deliberate arcane controller",
    classId: "mage",
    answers: persona({ q3: ["pvp", "raids", "dungeons"], q4: ["control", "damage"], q5: ["ranged-magic"], q6: ["wait-opening"], q7: ["none"], q8: ["large-group", "small-group"], q9: ["arcane"], q12: ["prep"] }),
  },
  {
    name: "durable holy protector",
    classId: "paladin",
    answers: persona({ q2: ["alliance"], q3: ["dungeons", "raids", "leveling"], q4: ["protect", "heal", "adapt"], q5: ["heavy-melee", "adaptable"], q6: ["help-ally"], q7: ["none"], q8: ["small-group", "duo", "large-group"], q9: ["holy", "martial"], q11: ["woodland-mystery"], q12: ["juggling"] }),
  },
  {
    name: "backline group healer",
    classId: "priest",
    answers: persona({ q3: ["raids", "dungeons", "pvp"], q4: ["heal", "control", "adapt"], q5: ["ranged-magic"], q6: ["help-ally"], q7: ["none"], q8: ["large-group", "small-group", "duo"], q9: ["holy", "secrets"], q12: ["prep"] }),
  },
  {
    name: "fast stealth disruptor",
    classId: "rogue",
    answers: persona({ q3: ["pvp", "exploration", "dungeons"], q4: ["damage", "control"], q5: ["quick-melee"], q6: ["act-fast"], q7: ["none"], q8: ["solo", "open-world", "small-group"], q9: ["secrets", "martial"], q12: ["downtime"] }),
  },
  {
    name: "reactive elemental supporter",
    classId: "shaman",
    answers: persona({ q3: ["dungeons", "raids", "leveling"], q4: ["adapt", "heal", "control"], q5: ["adaptable", "ranged-magic", "heavy-melee"], q6: ["help-ally"], q7: ["none"], q8: ["small-group", "open-world", "duo"], q9: ["wilds", "arcane"], q12: ["prep"] }),
  },
  {
    name: "methodical summoned-power player",
    classId: "warlock",
    answers: persona({ q3: ["pvp", "raids", "leveling"], q4: ["damage", "control"], q5: ["ranged-companion", "ranged-magic"], q6: ["stick-plan"], q7: ["central"], q8: ["solo", "large-group", "duo"], q9: ["secrets", "arcane"], q12: ["juggling"] }),
  },
  {
    name: "decisive frontline martial player",
    classId: "warrior",
    answers: persona({ q3: ["dungeons", "raids", "pvp"], q4: ["protect", "damage"], q5: ["heavy-melee"], q6: ["act-fast"], q7: ["none"], q8: ["large-group", "small-group"], q9: ["martial"], q12: ["juggling"] }),
  },
];

const answersByClass = Object.fromEntries(classPersonas.map(({ classId, answers }) => [classId, answers])) as Record<(typeof classes)[number]["id"], QuizAnswers>;
const racePersonas: { name: string; raceId: (typeof races)[number]["id"]; answers: QuizAnswers }[] = [
  { name: "Human woodland starter", raceId: "human", answers: persona({ ...answersByClass.paladin, q1: ["original-cata"], q2: ["alliance"], q10: ["break-free"], q11: ["woodland-mystery"] }) },
  { name: "Dwarf mountain starter", raceId: "dwarf", answers: persona({ ...answersByClass.paladin, q1: ["original-cata"], q2: ["alliance"], q10: ["resource"], q11: ["mountain-outposts"] }) },
  { name: "Night Elf mystical woodland starter", raceId: "night-elf", answers: persona({ ...answersByClass.druid, q1: ["bfa-shadowlands"], q2: ["alliance"], q10: ["finish"], q11: ["woodland-mystery"] }) },
  { name: "Gnome mountain inventor", raceId: "gnome", answers: persona({ ...answersByClass.mage, q1: ["modern"], q2: ["alliance"], q10: ["resource"], q11: ["mountain-outposts"] }) },
  { name: "Orc frontier starter", raceId: "orc", answers: persona({ ...answersByClass.warrior, q1: ["original-cata"], q2: ["horde"], q10: ["finish"], q11: ["open-frontier"] }) },
  { name: "Undead eerie starter", raceId: "undead", answers: persona({ ...answersByClass.warlock, q1: ["original-cata"], q2: ["horde"], q10: ["break-free"], q11: ["woodland-mystery"] }) },
  { name: "Tauren open-sky starter", raceId: "tauren", answers: persona({ ...answersByClass.druid, q1: ["never"], q2: ["horde"], q10: ["resource"], q11: ["open-frontier"] }) },
  { name: "Troll frontier starter", raceId: "troll", answers: persona({ ...answersByClass.shaman, q1: ["original-cata"], q2: ["horde"], q10: ["recover"], q11: ["open-frontier"] }) },
  { name: "High Order Skyborne sky starter", raceId: "skyborne-alliance", answers: persona({ ...answersByClass.druid, q1: ["modern"], q2: ["alliance"], q10: ["reposition"], q11: ["open-frontier"] }) },
  { name: "Windshaper Skyborne sky starter", raceId: "skyborne-horde", answers: persona({ ...answersByClass.shaman, q1: ["modern"], q2: ["horde"], q3: ["raids"], q8: ["open-world"], q10: ["reposition"], q11: ["open-frontier"] }) },
];

describe("quiz definition", () => {
  it("contains twelve questions and five ranked questions", () => {
    expect(questions).toHaveLength(12);
    expect(questions.filter((question) => question.type === "ranked")).toHaveLength(5);
    expect(questions.find((question) => question.id === "q9")?.maxRank).toBe(2);
    expect(questions.find((question) => question.id === "q11")?.type).toBe("single");
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
  it("only recommends playable race and class combinations", () => {
    const result = scoreQuiz(frontline);
    for (const candidate of [result.primary, ...result.alternatives]) {
      expect(isValidCombination(candidate.raceId as keyof typeof raceById, candidate.classId as (typeof classes)[number]["id"])).toBe(true);
    }
  });

  it("favors the chosen faction when no starting-area atmosphere is preferred", () => {
    const alliance = scoreQuiz(persona({ q2: ["alliance"] }));
    const horde = scoreQuiz(persona({ q2: ["horde"] }));
    expect(raceById[alliance.primary.raceId as keyof typeof raceById].faction).toBe("alliance");
    expect(raceById[horde.primary.raceId as keyof typeof raceById].faction).toBe("horde");
  });

  it("maps each starting-area mood to multiple races across factions", () => {
    for (const option of questions.find((question) => question.id === "q11")!.options.filter((item) => item.id !== "no-zone-preference")) {
      const raceScores = scoring.q11[option.id].races ?? {};
      const favored = Object.keys(raceScores) as (keyof typeof raceById)[];
      expect(favored.length).toBeGreaterThanOrEqual(3);
      expect(new Set(favored.map((raceId) => raceById[raceId].faction)).size).toBe(2);
    }
  });

  it("distinguishes frontline and deliberate ranged preferences", () => {
    const frontResult = scoreQuiz(frontline);
    const backResult = scoreQuiz(backline);
    expect(["warrior", "paladin", "rogue", "shaman", "druid"]).toContain(frontResult.primary.classId);
    expect(["mage", "warlock", "priest", "hunter"]).toContain(backResult.primary.classId);
  });

  it("uses question 6 for decision style rather than repeating combat range", () => {
    expect(scoring.q6["act-fast"].classes?.mage).toBeGreaterThan(0);
    expect(scoring.q6["stick-plan"].classes?.warrior).toBeGreaterThan(0);
    expect(scoring.q6["help-ally"].classes?.priest).toBeGreaterThan(scoring.q6["act-fast"].classes?.priest ?? 0);
    expect(scoring.q6["wait-opening"].classes?.warlock).toBeGreaterThan(scoring.q6["act-fast"].classes?.warlock ?? 0);
  });

  it("keeps each character fantasy broad enough to fit multiple classes", () => {
    for (const option of questions.find((question) => question.id === "q9")!.options) {
      const fit = scoring.q9[option.id];
      expect(Object.values(fit.classes ?? {}).filter((value) => value >= 2).length).toBeGreaterThanOrEqual(2);
      expect(fit.races).toBeUndefined();
    }
  });

  it("scores each frustration without naming a class drawback", () => {
    for (const option of questions.find((question) => question.id === "q12")!.options) {
      expect(() => scoreQuiz(persona({ q12: [option.id] }))).not.toThrow();
    }
    expect(scoring.q12.downtime.races?.undead).toBeGreaterThan(0);
    expect(scoring.q12.cornered.races?.gnome).toBeGreaterThan(0);
    expect(scoring.q12.juggling.classes?.druid).toBeLessThan(0);
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

  it("can recommend a race across the faction preference", () => {
    const answers = persona({ ...answersByClass.warrior, q2: ["alliance"], q3: ["pvp"], q10: ["finish"], q11: ["open-frontier"] });
    expect(scoreQuiz(answers).primary.raceId).toBe("orc");
  });

  it("rejects repeated ranked answers", () => {
    const answers = persona({ q3: ["raids", "raids"] });
    expect(() => scoreQuiz(answers)).toThrow("duplicate answers");
  });

  it("rejects a third character fantasy while other ranked questions still allow three", () => {
    expect(() => scoreQuiz(persona({ q9: ["wilds", "arcane", "secrets"] }))).toThrow("q9 accepts up to 2 answers");
    expect(() => scoreQuiz(persona({ q3: ["raids", "dungeons", "pvp"] }))).not.toThrow();
  });

  it("rejects multiple starting atmospheres", () => {
    expect(() => scoreQuiz(persona({ q11: ["woodland-mystery", "open-frontier"] }))).toThrow("q11 accepts one answer");
  });
});
