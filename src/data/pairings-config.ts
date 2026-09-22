import type { Capability, Role } from "@/data/specs";

export const PAIRINGS_VERSION = "1.0.0";

export type PairingMode = "pve" | "pvp";

// PvE means leveling together plus the two-player core of a five-player dungeon; Forever has no arenas, so PvP means world PvP and battlegrounds.
export const roleSynergy: Record<PairingMode, Record<Role, Record<Role, number>>> = {
  pve: {
    tank: { tank: 2, healer: 10, melee: 6, ranged: 7 },
    healer: { tank: 10, healer: 3, melee: 7, ranged: 7 },
    melee: { tank: 6, healer: 7, melee: 3, ranged: 4 },
    ranged: { tank: 7, healer: 7, melee: 4, ranged: 3 },
  },
  pvp: {
    tank: { tank: 3, healer: 7, melee: 5, ranged: 5 },
    healer: { tank: 7, healer: 3, melee: 9, ranged: 8 },
    melee: { tank: 5, healer: 9, melee: 5, ranged: 7 },
    ranged: { tank: 5, healer: 8, melee: 7, ranged: 5 },
  },
};

export const capabilityWeights: Record<PairingMode, Record<Capability, number>> = {
  pve: {
    "rez": 3,
    "battle-rez": 2,
    "dispel-magic": 2,
    "dispel-curse": 1.5,
    "dispel-poison": 1.5,
    "dispel-disease": 1,
    "purge": 0.5,
    "interrupt": 2,
    "stun": 1,
    "hard-cc": 2,
    "root-slow": 0.5,
    "peel": 0.5,
    "stealth": 0.5,
    "burst": 1,
    "aoe-damage": 2,
    "off-heal": 1.5,
    "self-heal": 1.5,
    "external-defensive": 1.5,
    "mana-support": 2,
    "healing-reduction": 0,
    "fear-protection": 1,
    "movement-freedom": 0.5,
    "pet": 1,
    "party-buff": 1,
    "travel-utility": 1.5,
  },
  pvp: {
    "rez": 1,
    "battle-rez": 0.5,
    "dispel-magic": 3,
    "dispel-curse": 1.5,
    "dispel-poison": 2,
    "dispel-disease": 1,
    "purge": 2.5,
    "interrupt": 2.5,
    "stun": 3,
    "hard-cc": 2.5,
    "root-slow": 2,
    "peel": 2.5,
    "stealth": 1.5,
    "burst": 3,
    "aoe-damage": 0.5,
    "off-heal": 1.5,
    "self-heal": 1.5,
    "external-defensive": 2.5,
    "mana-support": 1,
    "healing-reduction": 2.5,
    "fear-protection": 2,
    "movement-freedom": 2,
    "pet": 0.5,
    "party-buff": 0.5,
    "travel-utility": 0.5,
  },
};

// Racials only choose the suggested partner race; they never change the spec ranking.
export const racialPairingValue: Record<PairingMode, Record<string, number>> = {
  pve: {
    "Endurance": 2,
    "Berserking": 2,
    "Blood Fury": 2,
    "Wind Blessed": 2,
    "Eureka!": 1.5,
    "Elune’s Light": 1.5,
    "Stoneform": 1.5,
    "Cannibalize": 1.5,
    "Rapid Regeneration": 1.5,
    "Read Ley Line": 1.5,
    "Expansive Mind": 1,
    "Regeneration": 1,
    "Big Game Hunter": 1,
    "Beast Slaying": 1,
    "Sword Specialization": 1,
    "Mace Specialization": 1,
    "Axe Specialization": 1,
    "Touch of the Grave": 1,
    "Will to Survive": 1,
    "Will of the Forsaken": 1,
    "War Stomp": 1,
    "Plainsrunning": 0.5,
    "Skysight": 0.5,
  },
  pvp: {
    "Will to Survive": 3,
    "Will of the Forsaken": 3,
    "Stoneform": 2,
    "Escape Artist": 2,
    "War Stomp": 2,
    "Blood Fury": 2,
    "Hardiness": 1.5,
    "Perception": 1.5,
    "Berserking": 1.5,
    "Shatter Curse": 1.5,
    "Endurance": 1.5,
    "Eureka!": 1.5,
    "Shadowmeld": 1,
    "Elune’s Light": 1,
    "Wind Blessed": 1,
    "Touch of the Grave": 1,
    "Rapid Regeneration": 0.5,
    "Walk on Air": 0.5,
  },
};

// Only capabilities at or above this weight are flagged when neither partner brings them.
export const GAP_WEIGHT_THRESHOLD = 2.5;

export const MAX_REASONS = 3;

export const tierCutoffs = [
  { min: 85, label: "Excellent" },
  { min: 70, label: "Strong" },
  { min: 50, label: "Good" },
  { min: 0, label: "Workable" },
] as const;

export type Tier = (typeof tierCutoffs)[number]["label"];
