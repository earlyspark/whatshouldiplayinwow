import { PAIRINGS_VERSION, type PairingMode } from "@/data/pairings-config";
import { classById, raceById } from "@/data/forever";
import { specById } from "@/data/specs";
import { withArticle } from "@/lib/article";
import { rankPartners, type PairingRow } from "@/lib/pairings";
import type { PairingSelection } from "@/lib/pairings-params";

export const SHARE_TOP_COUNT = 3;

export const genericShare = {
  title: "WoW Forever Spec Pairings for Teammates in PvE and PvP",
  description: "Already know what class you want to play in WoW Forever? See which specs pair best with yours for PvE and PvP.",
  imageAlt: "WoW Forever best spec pairings for teammates in PvE and PvP",
};

export interface SelectionShare {
  label: string;
  title: string;
  description: string;
  imageAlt: string;
  heading: string;
  top: Record<PairingMode, PairingRow[]>;
}

export function selectionLabel(selection: PairingSelection) {
  if (!selection.specId) return null;
  const spec = specById[selection.specId];
  const race = selection.raceId ? `${raceById[selection.raceId].name} ` : "";
  return `${race}${spec.name} ${classById[spec.classId].name}`;
}

export function selectionShare(selection: PairingSelection): SelectionShare | null {
  const label = selectionLabel(selection);
  if (!label || !selection.specId) return null;
  const top = {
    pve: rankPartners(selection.specId, selection.faction, "pve").slice(0, SHARE_TOP_COUNT),
    pvp: rankPartners(selection.specId, selection.faction, "pvp").slice(0, SHARE_TOP_COUNT),
  };
  const names = (rows: PairingRow[]) => rows.map((row) => `${row.spec.name} ${row.className}`).join(", ");
  const subject = withArticle(label);
  return {
    label,
    title: `WoW Forever Spec Pairings for ${subject}`,
    description: `Best in PvE: ${names(top.pve)}. Best in PvP: ${names(top.pvp)}.`,
    imageAlt: `Top PvE and PvP spec pairings for ${subject} in WoW Forever`,
    heading: `How specs pair with ${subject}`,
    top,
  };
}

// Only the fields that change the image go into its URL, plus a version so scoring changes refresh cached unfurls.
export function shareImagePath(selection: PairingSelection) {
  const params = new URLSearchParams();
  if (selection.specId) params.set("spec", selection.specId);
  if (selection.raceId) params.set("race", selection.raceId);
  else if (selection.specId && selection.faction) params.set("faction", selection.faction);
  params.set("v", PAIRINGS_VERSION);
  return `/pairings/share-image?${params.toString()}`;
}

export function toParamReader(searchParams: Record<string, string | string[] | undefined>) {
  return {
    get(name: string) {
      const value = searchParams[name];
      return (Array.isArray(value) ? value[0] : value) ?? null;
    },
  };
}
