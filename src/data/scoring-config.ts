import type { ClassId, RaceId } from "@/data/forever";
import type { QuestionId } from "@/data/questions";

type ScoreMap<T extends string> = Partial<Record<T, number>>;

export interface OptionScore {
  classes?: ScoreMap<ClassId>;
  races?: ScoreMap<RaceId>;
}

// A ranged weapon remains a Hunter signal, but the companion part of the
// answer matters less when the player does not want to rely on a pet.
export const hunterRangedCompanionPointsByPetPreference = {
  central: 3,
  optional: 2,
  none: 1,
} as const;

// This describes how much combat timing a race's racial kit asks of the player,
// not player skill. Every race still has active and passive benefits.
const racialTimingDemand: Record<RaceId, 1 | 2 | 3> = {
  human: 3, dwarf: 3, "night-elf": 3, gnome: 3,
  orc: 3, undead: 3, tauren: 2, troll: 3,
  "skyborne-alliance": 2, "skyborne-horde": 2,
};

function racialTimingScores(preferredDemand: number): ScoreMap<RaceId> {
  return Object.fromEntries(
    Object.entries(racialTimingDemand).map(([raceId, demand]) => [raceId, 2 - Math.abs(demand - preferredDemand)]),
  ) as ScoreMap<RaceId>;
}

// A small beginner-friendly nudge based on forgiving solo play, not a claim
// that other classes require a particular skill level. Direct preferences win.
function newcomerClassScores(strength: number): ScoreMap<ClassId> {
  return { hunter: 3 * strength, paladin: 2 * strength, warlock: strength };
}

export const questionWeights: Record<QuestionId, { class: number; race: number }> = {
  q1: { class: 0.5, race: 0.8 },
  q2: { class: 0, race: 2.5 },
  q3: { class: 0.8, race: 1.2 },
  q4: { class: 2, race: 0 },
  q5: { class: 3, race: 0 },
  q6: { class: 2.5, race: 0 },
  q7: { class: 1.5, race: 0 },
  q8: { class: 1, race: 0.3 },
  q9: { class: 3, race: 0 },
  q10: { class: 0, race: 2.2 },
  q11: { class: 0.3, race: 3 },
  q12: { class: 1.5, race: 0.6 },
  q13: { class: 2, race: 0 },
};

