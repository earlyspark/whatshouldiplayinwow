import type { ClassId, RaceId } from "@/data/forever";
import type { QuestionId } from "@/data/questions";

type ScoreMap<T extends string> = Partial<Record<T, number>>;

export interface OptionScore {
  classes?: ScoreMap<ClassId>;
  races?: ScoreMap<RaceId>;
}

export const questionWeights: Record<QuestionId, { class: number; race: number }> = {
  q1: { class: 0, race: 0.5 },
  q2: { class: 0, race: 2.5 },
  q3: { class: 1.2, race: 1.2 },
  q4: { class: 2, race: 0 },
  q5: { class: 2, race: 0 },
  q6: { class: 3, race: 0 },
  q7: { class: 1.5, race: 0 },
  q8: { class: 1.7, race: 0.3 },
  q9: { class: 2.5, race: 0 },
  q10: { class: 0, race: 2.2 },
  q11: { class: 0, race: 3 },
  q12: { class: 2.2, race: 0.6 },
};

export const scoring: Record<QuestionId, Record<string, OptionScore>> = {
  q1: {
    never: { races: { dwarf: 2, tauren: 2, troll: 2, undead: 2, human: 1, "night-elf": 1 } },
    modern: { races: { gnome: 2, human: 2, "skyborne-alliance": 2, "skyborne-horde": 2, "night-elf": 1 } },
    "bfa-shadowlands": { races: { gnome: 2, human: 2, "night-elf": 2, troll: 1, orc: 1 } },
    "mists-legion": { races: { human: 2, orc: 2, troll: 2, "night-elf": 2, undead: 1 } },
    "original-cata": { races: { dwarf: 2, human: 2, orc: 2, undead: 2, troll: 2 } },
  },
  q2: {
    alliance: { races: { human: 3, dwarf: 3, "night-elf": 3, gnome: 3, "skyborne-alliance": 3 } },
    horde: { races: { orc: 3, undead: 3, tauren: 3, troll: 3, "skyborne-horde": 3 } },
    either: {},
  },
  q3: {
    leveling: {
      classes: { hunter: 3, druid: 3, warlock: 2, paladin: 2, shaman: 2, mage: 1, priest: 1, rogue: 1, warrior: 1 },
      races: { undead: 3, troll: 2, tauren: 2, "night-elf": 2, "skyborne-alliance": 2, "skyborne-horde": 2 },
    },
    dungeons: {
      classes: { warrior: 2, paladin: 2, priest: 2, shaman: 2, druid: 2, mage: 2, rogue: 2, hunter: 1, warlock: 1 },
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
      races: { tauren: 3, gnome: 3, dwarf: 2, "skyborne-alliance": 1, "skyborne-horde": 1 },
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
    protect: { classes: { warrior: 3, paladin: 3, druid: 2, shaman: 1 } },
    heal: { classes: { priest: 3, paladin: 3, shaman: 3, druid: 2 } },
    damage: { classes: { mage: 3, rogue: 3, hunter: 3, warlock: 3, warrior: 2, shaman: 2, druid: 2 } },
    control: { classes: { mage: 3, rogue: 3, warlock: 2, shaman: 2, hunter: 2, priest: 2 } },
    adapt: { classes: { druid: 3, shaman: 3, paladin: 3, priest: 2, warrior: 1 } },
  },
  q5: {
    "heavy-melee": { classes: { warrior: 3, paladin: 3, shaman: 2, druid: 1 } },
    "quick-melee": { classes: { rogue: 3, shaman: 2, druid: 2, warrior: 1, hunter: 1 } },
    "ranged-companion": { classes: { hunter: 3, warlock: 3 } },
    "ranged-magic": { classes: { mage: 3, warlock: 3, priest: 2, shaman: 2, druid: 1 } },
    adaptable: { classes: { druid: 3, shaman: 3, paladin: 2, priest: 1 } },
  },
  q6: {
    "act-fast": { classes: { warrior: 3, rogue: 3, mage: 2, hunter: 2, paladin: 2, shaman: 2, druid: 2, priest: 1, warlock: 1 } },
    "wait-opening": { classes: { rogue: 3, mage: 3, warlock: 3, hunter: 2, paladin: 2, warrior: 2, shaman: 2, druid: 2, priest: 2 } },
    "help-ally": { classes: { priest: 3, shaman: 3, paladin: 3, druid: 3, warrior: 2, hunter: 2, mage: 2, rogue: 1, warlock: 1 } },
    "stick-plan": { classes: { warlock: 3, priest: 3, mage: 2, warrior: 2, hunter: 2, paladin: 2, shaman: 2, rogue: 1, druid: 1 } },
    improvise: { classes: { druid: 3, shaman: 3, rogue: 3, hunter: 2, paladin: 2, mage: 2, priest: 2, warrior: 1, warlock: 1 } },
  },
  q7: {
    central: { classes: { hunter: 3, warlock: 3 } },
    optional: { classes: { hunter: 2, warlock: 2, druid: 1, shaman: 1, mage: 1, priest: 1 } },
    none: { classes: { warrior: 2, rogue: 2, mage: 2, priest: 2, paladin: 2, shaman: 1, druid: 1 } },
  },
  q8: {
    solo: {
      classes: { hunter: 3, druid: 3, warlock: 2, rogue: 2, mage: 2, paladin: 1 },
      races: { undead: 2, troll: 2, tauren: 1, "night-elf": 1 },
    },
    duo: {
      classes: { hunter: 3, paladin: 2, druid: 2, shaman: 2, warlock: 2, priest: 1 },
      races: { human: 1, dwarf: 1, orc: 1, tauren: 1 },
    },
    "small-group": {
      classes: { paladin: 3, priest: 3, shaman: 3, druid: 3, warrior: 2, mage: 2, rogue: 2 },
      races: { dwarf: 1, tauren: 1, human: 1, troll: 1 },
    },
    "large-group": {
      classes: { priest: 3, warrior: 3, mage: 2, warlock: 2, shaman: 2, paladin: 2, hunter: 1, rogue: 1 },
      races: { orc: 1, troll: 1, human: 1, "night-elf": 1 },
    },
    "open-world": {
      classes: { druid: 3, hunter: 3, rogue: 2, shaman: 2, warlock: 1, mage: 1 },
      races: { "skyborne-alliance": 2, "skyborne-horde": 2, dwarf: 1, "night-elf": 1, tauren: 1 },
    },
  },
  q9: {
    martial: { classes: { warrior: 3, paladin: 2, rogue: 2, hunter: 2, shaman: 1 } },
    wilds: { classes: { druid: 3, shaman: 3, hunter: 3, mage: 1 } },
    holy: { classes: { paladin: 3, priest: 3, shaman: 1 } },
    arcane: { classes: { mage: 3, warlock: 2, priest: 2, shaman: 1, druid: 1 } },
    secrets: { classes: { rogue: 3, warlock: 3, priest: 2, druid: 2, hunter: 1, mage: 1 } },
  },
  q10: {
    finish: { races: { orc: 3, troll: 3, "night-elf": 3, gnome: 2, "skyborne-alliance": 2, "skyborne-horde": 2 } },
    endure: { races: { dwarf: 3, tauren: 3, orc: 2, human: 2, troll: 1 } },
    "break-free": { races: { undead: 3, gnome: 3, human: 3, dwarf: 3, orc: 2 } },
    reposition: { races: { gnome: 3, "skyborne-horde": 3, "skyborne-alliance": 2, "night-elf": 2, tauren: 2 } },
    recover: { races: { undead: 3, troll: 3, "skyborne-alliance": 3, tauren: 1 } },
    resource: { races: { tauren: 3, gnome: 3, dwarf: 3, "skyborne-alliance": 2, "skyborne-horde": 2 } },
  },
  q11: {
    // These evoke the verified starting areas, but overlap deliberately:
    // Elwynn, Dun Morogh, Teldrassil, Durotar, Mulgore, Tirisfal, Zephras Isle.
    "woodland-mystery": { races: { human: 3, "night-elf": 3, undead: 3, "skyborne-alliance": 1, "skyborne-horde": 1, tauren: 1 } },
    "mountain-outposts": { races: { dwarf: 3, gnome: 3, human: 1, orc: 1, "skyborne-alliance": 1, "skyborne-horde": 1 } },
    "open-frontier": { races: { tauren: 3, orc: 3, troll: 3, "skyborne-alliance": 2, "skyborne-horde": 2, dwarf: 1, undead: 1 } },
    "no-zone-preference": {},
  },
  q12: {
    downtime: {
      classes: { mage: -2, priest: -2, shaman: -2, warlock: -1, warrior: -1 },
      races: { undead: 3, troll: 3, "skyborne-alliance": 2, tauren: 1 },
    },
    prep: { classes: { warlock: -3, rogue: -2, hunter: -2, mage: -1, druid: -1 } },
    cornered: {
      classes: { warrior: -3, priest: -2, shaman: -1, warlock: -1 },
      races: { gnome: 3, human: 3, undead: 3, dwarf: 2, "night-elf": 1 },
    },
    repetition: { classes: { druid: 3, shaman: 3, rogue: 2, hunter: 2, mage: 2, warlock: 2, paladin: 2, priest: 2, warrior: 1 } },
    juggling: { classes: { druid: -3, shaman: -2, warlock: -2, hunter: -1, rogue: -1, mage: -1 } },
    none: {},
  },
};
