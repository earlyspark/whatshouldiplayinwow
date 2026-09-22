import type { ClassId } from "@/data/forever";

// Talent data comes from the Wowhead Forever talent calculator, which Wowhead labels as BlizzCon test data until a beta client is datamined.
export const SPEC_DATA_CHECKED_AT = "2026-09-22";

export const SPEC_DATA_SOURCES = [
  { label: "Wowhead — Forever Talent Calculator", url: "https://www.wowhead.com/forever/talent-calc" },
  {
    label: "World of Warcraft: Forever — Deep Dive Panel Recap",
    url: "https://worldofwarcraft.blizzard.com/en-us/news/24303313/world-of-warcraft-forever-deep-dive-panel-recap",
  },
] as const;

export type Role = "tank" | "healer" | "melee" | "ranged";

export type Capability =
  | "rez"
  | "battle-rez"
  | "dispel-magic"
  | "dispel-curse"
  | "dispel-poison"
  | "dispel-disease"
  | "purge"
  | "interrupt"
  | "stun"
  | "hard-cc"
  | "root-slow"
  | "peel"
  | "stealth"
  | "burst"
  | "aoe-damage"
  | "off-heal"
  | "self-heal"
  | "external-defensive"
  | "mana-support"
  | "healing-reduction"
  | "fear-protection"
  | "movement-freedom"
  | "pet"
  | "party-buff"
  | "travel-utility";

export interface SpecAbility {
  capability: Capability;
  name: string;
  spellId: number;
}

export interface SpecProfile {
  id: SpecId;
  classId: ClassId;
  name: string;
  role: Role;
  altRoles?: Role[];
  abilities: SpecAbility[];
}

export type SpecId =
  | "druid-balance" | "druid-feral" | "druid-restoration"
  | "hunter-beast-mastery" | "hunter-marksmanship" | "hunter-survival"
  | "mage-arcane" | "mage-fire" | "mage-frost"
  | "paladin-holy" | "paladin-protection" | "paladin-retribution"
  | "priest-discipline" | "priest-holy" | "priest-shadow"
  | "rogue-assassination" | "rogue-combat" | "rogue-subtlety"
  | "shaman-elemental" | "shaman-enhancement" | "shaman-restoration"
  | "warlock-affliction" | "warlock-demonology" | "warlock-destruction"
  | "warrior-arms" | "warrior-fury" | "warrior-protection";

const a = (capability: Capability, name: string, spellId: number): SpecAbility => ({ capability, name, spellId });

const classKits: Record<ClassId, SpecAbility[]> = {
  druid: [
    a("battle-rez", "Rebirth", 20484),
    a("dispel-curse", "Remove Curse", 2782),
    a("dispel-poison", "Abolish Poison", 2893),
    a("root-slow", "Entangling Roots", 339),
    a("mana-support", "Innervate", 29166),
    a("party-buff", "Mark of the Wild", 1126),
  ],
  hunter: [
    a("root-slow", "Concussive Shot", 5116),
    a("hard-cc", "Freezing Trap", 1499),
    a("travel-utility", "Aspect of the Pack", 13159),
  ],
  mage: [
    a("dispel-curse", "Remove Lesser Curse", 475),
    a("hard-cc", "Polymorph", 118),
    a("interrupt", "Counterspell", 2139),
    a("root-slow", "Frost Nova", 122),
    a("mana-support", "Conjure Water", 5504),
    a("party-buff", "Arcane Intellect", 1459),
  ],
  paladin: [
    a("dispel-magic", "Cleanse", 4987),
    a("dispel-poison", "Cleanse", 4987),
    a("dispel-disease", "Cleanse", 4987),
    a("rez", "Redemption", 7328),
    a("stun", "Hammer of Justice", 853),
    a("external-defensive", "Blessing of Protection", 1022),
    a("movement-freedom", "Blessing of Freedom", 1044),
    a("party-buff", "Blessing of Kings", 20217),
  ],
  priest: [
    a("dispel-magic", "Dispel Magic", 527),
    a("purge", "Dispel Magic", 527),
    a("dispel-disease", "Abolish Disease", 552),
    a("rez", "Resurrection", 2006),
    a("hard-cc", "Psychic Scream", 8122),
    a("external-defensive", "Power Word: Shield", 17),
    a("fear-protection", "Fear Ward", 6346),
    a("party-buff", "Power Word: Fortitude", 1243),
  ],
  rogue: [
    a("interrupt", "Kick", 1766),
    a("hard-cc", "Blind", 2094),
    a("stun", "Kidney Shot", 408),
    a("stealth", "Stealth", 1784),
    a("root-slow", "Crippling Poison", 3408),
    a("healing-reduction", "Wound Poison", 13219),
  ],
  shaman: [
    a("purge", "Purge", 370),
    a("dispel-poison", "Cure Poison", 526),
    a("dispel-disease", "Cure Disease", 2870),
    a("rez", "Ancestral Spirit", 2008),
    a("interrupt", "Earth Shock", 8042),
    a("root-slow", "Frost Shock", 8056),
    a("mana-support", "Mana Spring Totem", 5675),
    a("fear-protection", "Tremor Totem", 8143),
    a("external-defensive", "Grounding Totem", 8177),
    a("party-buff", "Windfury Totem", 8512),
  ],
  warlock: [
    a("hard-cc", "Fear", 5782),
    a("battle-rez", "Create Soulstone", 693),
    a("self-heal", "Drain Life", 689),
    a("pet", "Summon Imp", 688),
    a("interrupt", "Spell Lock", 19244),
    a("dispel-magic", "Devour Magic", 19505),
  ],
  warrior: [
    a("interrupt", "Pummel", 6552),
    a("root-slow", "Hamstring", 1715),
    a("hard-cc", "Intimidating Shout", 5246),
    a("stun", "Intercept", 20252),
    a("party-buff", "Battle Shout", 6673),
  ],
};