export const scoring: Record<QuestionId, Record<string, OptionScore>> = {
  q1: {
    // Era is only a weak proxy for comfort with timing extra abilities or
    // interest in a forgiving first class; it does not measure player skill.
    "vanilla-wrath": { classes: { hunter: 0.75 }, races: racialTimingScores(3) },
    "cata-legion": { classes: newcomerClassScores(0.25), races: racialTimingScores(2.5) },
    "bfa-shadowlands": { classes: newcomerClassScores(0.5), races: racialTimingScores(2) },
    modern: { classes: newcomerClassScores(0.75), races: racialTimingScores(1.5) },
    never: { classes: newcomerClassScores(1), races: racialTimingScores(1) },
  },
  q2: {
    alliance: { races: { human: 3, dwarf: 3, "night-elf": 3, gnome: 3, "skyborne-alliance": 3 } },
    horde: { races: { orc: 3, undead: 3, tauren: 3, troll: 3, "skyborne-horde": 3 } },
    either: {},
  },
  q3: {
    leveling: {
      classes: { hunter: 3, druid: 3, warlock: 2, paladin: 2, shaman: 2, mage: 2, priest: 1, rogue: 2, warrior: 1 },
      races: { undead: 3, troll: 2, tauren: 2, orc: 2, "night-elf": 2, "skyborne-alliance": 2, "skyborne-horde": 2 },
    },
    dungeons: {
      classes: { warrior: 2, paladin: 2, priest: 2, shaman: 2, druid: 2, mage: 2, rogue: 2, hunter: 1, warlock: 2 },
      races: { tauren: 3, dwarf: 2, orc: 2, troll: 2, human: 2, gnome: 1, undead: 1 },
    },
    raids: {
      classes: { warrior: 2, priest: 2, shaman: 2, paladin: 2, mage: 2, rogue: 2, hunter: 2, warlock: 2, druid: 1 },
      races: { orc: 3, troll: 3, "night-elf": 3, gnome: 2, human: 2, "skyborne-alliance": 2, "skyborne-horde": 2 },
    },
    pvp: {
      classes: { rogue: 3, mage: 3, warlock: 2, priest: 2, shaman: 2, druid: 2, hunter: 2, warrior: 2, paladin: 2 },
      races: { undead: 3, orc: 3, dwarf: 3, gnome: 3, human: 3, "night-elf": 2, tauren: 2 },
    },
    professions: {
      classes: { hunter: 1, druid: 1, mage: 1 },
      races: { tauren: 3, gnome: 3, dwarf: 2 },
    },
    exploration: {
      classes: { druid: 3, hunter: 3, rogue: 2, mage: 2, shaman: 1, warlock: 1 },
      races: { dwarf: 3, "skyborne-alliance": 3, "skyborne-horde": 3, "night-elf": 2, tauren: 2 },
    },
    // Community is not intrinsically better on either faction. It raises the
    // importance of the player's own atmosphere choice in scoreCandidate.
    vibes: {},
  },
  q4: {
    // Frontline tanks lead; shields, totems, and protective pets also count.
    protect: { classes: { warrior: 3, paladin: 3, druid: 3, priest: 2, shaman: 1, warlock: 1, hunter: 1 } },
    heal: { classes: { priest: 3, paladin: 3, shaman: 3, druid: 3 } },
    // Warrior is a damage class as well as a tank; Shadow and Retribution can
    // deal damage, while Discipline mixes damage with healing.
    damage: { classes: { mage: 3, rogue: 3, hunter: 3, warlock: 3, warrior: 3, shaman: 2, druid: 2, priest: 2, paladin: 2 } },
    control: { classes: { mage: 3, rogue: 3, warlock: 3, shaman: 2, hunter: 2, priest: 2, druid: 1 } },
    adapt: { classes: { druid: 3, shaman: 3, paladin: 3, priest: 2, warrior: 1, hunter: 1, warlock: 1 } },
  },
  q5: {
    "heavy-melee": { classes: { warrior: 3, paladin: 3, shaman: 2, druid: 1 } },
    "quick-melee": { classes: { rogue: 3, shaman: 2, druid: 2, warrior: 2, hunter: 1 } },
    "ranged-companion": { classes: { hunter: 3, warlock: 1 } },
    "ranged-magic": { classes: { mage: 3, warlock: 3, priest: 2.5, shaman: 2, druid: 1 } },
    adaptable: { classes: { druid: 3, shaman: 3, paladin: 2, priest: 1 } },
  },
  q6: {
    "act-fast": { classes: { warrior: 3, rogue: 3, mage: 3, hunter: 2, paladin: 2, shaman: 2, druid: 2, priest: 1, warlock: 1 } },
    "wait-opening": { classes: { rogue: 3, mage: 3, warlock: 3, hunter: 2, paladin: 2, warrior: 2, shaman: 2, druid: 2, priest: 2 } },
    "help-ally": { classes: { priest: 3, shaman: 3, paladin: 3, druid: 3, warrior: 2, hunter: 2, mage: 2, rogue: 1, warlock: 1 } },
    "stick-plan": { classes: { warlock: 3, priest: 3, mage: 2, warrior: 2, hunter: 2, paladin: 2, shaman: 2, rogue: 1, druid: 1 } },
    improvise: { classes: { druid: 3, shaman: 3, rogue: 3, hunter: 2, paladin: 2, mage: 2, priest: 2, warrior: 1, warlock: 1 } },
  },
  q7: {
    central: { classes: { hunter: 3, warlock: 3 } },
    optional: { classes: { hunter: 1, warlock: 1, druid: 1, shaman: 1, mage: 1, priest: 1 } },
    none: { classes: { warrior: 2, rogue: 2, mage: 2, priest: 2, paladin: 2, shaman: 1, druid: 1 } },
  },
  q8: {
    solo: {
      classes: { hunter: 3, druid: 3, warlock: 2, rogue: 2, mage: 2, paladin: 1, priest: 1 },
      races: { undead: 2, troll: 2, tauren: 1, "night-elf": 1 },
    },
    duo: {
      classes: { hunter: 3, paladin: 2, druid: 2, shaman: 2, warlock: 2, mage: 2, warrior: 2, priest: 2, rogue: 1 },
      races: { human: 1, dwarf: 1, orc: 1, tauren: 1 },
    },
    "small-group": {
      classes: { paladin: 3, priest: 3, shaman: 3, druid: 3, warrior: 2, mage: 2, rogue: 2, warlock: 2 },
      races: { dwarf: 1, tauren: 1, human: 1, troll: 1 },
    },
    "large-group": {
      classes: { priest: 3, warrior: 3, mage: 2, warlock: 2, shaman: 2, paladin: 2, hunter: 1, rogue: 1 },
      races: { orc: 1, troll: 1, human: 1, "night-elf": 1 },
    },
    "open-world": {
      classes: { druid: 3, hunter: 3, rogue: 2, shaman: 2, warlock: 1, mage: 2 },
      races: { "skyborne-alliance": 2, "skyborne-horde": 2, dwarf: 1, "night-elf": 1, tauren: 1 },
    },
  },
  q9: {
    martial: { classes: { warrior: 3, paladin: 2, rogue: 2, hunter: 2, shaman: 1 } },
    wilds: { classes: { druid: 3, shaman: 3, hunter: 3, mage: 1 } },
    holy: { classes: { paladin: 3, priest: 3, shaman: 1 } },
    arcane: { classes: { mage: 3, warlock: 2, priest: 2, shaman: 1, druid: 1 } },
    secrets: { classes: { rogue: 3, warlock: 3, priest: 2, hunter: 1, mage: 1 } },
  },
  q10: {
    finish: { races: { orc: 3, troll: 3, "night-elf": 3, gnome: 2, "skyborne-alliance": 2, "skyborne-horde": 2 } },
    endure: { races: { dwarf: 3, tauren: 3, orc: 2, human: 2, troll: 1, "night-elf": 1 } },
    "break-free": { races: { undead: 3, gnome: 3, human: 3, dwarf: 3, orc: 2 } },
    reposition: { races: { gnome: 3, "skyborne-horde": 3, "skyborne-alliance": 2, "night-elf": 2, tauren: 2 } },
    recover: { races: { undead: 3, troll: 3, "skyborne-alliance": 3, tauren: 1 } },
    resource: { races: { tauren: 3, gnome: 3, dwarf: 3, "skyborne-alliance": 2 } },
  },
  q11: {
    // Living forests evoke Elwynn and Teldrassil; haunted woods evoke Tirisfal.
    // Class points are a small fantasy cue beside the stronger playstyle signals.
    "woodland-mystery": {
      classes: { druid: 3, hunter: 2, rogue: 1 },
      races: { human: 3, "night-elf": 3, tauren: 1, troll: 1 },
    },
    "haunted-glades": {
      classes: { warlock: 3, rogue: 2, priest: 1 },
      races: { undead: 3, "night-elf": 1 },
    },
    "mountain-outposts": {
      classes: { warrior: 2, hunter: 1, mage: 1 },
      races: { dwarf: 3, gnome: 3, human: 1, orc: 1, "skyborne-alliance": 1, "skyborne-horde": 1 },
    },
    "open-frontier": {
      classes: { shaman: 2, warrior: 2, hunter: 1, druid: 1 },
      races: { tauren: 3, orc: 3, troll: 3, "skyborne-alliance": 2, "skyborne-horde": 2, dwarf: 1, undead: 1 },
    },
    "no-zone-preference": {},
  },
  q12: {
    downtime: {
      classes: { mage: -2, priest: -2, shaman: -2, rogue: -2, warlock: -1, warrior: -1 },
      races: { undead: 3, troll: 3, "skyborne-alliance": 2, tauren: 1 },
    },
    prep: { classes: { warlock: -3, rogue: -2, hunter: -2, mage: -1, druid: -1, shaman: -1 } },
    cornered: {
      classes: { warrior: -3, priest: -2, shaman: -1, warlock: -1 },
      races: { gnome: 3, human: 3, undead: 3, dwarf: 2, "night-elf": 1, orc: 1 },
    },
    repetition: { classes: { druid: 3, shaman: 3, rogue: 1, hunter: 2, mage: 2, warlock: 2, paladin: 2, priest: 2, warrior: 1 } },
    juggling: { classes: { druid: -3, shaman: -2, warlock: -2, hunter: -1, rogue: -1, mage: -1 } },
    none: {},
  },
  q13: {
    focused: { classes: { warrior: 3, rogue: 3, mage: 3, hunter: 3, warlock: 2, priest: 1, paladin: -1, shaman: -2, druid: -3 } },
    flexible: { classes: { druid: 3, shaman: 3, paladin: 2, priest: 2, hunter: 1, warlock: 1 } },
    either: {},
  },
};
