import type { ClassId, RaceId } from "@/data/forever";

const racialSpellIds: Partial<Record<RaceId, Record<string, number>>> = {
  human: { "Will to Survive": 1259718, "Perception": 20600, "Sword Specialization": 20597, "The Human Spirit": 20598 },
  dwarf: { "Find Treasure": 2481, "Stoneform": 20594, "Mace Specialization": 1259719, "Big Game Hunter": 1259721 },
  "night-elf": { "Elune’s Light": 1259799, "Wisp Spirit": 20585, "Quickness": 20582, "Shadowmeld": 20580 },
  gnome: { "Expansive Mind": 20591, "Engineering Specialization": 20593, "Escape Artist": 20589 },
  orc: { "Blood Fury": 20572, "Shatter Curse": 1299026, "Hardiness": 20573, "Axe Specialization": 20574 },
  undead: { "Cannibalize": 20577, "Will of the Forsaken": 7744, "Underwater Breathing": 5227 },
  tauren: { "Cultivation": 20552, "Endurance": 20550, "War Stomp": 20549, "Plainsrunning": 1259918 },
  troll: { "Beast Slaying": 20557, "Berserking": 20554, "Rapid Regeneration": 1260270, "Regeneration": 20555 },
  "skyborne-alliance": { "Walk on Air": 1259416, "Read Ley Line": 1259705, "Wind Blessed": 1259710, "Elemental Insight": 1259707 },
  "skyborne-horde": { "Walk on Air": 1259416, "Skysight": 1259686, "Wind Blessed": 1259710, "Elemental Insight": 1259707 },
};

const gnomeEureka: Partial<Record<ClassId, number>> = {
  mage: 1259817, priest: 1259823, rogue: 1259812, warlock: 1259821, warrior: 1259813,
};
const gnomeExpansiveMind: Partial<Record<ClassId, number>> = {
  mage: 20591, priest: 20591, rogue: 1259803, warlock: 20591, warrior: 1259802,
};
const undeadTouchOfTheGrave: Partial<Record<ClassId, number>> = {
  mage: 1260201, paladin: 1260189, priest: 1260201, rogue: 1260189, warlock: 1260201, warrior: 1260189,
};

export function wowheadRacialUrl(raceId: string, racialName: string, classId?: string) {
  const id = classId as ClassId;
  const spellId = raceId === "gnome" && racialName === "Eureka!" ? gnomeEureka[id] :
    raceId === "gnome" && racialName === "Expansive Mind" ? gnomeExpansiveMind[id] :
    raceId === "undead" && racialName === "Touch of the Grave" ? undeadTouchOfTheGrave[id] :
    racialSpellIds[raceId as RaceId]?.[racialName];
  return spellId ? `https://www.wowhead.com/forever/spell=${spellId}` : null;
}
