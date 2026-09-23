import type { PairingMode } from "@/data/pairings-config";
import { classById, isValidCombination, raceById, type ClassId, type Faction, type RaceId } from "@/data/forever";
import { isSpecId, specById, specs, type Role, type SpecId } from "@/data/specs";

export type RoleFilter = "all" | "tank" | "healer" | "dps";

export interface PairingSelection {
  classId: ClassId | null;
  specId: SpecId | null;
  raceId: RaceId | null;
  faction: Faction | null;
  sort: PairingMode;
  role: RoleFilter;
}

export const roleFilters: RoleFilter[] = ["all", "tank", "healer", "dps"];
// Links shared before the filter merged melee and ranged into one DPS option.
const legacyRoleFilters: Record<string, RoleFilter> = { melee: "dps", ranged: "dps" };

export function matchesRoleFilter(roles: Role[], filter: RoleFilter) {
  if (filter === "all") return true;
  if (filter === "dps") return roles.includes("melee") || roles.includes("ranged");
  return roles.includes(filter);
}

interface ParamReader { get(name: string): string | null }

// Spec name before class, matching how players search ("protection-warrior").
const slugBySpec = Object.fromEntries(
  specs.map((spec) => [spec.id, `${spec.name}-${spec.classId}`.toLowerCase().replace(/\s+/g, "-")]),
) as Record<SpecId, string>;
const specBySlug = Object.fromEntries(Object.entries(slugBySpec).map(([id, slug]) => [slug, id])) as Record<string, SpecId>;

export function specSlug(specId: SpecId) {
  return slugBySpec[specId];
}

export function specIdFromSlug(slug: string): SpecId | null {
  return Object.hasOwn(specBySlug, slug) ? specBySlug[slug] : null;
}

// Drops any value that doesn't fit the rest of the selection, so a hand-edited URL can't produce an illegal pair.
export function parsePairingParams(params: ParamReader, pathSpecId: SpecId | null = null): PairingSelection {
  const specParam = params.get("spec");
  const spec = pathSpecId ? specById[pathSpecId] : specParam && isSpecId(specParam) ? specById[specParam] : null;
  const classParam = params.get("class");
  const classId = spec?.classId ?? (classParam && Object.hasOwn(classById, classParam) ? (classParam as ClassId) : null);
  const raceParam = params.get("race");
  const raceId = raceParam && Object.hasOwn(raceById, raceParam) && (!classId || isValidCombination(raceParam as RaceId, classId))
    ? (raceParam as RaceId)
    : null;
  const factionParam = params.get("faction");
  const faction: Faction | null = raceId
    ? raceById[raceId].faction
    : factionParam === "alliance" || factionParam === "horde" ? factionParam : null;
  const roleParam = params.get("role");
  const role = roleParam ? legacyRoleFilters[roleParam] ?? roleFilters.find((filter) => filter === roleParam) : undefined;
  return {
    classId,
    specId: spec?.id ?? null,
    raceId,
    faction,
    sort: params.get("sort") === "pvp" ? "pvp" : "pve",
    role: role ?? "all",
  };
}

export function pairingSearchString(selection: PairingSelection, { specInPath = false } = {}) {
  const params = new URLSearchParams();
  if (!specInPath || !selection.specId) {
    if (selection.classId) params.set("class", selection.classId);
    if (selection.specId) params.set("spec", selection.specId);
  }
  if (selection.raceId) params.set("race", selection.raceId);
  else if (selection.faction) params.set("faction", selection.faction);
  if (selection.sort !== "pve") params.set("sort", selection.sort);
  if (selection.role !== "all") params.set("role", selection.role);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function pairingPath(selection: PairingSelection) {
  if (!selection.specId) return `/pairings${pairingSearchString(selection)}`;
  return `/pairings/${specSlug(selection.specId)}${pairingSearchString(selection, { specInPath: true })}`;
}
