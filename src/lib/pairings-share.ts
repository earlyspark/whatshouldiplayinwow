import type { Metadata } from "next";
import { PAIRINGS_VERSION, type PairingMode } from "@/data/pairings-config";
import { classById, raceById } from "@/data/forever";
import { specById, type SpecId } from "@/data/specs";
import { withArticle } from "@/lib/article";
import { rankPartners, type PairingRow } from "@/lib/pairings";
import { pairingPath, specSlug, type PairingSelection } from "@/lib/pairings-params";
import { siteUrl } from "@/lib/site-url";

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
    title: `What Pairs Well With ${subject} in WoW Forever?`,
    description: `Best in PvE: ${names(top.pve)}. Best in PvP: ${names(top.pvp)}.`,
    imageAlt: `Top PvE and PvP spec pairings for ${subject} in WoW Forever`,
    heading: `How specs pair with ${subject}`,
    top,
  };
}

export function specHeading(specId: SpecId) {
  const spec = specById[specId];
  return `What pairs well with ${withArticle(`${spec.name} ${classById[spec.classId].name}`)}?`;
}

// Canonical drops race, faction, sort and role so each spec is one indexed page; og:url keeps the shared selection so its unfurl matches.
export function pairingsMetadata(selection: PairingSelection): Metadata {
  const share = selectionShare(selection);
  const title = share?.title ?? genericShare.title;
  const description = share?.description ?? genericShare.description;
  const image = { url: shareImagePath(selection), width: 1200, height: 630, alt: share?.imageAlt ?? genericShare.imageAlt };
  const canonical = `${siteUrl}/pairings${selection.specId ? `/${specSlug(selection.specId)}` : ""}`;
  const url = share ? `${siteUrl}${pairingPath({ ...selection, sort: "pve", role: "all" })}` : canonical;
  return {
    // Absolute skips the layout suffix, which pushed the title past what Google shows.
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { title, description, type: "website", url, siteName: "What Should I Play?", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
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
