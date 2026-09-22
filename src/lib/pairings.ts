import {
  capabilityWeights,
  GAP_WEIGHT_THRESHOLD,
  MAX_REASONS,
  racialPairingValue,
  roleSynergy,
  tierCutoffs,
  type PairingMode,
  type Tier,
} from "@/data/pairings-config";
import { classById, races, type ClassId, type Faction, type RaceId } from "@/data/forever";
import { specById, specRoles, specs, type Capability, type Role, type SpecAbility, type SpecId, type SpecProfile } from "@/data/specs";

export const PAIRING_MODES: PairingMode[] = ["pve", "pvp"];

export interface PairingReason {
  ability: SpecAbility | null;
  text: string;
}

export interface RaceSuggestion {
  faction: Faction;
  raceId: RaceId;
  racial: string | null;
}

export interface PairingModeResult {
  score: number;
  partnerRole: Role;
  tier: Tier;
  races: RaceSuggestion[];
  reasons: PairingReason[];
  gaps: string[];
}

export interface PairingRow {
  spec: SpecProfile;
  className: string;
  pve: PairingModeResult;
  pvp: PairingModeResult;
}

// Capabilities a class can't benefit from, so a partner providing them adds nothing.
const noMana: ClassId[] = ["warrior", "rogue"];

const capabilityPhrase: Record<Capability, string> = {
  "rez": "brings you back after a wipe.",
  "battle-rez": "can revive you mid-fight.",
  "dispel-magic": "removes harmful magic from you.",
  "dispel-curse": "removes curses from you.",
  "dispel-poison": "cures your poisons.",
  "dispel-disease": "cures your diseases.",
  "purge": "strips enemy buffs.",
  "interrupt": "interrupts enemy casts.",
  "stun": "adds another stun.",
  "hard-cc": "locks down an extra enemy.",
  "root-slow": "slows or roots enemies.",
  "peel": "keeps melee off you.",
  "stealth": "lets you choose when fights start.",
  "burst": "adds a burst window.",
  "aoe-damage": "handles packs of enemies.",
  "off-heal": "can patch you up between fights.",
  "self-heal": "sustains itself, so you can keep pulling.",
  "external-defensive": "can protect you in an emergency.",
  "mana-support": "cuts down your drinking breaks.",
  "healing-reduction": "cuts enemy healing.",
  "fear-protection": "protects you from fear.",
  "movement-freedom": "frees you from slows and roots.",
  "pet": "brings a pet that takes hits.",
  "party-buff": "adds a group buff.",
  "travel-utility": "speeds up your travel.",
};

const gapNoun: Partial<Record<Capability, string>> = {
  "rez": "an out-of-combat resurrection",
  "dispel-magic": "a magic dispel",
  "purge": "a purge",
  "interrupt": "an interrupt",
  "stun": "a stun",
  "hard-cc": "hard crowd control",
  "peel": "strong peel",
  "burst": "a burst cooldown",
  "external-defensive": "an emergency defensive for the other",
  "healing-reduction": "healing reduction",
};

const ROLE_MULTIPLIER = 3;

const isDamage = (role: Role) => role === "melee" || role === "ranged";

function roleReason(mode: PairingMode, mine: Role, partner: Role): string {
  const roles = [mine, partner];
  const has = (role: Role) => roles.includes(role);
  const damageCount = roles.filter(isDamage).length;
  if (mode === "pve") {
    if (has("tank") && has("healer")) return "Tank and healer: the core of a dungeon group, with only damage slots left to fill.";
    if (has("healer") && damageCount === 1) return "Healing is built in, so tougher quests and elites stay manageable.";
    if (has("tank") && damageCount === 1) return "One of you holds enemy attention while the other deals damage.";
    if (damageCount === 2) return "Two damage dealers kill quickly but lean on food, bandages, or off-heals.";
    if (mine === "healer") return "Two healers are very safe but slow to kill.";
    return "Two tanks are durable but slow, and one would switch roles for dungeons.";
  }
  if (has("healer") && damageCount === 1) return "A healer keeping a damage dealer alive is the classic battleground pocket pair.";
  if (has("tank") && has("healer")) return "Hard to kill, which suits carrying flags and holding bases.";
  if (has("melee") && has("ranged")) return "Melee pressure plus ranged damage attacks from two angles.";
  if (damageCount === 2) return "Two damage dealers can burst a target down together, but nobody heals.";
  if (has("tank") && damageCount === 1) return "The tank soaks pressure and peels while the damage dealer works.";
  if (mine === "healer") return "Very hard to kill, but you'll struggle to finish opponents.";
  return "Durable, but with little kill pressure.";
}

function capabilitySet(spec: SpecProfile) {
  return new Set(spec.abilities.map((ability) => ability.capability));
}

function addedAbilities(mine: SpecProfile, partner: SpecProfile) {
  const mineCaps = capabilitySet(mine);
  const seen = new Set<Capability>();
  return partner.abilities.filter((ability) => {
    const cap = ability.capability;
    if (mineCaps.has(cap) || seen.has(cap)) return false;
    if (cap === "off-heal" && mine.role === "healer") return false;
    if (cap === "mana-support" && noMana.includes(mine.classId)) return false;
    seen.add(cap);
    return true;
  });
}

