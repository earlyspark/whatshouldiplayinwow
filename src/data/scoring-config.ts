import type { ClassId, RaceId } from "@/data/forever";
import type { QuestionId } from "@/data/questions";

type ScoreMap<T extends string> = Partial<Record<T, number>>;

export interface OptionScore {
  classes?: ScoreMap<ClassId>;
  races?: ScoreMap<RaceId>;
}

export const questionWeights: Record<QuestionId, { class: number; race: number }> = {
  q1: { class: 0, race: 0.5 },
  q2: { class: 0, race: 0 },
  q3: { class: 1.2, race: 1.2 },
  q4: { class: 2, race: 0 },
  q5: { class: 2, race: 0 },
  q6: { class: 3, race: 0 },
  q7: { class: 1.5, race: 0 },
  q8: { class: 1.7, race: 0.3 },
  q9: { class: 2.5, race: 0 },
  q10: { class: 0, race: 2.2 },
  q11: { class: 0, race: 3 },
  q12: { class: 2.2, race: 0 },
};

export const scoring: Record<QuestionId, Record<string, OptionScore>> = {
  q1: {
    never: { races: { dwarf: 2, tauren: 2, troll: 2, undead: 2, human: 1, "night-elf": 1 } },
    modern: { races: { gnome: 2, human: 2, "skyborne-alliance": 2, "skyborne-horde": 2, "night-elf": 1 } },
    "bfa-shadowlands": { races: { gnome: 2, human: 2, "night-elf": 2, troll: 1, orc: 1 } },
    "mists-legion": { races: { human: 2, orc: 2, troll: 2, "night-elf": 2, undead: 1 } },
    "original-cata": { races: { dwarf: 2, human: 2, orc: 2, undead: 2, troll: 2 } },
    "many-eras": { races: { human: 2, dwarf: 2, orc: 2, undead: 2, gnome: 1, "night-elf": 1 } },
  },
  q2: { alliance: {}, horde: {}, either: {} },
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
    dive: { classes: { warrior: 3, rogue: 3, paladin: 2, shaman: 2, druid: 2 } },
    "measured-close": { classes: { paladin: 3, warrior: 2, shaman: 3, druid: 2, rogue: 1 } },
    "second-line": { classes: { priest: 3, shaman: 3, hunter: 2, druid: 2, paladin: 1 } },
    backline: { classes: { mage: 3, warlock: 3, hunter: 3, priest: 2 } },
    shift: { classes: { druid: 3, rogue: 3, shaman: 2, hunter: 2, paladin: 1 } },
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
    martial: { classes: { warrior: 3, paladin: 2, rogue: 2, hunter: 1 } },
    ranger: { classes: { hunter: 3, druid: 1, rogue: 1 } },
    nature: { classes: { druid: 3, shaman: 2, hunter: 1 } },
    elements: { classes: { shaman: 3, mage: 1 } },
    holy: { classes: { paladin: 3, priest: 3 } },
    arcane: { classes: { mage: 3, warlock: 1 } },
    shadow: { classes: { warlock: 3, priest: 2, rogue: 1 } },
    stealth: { classes: { rogue: 3, druid: 2, hunter: 1 } },
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
    human: { races: { human: 3 } },
    dwarf: { races: { dwarf: 3 } },
    "night-elf": { races: { "night-elf": 3 } },
    gnome: { races: { gnome: 3 } },
    orc: { races: { orc: 3 } },
    undead: { races: { undead: 3 } },
    tauren: { races: { tauren: 3 } },
    troll: { races: { troll: 3 } },
    skyborne: { races: { "skyborne-alliance": 3, "skyborne-horde": 3 } },
    "no-race-preference": {},
  },
  q12: {
    responsibility: { classes: { warrior: -3, priest: -3, paladin: -2, shaman: -2, druid: -2 } },
    companion: { classes: { hunter: -3, warlock: -3 } },
    melee: { classes: { warrior: -3, rogue: -3, paladin: -2, shaman: -1, druid: -1 } },
    casting: { classes: { mage: -3, warlock: -2, priest: -2, hunter: -2 } },
    forms: { classes: { druid: -3, shaman: -1 } },
    setup: { classes: { rogue: -3, druid: -1 } },
    none: {},
  },
};