type SpecDefinition = Omit<SpecProfile, "abilities"> & { talents: SpecAbility[] };

const definitions: SpecDefinition[] = [
  { id: "druid-balance", classId: "druid", name: "Balance", role: "ranged", talents: [
    a("aoe-damage", "Hurricane", 16914),
    a("peel", "Improved Entangling Roots", 16918),
    a("off-heal", "Regrowth", 8936),
  ] },
  { id: "druid-feral", classId: "druid", name: "Feral", role: "melee", altRoles: ["tank"], talents: [
    a("stealth", "Prowl", 5215),
    a("stun", "Bash", 5211),
    a("interrupt", "Feral Charge", 1238122),
    a("burst", "Berserk", 417141),
    a("aoe-damage", "Swipe", 779),
    a("off-heal", "Regrowth", 8936),
  ] },
  { id: "druid-restoration", classId: "druid", name: "Restoration", role: "healer", talents: [] },
  { id: "hunter-beast-mastery", classId: "hunter", name: "Beast Mastery", role: "ranged", talents: [
    a("pet", "Bestial Wrath", 19574),
    a("stun", "Intimidation", 19577),
    a("self-heal", "Spirit Bond", 19578),
  ] },
  { id: "hunter-marksmanship", classId: "hunter", name: "Marksmanship", role: "ranged", talents: [
    a("hard-cc", "Scatter Shot", 19503),
    a("burst", "Rapid Fire", 3045),
    a("party-buff", "Trueshot Aura", 1299346),
    a("aoe-damage", "Multi-Shot", 2643),
  ] },
  { id: "hunter-survival", classId: "hunter", name: "Survival", role: "melee", talents: [
    a("pet", "Call Pet", 883),
    a("peel", "Entrapment", 19184),
    a("root-slow", "Counterattack", 19306),
  ] },
  { id: "mage-arcane", classId: "mage", name: "Arcane", role: "ranged", talents: [
    a("burst", "Arcane Power", 12042),
    a("aoe-damage", "Arcane Explosion", 1449),
  ] },
  { id: "mage-fire", classId: "mage", name: "Fire", role: "ranged", talents: [
    a("burst", "Combustion", 11129),
    a("aoe-damage", "Blast Wave", 11113),
    a("stun", "Impact", 11103),
  ] },
  { id: "mage-frost", classId: "mage", name: "Frost", role: "ranged", talents: [
    a("peel", "Frostbite", 11071),
    a("aoe-damage", "Blizzard", 10),
  ] },
  { id: "paladin-holy", classId: "paladin", name: "Holy", role: "healer", talents: [] },
  { id: "paladin-protection", classId: "paladin", name: "Protection", role: "tank", talents: [
    a("aoe-damage", "Consecration", 26573),
    a("off-heal", "Flash of Light", 19750),
  ] },
  { id: "paladin-retribution", classId: "paladin", name: "Retribution", role: "melee", talents: [
    a("hard-cc", "Repentance", 20066),
    a("off-heal", "Flash of Light", 19750),
  ] },
  { id: "priest-discipline", classId: "priest", name: "Discipline", role: "healer", talents: [
    a("burst", "Power Infusion", 10060),
  ] },
  { id: "priest-holy", classId: "priest", name: "Holy", role: "healer", talents: [] },
  { id: "priest-shadow", classId: "priest", name: "Shadow", role: "ranged", talents: [
    a("interrupt", "Silence", 15487),
    a("off-heal", "Vampiric Embrace", 15286),
    a("self-heal", "Vampiric Embrace", 15286),
    a("peel", "Improved Mind Flay", 1225139),
  ] },
  { id: "rogue-assassination", classId: "rogue", name: "Assassination", role: "melee", talents: [
    a("burst", "Cold Blood", 14177),
  ] },
  { id: "rogue-combat", classId: "rogue", name: "Combat", role: "melee", talents: [
    a("burst", "Adrenaline Rush", 13750),
    a("aoe-damage", "Blade Flurry", 13877),
  ] },
  { id: "rogue-subtlety", classId: "rogue", name: "Subtlety", role: "melee", talents: [
    a("burst", "Premeditation", 14183),
    a("hard-cc", "Sap", 6770),
  ] },
  { id: "shaman-elemental", classId: "shaman", name: "Elemental", role: "ranged", talents: [
    a("burst", "Lava Burst", 408490),
    a("aoe-damage", "Chain Lightning", 421),
    a("peel", "Earthbound", 1222988),
    a("off-heal", "Healing Wave", 331),
  ] },
  { id: "shaman-enhancement", classId: "shaman", name: "Enhancement", role: "melee", talents: [
    a("burst", "Rage of the Farseer", 425336),
    a("off-heal", "Healing Wave", 331),
  ] },
  { id: "shaman-restoration", classId: "shaman", name: "Restoration", role: "healer", talents: [] },
  { id: "warlock-affliction", classId: "warlock", name: "Affliction", role: "ranged", talents: [
    a("peel", "Curse of Exhaustion", 18223),
  ] },
  { id: "warlock-demonology", classId: "warlock", name: "Demonology", role: "ranged", talents: [
    a("hard-cc", "Improved Sayaad", 18754),
  ] },
  { id: "warlock-destruction", classId: "warlock", name: "Destruction", role: "ranged", talents: [
    a("burst", "Shadowburn", 17877),
    a("aoe-damage", "Rain of Fire", 5740),
    a("stun", "Pyroclasm", 18073),
  ] },
  { id: "warrior-arms", classId: "warrior", name: "Arms", role: "melee", talents: [
    a("healing-reduction", "Mortal Strike", 12294),
    a("peel", "Improved Hamstring", 12289),
    a("aoe-damage", "Sweeping Strikes", 12292),
  ] },
  { id: "warrior-fury", classId: "warrior", name: "Fury", role: "melee", talents: [
    a("burst", "Death Wish", 12328),
    a("peel", "Piercing Howl", 12323),
    a("aoe-damage", "Whirlwind", 1680),
    a("self-heal", "Blood Craze", 16487),
  ] },
  { id: "warrior-protection", classId: "warrior", name: "Protection", role: "tank", talents: [
    a("purge", "Shield Slam", 23922),
    a("stun", "Concussion Blow", 12809),
    a("aoe-damage", "Thunder Clap", 6343),
  ] },
];

export const specs: SpecProfile[] = definitions.map(({ talents, ...spec }) => {
  const talentCaps = new Set(talents.map((ability) => ability.capability));
  // A spec talent replaces the class baseline for the same capability so reasons cite the spec's signature ability.
  const baseline = classKits[spec.classId].filter((ability) => !talentCaps.has(ability.capability));
  return { ...spec, abilities: [...talents, ...baseline] };
});

export const specById = Object.fromEntries(specs.map((spec) => [spec.id, spec])) as Record<SpecId, SpecProfile>;

export function specsForClass(classId: ClassId) {
  return specs.filter((spec) => spec.classId === classId);
}

export function specRoles(spec: SpecProfile): Role[] {
  return [spec.role, ...(spec.altRoles ?? [])];
}

export function isSpecId(value: string): value is SpecId {
  return Object.hasOwn(specById, value);
}