// Dual-role specs (Feral) take whichever role pairing fits the pair best.
export function bestRoles(mine: SpecProfile, partner: SpecProfile, mode: PairingMode) {
  let best = { mine: mine.role, partner: partner.role, value: -Infinity };
  for (const mineRole of specRoles(mine)) {
    for (const partnerRole of specRoles(partner)) {
      const value = roleSynergy[mode][mineRole][partnerRole];
      if (value > best.value) best = { mine: mineRole, partner: partnerRole, value };
    }
  }
  return best;
}

export function rawPairScore(mine: SpecProfile, partner: SpecProfile, mode: PairingMode) {
  const weights = capabilityWeights[mode];
  const utility = addedAbilities(mine, partner).reduce((sum, ability) => sum + weights[ability.capability], 0);
  // Role fit is tripled so a strong role pairing outranks a partner that only brings extra utility.
  return bestRoles(mine, partner, mode).value * ROLE_MULTIPLIER + utility;
}

const maxRawScore: Record<PairingMode, number> = Object.fromEntries(
  PAIRING_MODES.map((mode) => [mode, Math.max(...specs.flatMap((mine) => specs.map((partner) => rawPairScore(mine, partner, mode))))]),
) as Record<PairingMode, number>;

export function normalizedScore(mine: SpecProfile, partner: SpecProfile, mode: PairingMode) {
  return Math.round((100 * rawPairScore(mine, partner, mode)) / maxRawScore[mode]);
}

export function tierFor(score: number): Tier {
  return tierCutoffs.find((cutoff) => score >= cutoff.min)!.label;
}

export function racesFor(classId: ClassId, faction: Faction) {
  return races.filter((race) => race.faction === faction && race.classes.includes(classId));
}

export function bestRace(classId: ClassId, faction: Faction, mode: PairingMode) {
  const values = racialPairingValue[mode];
  let best: { raceId: RaceId; racial: string | null; value: number } | null = null;
  for (const race of racesFor(classId, faction)) {
    const ranked = race.racials.map((racial) => ({ name: racial.name, value: values[racial.name] ?? 0 })).sort((x, y) => y.value - x.value);
    const value = ranked.reduce((sum, racial) => sum + racial.value, 0);
    // Strictly greater keeps the earlier race on ties, so the suggestion is stable.
    if (!best || value > best.value) best = { raceId: race.id, racial: ranked[0]?.value ? ranked[0].name : null, value };
  }
  return best;
}

function gapsFor(mine: SpecProfile, partner: SpecProfile, mode: PairingMode) {
  const covered = new Set([...capabilitySet(mine), ...capabilitySet(partner)]);
  const gaps: string[] = [];
  if (mode === "pve" && mine.role !== "healer" && partner.role !== "healer" && !covered.has("off-heal") && !covered.has("self-heal")) {
    gaps.push("a way to heal between pulls");
  }
  const weights = capabilityWeights[mode];
  const missing = (Object.keys(gapNoun) as Capability[])
    .filter((cap) => weights[cap] >= GAP_WEIGHT_THRESHOLD && !covered.has(cap))
    .sort((x, y) => weights[y] - weights[x]);
  for (const cap of missing.slice(0, 2)) gaps.push(gapNoun[cap]!);
  return gaps;
}

const FACTIONS: Faction[] = ["alliance", "horde"];

// Without a faction the spec ranking is unchanged; the pair just gets one race suggestion per faction.
function modeResult(mine: SpecProfile, partner: SpecProfile, factions: Faction[], mode: PairingMode): PairingModeResult | null {
  const suggestions = factions.flatMap((faction) => {
    const race = bestRace(partner.classId, faction, mode);
    return race ? [{ faction, raceId: race.raceId, racial: race.racial }] : [];
  });
  if (!suggestions.length) return null;
  const weights = capabilityWeights[mode];
  const topAbilities = addedAbilities(mine, partner)
    .filter((ability) => weights[ability.capability] > 0)
    .sort((x, y) => weights[y.capability] - weights[x.capability])
    .slice(0, MAX_REASONS);
  const score = normalizedScore(mine, partner, mode);
  const roles = bestRoles(mine, partner, mode);
  return {
    score,
    partnerRole: roles.partner,
    tier: tierFor(score),
    races: suggestions,
    reasons: [
      { ability: null, text: roleReason(mode, roles.mine, roles.partner) },
      ...topAbilities.map((ability) => ({ ability, text: capabilityPhrase[ability.capability] })),
    ],
    gaps: gapsFor(mine, partner, mode),
  };
}

export function rankPartners(mySpecId: SpecId, faction: Faction | null, sortBy: PairingMode = "pve"): PairingRow[] {
  const mine = specById[mySpecId];
  const factions = faction ? [faction] : FACTIONS;
  const rows: PairingRow[] = [];
  for (const partner of specs) {
    const pve = modeResult(mine, partner, factions, "pve");
    const pvp = modeResult(mine, partner, factions, "pvp");
    if (pve && pvp) rows.push({ spec: partner, className: classById[partner.classId].name, pve, pvp });
  }
  const other: PairingMode = sortBy === "pve" ? "pvp" : "pve";
  const order = new Map(specs.map((spec, index) => [spec.id, index]));
  return rows.sort((x, y) =>
    y[sortBy].score - x[sortBy].score || y[other].score - x[other].score || order.get(x.spec.id)! - order.get(y.spec.id)!,
  );
}
