import { describe, expect, it } from "vitest";
import { classes, isValidCombination, raceById, races, type ClassId } from "@/data/forever";
import { questions, QUIZ_VERSION } from "@/data/questions";
import { questionWeights, scoring } from "@/data/scoring-config";
import { normalizedRankFactors, q4CombinationBonus, scoreQuiz } from "@/lib/scoring";
import type { QuizAnswers } from "@/lib/result-schema";

const frontline: QuizAnswers = {
  q1: ["vanilla-wrath"],
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
  q13: ["focused"],
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
  q13: ["focused"],
};

const neutralBase: QuizAnswers = {
  q1: ["vanilla-wrath"],
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
  q13: ["either"],
};

function persona(overrides: Partial<QuizAnswers>): QuizAnswers {
  return { ...neutralBase, ...overrides } as QuizAnswers;
}

function groupContributionScore(classId: ClassId, picks: string[]) {
  const factors = normalizedRankFactors(picks.length);
  const answers = picks.reduce((total, option, index) =>
    total + (scoring.q4[option].classes?.[classId] ?? 0) * factors[index] * questionWeights.q4.class, 0);
  return answers + (q4CombinationBonus(classId, picks)?.value ?? 0);
}

const classPersonas: { name: string; classId: (typeof classes)[number]["id"]; answers: QuizAnswers }[] = [
  {
    name: "adaptive explorer",
    classId: "druid",
    answers: persona({ q3: ["exploration", "leveling", "dungeons"], q4: ["adapt", "heal", "protect"], q5: ["adaptable", "ranged-magic", "quick-melee"], q6: ["improvise"], q8: ["solo", "open-world", "small-group"], q9: ["wilds", "arcane"], q12: ["downtime"], q13: ["flexible"] }),
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
    answers: persona({ q2: ["alliance"], q3: ["dungeons", "raids", "leveling"], q4: ["protect", "heal", "adapt"], q5: ["heavy-melee", "adaptable"], q6: ["help-ally"], q7: ["none"], q8: ["small-group", "duo", "large-group"], q9: ["holy", "martial"], q11: ["woodland-mystery"], q12: ["juggling"], q13: ["flexible"] }),
  },
  {
    name: "backline group healer",
    classId: "priest",
    answers: persona({ q3: ["raids", "dungeons", "pvp"], q4: ["heal", "control", "adapt"], q5: ["ranged-magic"], q6: ["help-ally"], q7: ["none"], q8: ["large-group", "small-group", "duo"], q9: ["holy", "secrets"], q12: ["prep"], q13: ["flexible"] }),
  },
  {
    name: "fast stealth disruptor",
    classId: "rogue",
    answers: persona({ q3: ["pvp", "exploration", "dungeons"], q4: ["damage", "control"], q5: ["quick-melee"], q6: ["act-fast"], q7: ["none"], q8: ["solo", "open-world", "small-group"], q9: ["secrets", "martial"], q12: ["downtime"] }),
  },
  {
    name: "reactive elemental supporter",
    classId: "shaman",
    answers: persona({ q3: ["dungeons", "raids", "leveling"], q4: ["adapt", "heal", "control"], q5: ["adaptable", "ranged-magic", "heavy-melee"], q6: ["help-ally"], q7: ["none"], q8: ["small-group", "open-world", "duo"], q9: ["wilds", "arcane"], q12: ["prep"], q13: ["flexible"] }),
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
  { name: "Human woodland starter", raceId: "human", answers: persona({ ...answersByClass.paladin, q1: ["vanilla-wrath"], q2: ["alliance"], q10: ["break-free"], q11: ["woodland-mystery"] }) },
  { name: "Dwarf mountain starter", raceId: "dwarf", answers: persona({ ...answersByClass.paladin, q1: ["vanilla-wrath"], q2: ["alliance"], q10: ["resource"], q11: ["mountain-outposts"] }) },
  { name: "Night Elf mystical woodland starter", raceId: "night-elf", answers: persona({ ...answersByClass.druid, q1: ["bfa-shadowlands"], q2: ["alliance"], q10: ["finish"], q11: ["woodland-mystery"] }) },
  { name: "Gnome mountain inventor", raceId: "gnome", answers: persona({ ...answersByClass.mage, q1: ["modern"], q2: ["alliance"], q10: ["resource"], q11: ["mountain-outposts"] }) },
  { name: "Orc frontier starter", raceId: "orc", answers: persona({ ...answersByClass.warrior, q1: ["vanilla-wrath"], q2: ["horde"], q10: ["finish"], q11: ["open-frontier"] }) },
  { name: "Undead eerie starter", raceId: "undead", answers: persona({ ...answersByClass.warlock, q1: ["vanilla-wrath"], q2: ["horde"], q10: ["break-free"], q11: ["haunted-glades"] }) },
  { name: "Tauren open-sky starter", raceId: "tauren", answers: persona({ ...answersByClass.druid, q1: ["never"], q2: ["horde"], q10: ["resource"], q11: ["open-frontier"] }) },
  { name: "Troll frontier starter", raceId: "troll", answers: persona({ ...answersByClass.shaman, q1: ["vanilla-wrath"], q2: ["horde"], q10: ["recover"], q11: ["open-frontier"] }) },
  { name: "High Order Skyborne sky starter", raceId: "skyborne-alliance", answers: persona({ ...answersByClass.druid, q1: ["modern"], q2: ["alliance"], q10: ["reposition"], q11: ["open-frontier"] }) },
  { name: "Windshaper Skyborne sky starter", raceId: "skyborne-horde", answers: persona({ ...answersByClass.shaman, q1: ["modern"], q2: ["horde"], q3: ["raids"], q8: ["open-world"], q10: ["reposition"], q11: ["open-frontier"] }) },
];

describe("quiz definition", () => {
  it("places Cataclysm in the second era and keeps era a light class cue", () => {
    const [classic, later] = questions[0].options;
    expect(classic.id).toBe("vanilla-wrath");
    expect(classic.description).toContain("Wrath of the Lich King");
    expect(classic.description).not.toContain("Cataclysm");
    expect(later.id).toBe("cata-legion");
    expect(later.description).toContain("Cataclysm");
    expect(later.description).toContain("Legion");
    expect(questionWeights.q1.class).toBeLessThan(questionWeights.q3.class);
    expect(questionWeights.q1.race).toBeLessThan(questionWeights.q2.race);
    expect(() => scoreQuiz(persona({ q1: ["original-cata"] }))).toThrow("invalid answer");
  });

  it("contains thirteen questions and six ranked questions", () => {
    expect(questions).toHaveLength(13);
    expect(questions.filter((question) => question.type === "ranked")).toHaveLength(6);
    expect(questions.find((question) => question.id === "q9")?.maxRank).toBe(2);
    expect(questions.find((question) => question.id === "q11")?.type).toBe("single");
    expect(questions.find((question) => question.id === "q12")?.type).toBe("ranked");
    expect(questions.at(-1)?.id).toBe("q13");
    expect(questions.at(-1)?.type).toBe("single");
  });

  it("contrasts saved cooldown windows with sustained ability use without changing Q6 scoring", () => {
    const q6 = questions.find((question) => question.id === "q6")!;
    expect(QUIZ_VERSION).toBe("1.20.0");
    expect(q6.options.find((option) => option.id === "wait-opening")?.label).toBe("Hold my big cooldowns for an opening");
    expect(q6.options.find((option) => option.id === "stick-plan")?.label).toBe("Keep my core abilities rolling through the chaos");
    expect(q6.options.find((option) => option.id === "stick-plan")?.description).toContain("damage, healing, or control");
    expect(scoring.q6["wait-opening"].classes?.rogue).toBe(3);
    expect(scoring.q6["stick-plan"].classes?.priest).toBe(3);
  });

  it("names Q10's control and debuff response without changing its racial credit", () => {
    const q10 = questions.find((question) => question.id === "q10")!;
    expect(q10.options.find((option) => option.id === "break-free")?.label).toBe("Counter crowd control or cleanse a debuff");
    expect(scoring.q10["break-free"].races).toEqual({ undead: 3, gnome: 3, human: 3, dwarf: 3, orc: 2 });
    expect(questionWeights.q10).toEqual({ class: 0, race: 2.2 });
  });

  it("keeps Q10's resource-finding credit under the clearer label", () => {
    const q10 = questions.find((question) => question.id === "q10")!;
    expect(q10.options.find((option) => option.id === "resource")?.label).toBe("Find a useful resource or tool");
    expect(scoring.q10.resource.races).toEqual({ tauren: 3, gnome: 3, dwarf: 3, "skyborne-alliance": 2 });
    expect(questionWeights.q10).toEqual({ class: 0, race: 2.2 });
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
  it("credits several ways to protect others without treating pets as full tanks", () => {
    const protect = scoring.q4.protect.classes!;
    expect(protect.warrior).toBeGreaterThan(protect.priest!);
    expect(protect.priest).toBeGreaterThan(protect.warlock!);
    expect(protect.paladin).toBeGreaterThan(protect.hunter!);
    expect(protect.druid).toBe(protect.warrior);
    expect(scoring.q4.heal.classes?.druid).toBe(3);
    expect(scoring.q4.damage.classes?.priest).toBeGreaterThan(0);
    expect(scoring.q4.damage.classes?.paladin).toBeGreaterThan(0);
    expect(scoring.q4.control.classes?.druid).toBeGreaterThan(0);
  });

  it("credits pet-based adaptability below classes that can switch group jobs", () => {
    const adapt = scoring.q4.adapt.classes!;
    expect(adapt.hunter).toBe(1);
    expect(adapt.warlock).toBe(1);
    expect(adapt.druid).toBeGreaterThan(adapt.hunter!);
    expect(adapt.shaman).toBeGreaterThan(adapt.warlock!);
  });

  it("makes healing plus damage a stronger Priest signal than either answer alone", () => {
    expect(q4CombinationBonus("priest", ["heal"])).toBeUndefined();
    const priest = q4CombinationBonus("priest", ["heal", "damage"]);
    expect(priest?.label).toBe("healing while dealing damage");
    expect(priest!.value).toBeGreaterThan(q4CombinationBonus("paladin", ["heal", "damage"])!.value);
    expect(priest!.value).toBeGreaterThan(q4CombinationBonus("shaman", ["heal", "damage"])!.value);
    expect(priest!.value).toBeGreaterThan(q4CombinationBonus("druid", ["heal", "damage"])!.value);
    expect(q4CombinationBonus("priest", ["heal", "protect", "damage"])!.value).toBeLessThan(priest!.value);
    expect(q4CombinationBonus("priest", ["heal", "damage", "protect"])!.value).toBeLessThan(priest!.value);
  });

  it("recognizes damage-dealing protective pets and a Priest's shields", () => {
    const petPair = ["protect", "damage"];
    expect(q4CombinationBonus("warlock", petPair)?.value).toBeGreaterThan(0);
    expect(q4CombinationBonus("hunter", petPair)?.value).toBeGreaterThan(0);
    expect(q4CombinationBonus("warlock", ["protect"])).toBeUndefined();
    expect(q4CombinationBonus("priest", ["protect", "heal"])?.value).toBeGreaterThan(0);
  });

  it("favors Warlock for disruption and role-switching classes for adaptation", () => {
    const control = q4CombinationBonus("warlock", ["protect", "damage", "control"])!;
    const adapt = q4CombinationBonus("druid", ["protect", "damage", "adapt"])!;
    expect(control.value).toBeGreaterThan(q4CombinationBonus("hunter", ["protect", "damage", "control"])!.value);
    expect(adapt.value).toBeGreaterThan(q4CombinationBonus("warlock", ["protect", "damage", "adapt"])!.value);
    expect(control.value).toBeGreaterThan(q4CombinationBonus("warlock", ["control", "protect", "damage"])!.value);
    expect(adapt.value).toBeGreaterThan(q4CombinationBonus("druid", ["adapt", "protect", "damage"])!.value);
    expect(control.label).toContain("disrupting");
    expect(adapt.label).toContain("changing roles");
  });

  it("keeps combination weights proportional to the ranked group preference", () => {
    expect(groupContributionScore("warrior", ["protect"])).toBeGreaterThan(groupContributionScore("warlock", ["protect"]));
    expect(groupContributionScore("warrior", ["protect", "damage"])).toBeGreaterThan(groupContributionScore("warlock", ["protect", "damage"]));
    expect(groupContributionScore("warlock", ["damage", "protect"])).toBeGreaterThan(groupContributionScore("warrior", ["damage", "protect"]));
    expect(groupContributionScore("priest", ["heal", "damage"])).toBeGreaterThan(groupContributionScore("paladin", ["heal", "damage"]));
    expect(groupContributionScore("warlock", ["protect", "damage", "control"])).toBeGreaterThan(groupContributionScore("druid", ["protect", "damage", "control"]));
    expect(groupContributionScore("druid", ["protect", "damage", "adapt"])).toBeGreaterThan(groupContributionScore("warlock", ["protect", "damage", "adapt"]));
    const largestBonus = Math.max(...classes.flatMap(({ id }) => [
      q4CombinationBonus(id, ["protect", "damage", "control"])?.value ?? 0,
      q4CombinationBonus(id, ["protect", "damage", "adapt"])?.value ?? 0,
      q4CombinationBonus(id, ["heal", "damage"])?.value ?? 0,
    ]));
    expect(largestBonus).toBeLessThan(questionWeights.q5.class * 3);
  });

  it("recommends Warlock for a protective companion caster and Priest for damage-healing support", () => {
    const petCaster = persona({
      q4: ["protect", "damage", "control"], q5: ["ranged-companion", "ranged-magic"],
      q6: ["stick-plan"], q7: ["central"], q9: ["secrets", "arcane"],
    });
    const damageHealer = persona({
      q4: ["heal", "damage", "protect"], q5: ["ranged-magic"],
      q6: ["help-ally"], q7: ["none"], q9: ["holy", "secrets"],
    });
    expect(scoreQuiz(petCaster).primary.classId).toBe("warlock");
    expect(scoreQuiz(damageHealer).primary.classId).toBe("priest");
  });

  it("credits a Warlock's disruption and defined small-group contribution without displacing Mage or Hunter", () => {
    expect(scoring.q3.dungeons.classes?.warlock).toBe(2);
    expect(scoring.q4.control.classes?.warlock).toBe(3);
    expect(scoring.q8["small-group"].classes?.warlock).toBe(2);
    const groupWarlock = persona({
      q3: ["dungeons", "raids"], q4: ["control", "damage"],
      q5: ["ranged-magic", "ranged-companion"], q6: ["stick-plan"],
      q7: ["optional"], q8: ["small-group", "large-group"],
      q9: ["secrets", "arcane"], q12: ["none"], q13: ["focused"],
    });
    const arcaneMage = persona({
      q3: ["dungeons", "pvp"], q4: ["control", "damage"],
      q5: ["ranged-magic"], q6: ["wait-opening"], q7: ["none"],
      q8: ["small-group", "large-group"], q9: ["arcane"], q12: ["prep"],
    });
    const companionHunter = persona({
      ...answersByClass.hunter, q3: ["dungeons", "leveling", "exploration"],
      q8: ["small-group", "solo", "duo"],
    });
    expect(scoreQuiz(groupWarlock).primary.classId).toBe("warlock");
    expect(scoreQuiz(arcaneMage).primary.classId).toBe("mage");
    expect(scoreQuiz(companionHunter).primary.classId).toBe("hunter");
    const firstOfThree = normalizedRankFactors(3)[0];
    expect((scoring.q3.dungeons.classes!.warlock! - 1) * questionWeights.q3.class * firstOfThree).toBeCloseTo(4 / 9);
    expect((scoring.q4.control.classes!.warlock! - 2) * questionWeights.q4.class * firstOfThree).toBeCloseTo(10 / 9);
    expect(scoring.q8["small-group"].classes!.warlock! * questionWeights.q8.class * firstOfThree).toBeCloseTo(10 / 9);
  });

  it("keeps racial utility tied to the relevant racial kit", () => {
    expect(scoring.q10.endure.races?.["night-elf"]).toBeGreaterThan(0);
    expect(scoring.q10.resource.races?.["skyborne-alliance"]).toBeGreaterThan(0);
    expect(scoring.q10.resource.races?.["skyborne-horde"]).toBeUndefined();
    expect(scoring.q3.professions.races?.["skyborne-alliance"]).toBeUndefined();
    expect(scoring.q3.professions.races?.["skyborne-horde"]).toBeUndefined();
  });

  it("credits Orc leveling and anti-control without inventing recovery or mobility", () => {
    expect(scoring.q3.leveling.races?.orc).toBe(2);
    expect(scoring.q12.cornered.races?.orc).toBe(1);
    expect(scoring.q10["break-free"].races?.orc).toBeLessThan(scoring.q10["break-free"].races?.human ?? 0);
    for (const utility of ["reposition", "recover", "resource"]) {
      expect(scoring.q10[utility].races?.orc).toBeUndefined();
    }
    const orcLeveller = persona({
      ...answersByClass.warrior, q2: ["horde"], q3: ["leveling", "raids"],
      q10: ["endure"], q11: ["no-zone-preference"], q12: ["cornered"],
    });
    const recovering = { ...orcLeveller, q10: ["recover"] };
    const mobile = { ...orcLeveller, q3: ["exploration", "leveling"], q8: ["open-world"], q10: ["reposition"], q12: ["none"] };
    expect(scoreQuiz(orcLeveller).primary.raceId).toBe("orc");
    expect(scoreQuiz(recovering).primary.raceId).not.toBe("orc");
    expect(scoreQuiz(mobile).primary.raceId).not.toBe("orc");
    const firstOfThree = normalizedRankFactors(3)[0];
    expect(scoring.q3.leveling.races!.orc! * questionWeights.q3.race * firstOfThree).toBeCloseTo(4 / 3);
    expect(scoring.q12.cornered.races!.orc! * questionWeights.q12.race * firstOfThree).toBeCloseTo(1 / 3);
  });

  it("only recommends playable race and class combinations", () => {
    const result = scoreQuiz(frontline);
    for (const candidate of [result.primary, ...result.alternatives]) {
      expect(isValidCombination(candidate.raceId as keyof typeof raceById, candidate.classId as (typeof classes)[number]["id"])).toBe(true);
    }
  });

  it("favors the chosen faction when no starting-area atmosphere is preferred", () => {
    for (const era of questions[0].options) {
      const alliance = scoreQuiz(persona({ q1: [era.id], q2: ["alliance"] }));
      const horde = scoreQuiz(persona({ q1: [era.id], q2: ["horde"] }));
      expect(raceById[alliance.primary.raceId as keyof typeof raceById].faction).toBe("alliance");
      expect(raceById[horde.primary.raceId as keyof typeof raceById].faction).toBe("horde");
    }
  });

  it("uses start era as a gradual racial timing cue", () => {
    const early = scoring.q1["vanilla-wrath"].races!;
    const middle = scoring.q1["bfa-shadowlands"].races!;
    const newPlayer = scoring.q1.never.races!;
    expect(early.human).toBeGreaterThan(early["skyborne-horde"] ?? 0);
    expect(newPlayer["skyborne-horde"]).toBeGreaterThan(newPlayer.human ?? 0);
    expect(early.human).toBeGreaterThan(middle.human ?? 0);
    expect(middle.human).toBeGreaterThan(newPlayer.human ?? 0);
    expect(early["skyborne-horde"]).toBeLessThan(middle["skyborne-horde"] ?? 0);
    expect(middle["skyborne-horde"]).toBeGreaterThan(newPlayer["skyborne-horde"] ?? 0);
    expect(newPlayer["skyborne-horde"]).toBe(newPlayer["skyborne-alliance"]);
    for (const era of questions[0].options) {
      expect(Object.keys(scoring.q1[era.id].races ?? {})).toHaveLength(races.length);
    }
  });

  it("favors forgiving starting classes for newer players without excluding nostalgic Hunters", () => {
    const classic = scoring.q1["vanilla-wrath"].classes!;
    const cata = scoring.q1["cata-legion"].classes!;
    const modern = scoring.q1.modern.classes!;
    const firstTime = scoring.q1.never.classes!;
    expect(classic.hunter).toBeGreaterThan(0);
    expect(classic.paladin).toBeUndefined();
    expect(firstTime.hunter).toBeGreaterThan(modern.hunter ?? 0);
    expect(modern.hunter).toBeGreaterThan(cata.hunter ?? 0);
    expect(firstTime.hunter).toBeGreaterThan(firstTime.paladin ?? 0);
    expect(firstTime.paladin).toBeGreaterThan(firstTime.warlock ?? 0);
    expect(questionWeights.q1.class * firstTime.hunter!).toBeLessThan(questionWeights.q5.class);
  });

  it("keeps each starting-area mood open to both factions", () => {
    for (const option of questions.find((question) => question.id === "q11")!.options.filter((item) => item.id !== "no-zone-preference")) {
      const raceScores = scoring.q11[option.id].races ?? {};
      const favored = Object.keys(raceScores) as (keyof typeof raceById)[];
      expect(favored.length).toBeGreaterThanOrEqual(2);
      expect(new Set(favored.map((raceId) => raceById[raceId].faction)).size).toBe(2);
    }
  });

  it("separates living forests from haunted glades and gives dark class fantasies a small boost", () => {
    const forest = scoring.q11["woodland-mystery"];
    const haunted = scoring.q11["haunted-glades"];
    expect(forest.races?.["night-elf"]).toBeGreaterThan(haunted.races?.["night-elf"] ?? 0);
    expect(forest.races?.undead ?? 0).toBe(0);
    expect(haunted.races?.undead).toBeGreaterThan(haunted.races?.["night-elf"] ?? 0);
    expect(haunted.classes?.warlock).toBeGreaterThan(haunted.classes?.rogue ?? 0);
    expect(haunted.classes?.rogue).toBeGreaterThan(0);
    expect(scoring.q11["no-zone-preference"].classes).toBeUndefined();
  });

  it("changes a warlock's race match when only the woodland mood changes", () => {
    const answers = persona({ ...answersByClass.warlock, q2: ["either"], q10: ["break-free"] });
    const living = scoreQuiz({ ...answers, q11: ["woodland-mystery"] });
    const haunted = scoreQuiz({ ...answers, q11: ["haunted-glades"] });
    expect(living.primary.classId).toBe("warlock");
    expect(haunted.primary.classId).toBe("warlock");
    expect(living.primary.raceId).toBe("human");
    expect(haunted.primary.raceId).toBe("undead");
  });

  it("distinguishes frontline and deliberate ranged preferences", () => {
    const frontResult = scoreQuiz(frontline);
    const backResult = scoreQuiz(backline);
    expect(["warrior", "paladin", "rogue", "shaman", "druid"]).toContain(frontResult.primary.classId);
    expect(["mage", "warlock", "priest", "hunter"]).toContain(backResult.primary.classId);
  });

  it("lets a focused preference move a mixed profile away from Druid", () => {
    const mixed = persona({
      q3: ["exploration", "dungeons"], q4: ["adapt", "damage"],
      q5: ["adaptable", "quick-melee"], q7: ["none"],
      q8: ["solo", "small-group"], q9: ["wilds", "martial"],
      q10: ["endure"],
    });
    expect(scoreQuiz({ ...mixed, q13: ["either"] }).primary.classId).toBe("druid");
    expect(scoreQuiz({ ...mixed, q13: ["flexible"] }).primary.classId).toBe("druid");
    expect(scoreQuiz({ ...mixed, q13: ["focused"] }).primary.classId).toBe("rogue");
    expect(scoring.q13.focused.classes?.druid).toBeLessThan(0);
    expect(scoring.q13.focused.races).toBeUndefined();
  });

  it("can still recommend Druid when nature and role switching are strong despite a focused answer", () => {
    const nature = persona({
      q3: ["exploration", "leveling", "dungeons"], q4: ["adapt", "heal", "protect"],
      q5: ["adaptable", "ranged-magic", "quick-melee"], q7: ["none"],
      q8: ["solo", "open-world", "small-group"], q9: ["wilds", "arcane"],
      q10: ["endure"], q12: ["downtime"], q13: ["focused"],
    });
    expect(scoreQuiz(nature).primary.classId).toBe("druid");
  });

  it("chooses the class before applying faction or racial utility", () => {
    for (const { answers } of classPersonas) {
      const expectedClass = scoreQuiz(answers).primary.classId;
      for (const faction of ["alliance", "horde", "either"]) {
        for (const utility of questions.find((question) => question.id === "q10")!.options) {
          const result = scoreQuiz({ ...answers, q2: [faction], q10: [utility.id] });
          expect(result.primary.classId).toBe(expectedClass);
          expect(result.alternatives[0].classId).toBe(expectedClass);
          expect(result.alternatives[1].classId).not.toBe(expectedClass);
          for (const candidate of [result.primary, ...result.alternatives]) {
            expect(isValidCombination(candidate.raceId as keyof typeof raceById, candidate.classId as (typeof classes)[number]["id"])).toBe(true);
          }
        }
      }
    }
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

  it("splits the frustration question weight across ranked picks", () => {
    const factors = normalizedRankFactors(3);
    expect(factors).toHaveLength(3);
    expect(factors[0]).toBeGreaterThan(factors[1]);
    expect(factors[1]).toBeGreaterThan(factors[2]);
    expect(factors.reduce((sum, factor) => sum + factor * questionWeights.q12.class, 0)).toBeCloseTo(questionWeights.q12.class);
    expect(() => scoreQuiz(persona({ q12: ["downtime", "prep", "juggling"] }))).not.toThrow();
    expect(() => scoreQuiz(persona({ q12: ["downtime", "prep", "juggling", "cornered"] }))).toThrow("q12 accepts up to 3 answers");
    expect(() => scoreQuiz(persona({ q12: ["none", "downtime"] }))).toThrow("q12 cannot combine");
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

  it("rejects multiple answers to the focused or flexible question", () => {
    expect(() => scoreQuiz(persona({ q13: ["focused", "flexible"] }))).toThrow("q13 accepts one answer");
  });
});
