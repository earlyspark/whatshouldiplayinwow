import type { RaceId } from "@/data/forever";

// These are the racial spell links in Wowhead's Forever combinations guide.
// Not every announced racial has a linked spell page yet, and some linked spell
// tooltips still show older values than the guide's current racial table.
const racialSpellIds: Partial<Record<RaceId, Record<string, number>>> = {
  human: { "Perception": 20600, "Sword Specialization": 20597, "The Human Spirit": 20598 },
  dwarf: { "Find Treasure": 2481, "Stoneform": 20594 },
  "night-elf": { "Wisp Spirit": 20585, "Quickness": 20582, "Shadowmeld": 20580 },
  gnome: { "Expansive Mind": 20591, "Engineering Specialization": 20593, "Escape Artist": 20589 },
  orc: { "Blood Fury": 20572, "Hardiness": 20573, "Axe Specialization": 20574 },
  undead: { "Cannibalize": 20577, "Will of the Forsaken": 7744, "Underwater Breathing": 5227 },
  tauren: { "Cultivation": 20552, "Endurance": 20550, "War Stomp": 20549 },
  troll: { "Beast Slaying": 20557, "Berserking": 20554 },
};

export function wowheadRacialUrl(raceId: string, racialName: string) {
  const spellId = racialSpellIds[raceId as RaceId]?.[racialName];
  return spellId ? `https://www.wowhead.com/forever/spell=${spellId}` : null;
}
