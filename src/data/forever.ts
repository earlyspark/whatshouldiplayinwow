export const DATA_VERSION = "2026-09";
export const DATA_CHECKED_AT = "2026-09-15";
export const DATA_CHECKED_LABEL = "September 2026";

export const DATA_SOURCES = [
  {
    label: "World of Warcraft: Forever — What’s Next Panel Recap",
    url: "https://worldofwarcraft.blizzard.com/en-us/news/24303862/world-of-warcraft-forever-whats-next-panel-recap",
  },
  {
    label: "World of Warcraft: Forever — Deep Dive Panel Recap",
    url: "https://worldofwarcraft.blizzard.com/en-us/news/24303313/world-of-warcraft-forever-deep-dive-panel-recap",
  },
  {
    label: "Wowhead — All Racials and Available Class-Race Combinations",
    url: "https://www.wowhead.com/forever/guide/new-race-class-combinations",
  },
] as const;

export type Faction = "alliance" | "horde";
export type ClassId =
  | "druid"
  | "hunter"
  | "mage"
  | "paladin"
  | "priest"
  | "rogue"
  | "shaman"
  | "warlock"
  | "warrior";
export type RaceId =
  | "human"
  | "dwarf"
  | "night-elf"
  | "gnome"
  | "orc"
  | "undead"
  | "tauren"
  | "troll"
  | "skyborne-alliance"
  | "skyborne-horde";

export interface ClassProfile {
  id: ClassId;
  name: string;
  tagline: string;
  summary: string;
}

export interface RacialTrait {
  name: string;
  description: string;
}

export interface RaceProfile {
  id: RaceId;
  name: string;
  shortName: string;
  faction: Faction;
  tagline: string;
  summary: string;
  racials: RacialTrait[];
  classes: ClassId[];
}

export const classes: ClassProfile[] = [
  { id: "druid", name: "Druid", tagline: "adaptable nature magic and shapeshifting", summary: "Druids reward players who like independence, exploration, and changing tools as the situation changes." },
  { id: "hunter", name: "Hunter", tagline: "ranged freedom with a loyal companion", summary: "Hunters are natural explorers with strong solo momentum, ranged pressure, and a close bond with their pet." },
  { id: "mage", name: "Mage", tagline: "deliberate ranged power and control", summary: "Mages suit players who like reading a fight from range, controlling space, and turning precise spell timing into impact." },
  { id: "paladin", name: "Paladin", tagline: "durable frontline support and holy purpose", summary: "Paladins combine sturdy melee presence with the ability to protect, recover, and support a group." },
  { id: "priest", name: "Priest", tagline: "decisive support from the back line", summary: "Priests excel for players who watch the whole fight, respond to danger, and enjoy keeping a group steady." },
  { id: "rogue", name: "Rogue", tagline: "fast melee decisions, control, and cunning", summary: "Rogues reward decisive players who enjoy positioning, disruption, and choosing exactly when to commit." },
  { id: "shaman", name: "Shaman", tagline: "reactive elemental power and group utility", summary: "Shamans bring an adaptable toolkit for players who like contributing damage, recovery, and timely support." },
  { id: "warlock", name: "Warlock", tagline: "methodical ranged pressure and summoned allies", summary: "Warlocks fit deliberate players who enjoy preparation, durable solo play, and fighting beside a summoned companion." },
  { id: "warrior", name: "Warrior", tagline: "direct martial action and frontline resolve", summary: "Warriors are for players who want to meet a fight head-on, master weapons, and create momentum through decisive action." },
];

export const races: RaceProfile[] = [
  {
    id: "human", name: "Human", shortName: "Human", faction: "alliance",
    tagline: "versatile resolve and classic heroism",
    summary: "Humans offer broadly useful tools for resisting control, detecting danger, and making the most of sword-based combat.",
    classes: ["hunter", "mage", "paladin", "priest", "rogue", "warlock", "warrior"],
    racials: [
      { name: "Will to Survive", description: "Removes a stun effect." },
      { name: "Perception", description: "Temporarily improves detection of stealthed enemies." },
      { name: "Sword Specialization", description: "Increases critical strike chance while using swords." },
      { name: "The Human Spirit", description: "Increases Spirit." },
    ],
  },
  {
    id: "dwarf", name: "Dwarf", shortName: "Dwarf", faction: "alliance",
    tagline: "stout defense, treasure, and craftsmanship",
    summary: "Dwarves combine a powerful defensive cleanse with practical exploration and situational combat advantages.",
    classes: ["hunter", "paladin", "priest", "rogue", "shaman", "warrior"],
    racials: [
      { name: "Stoneform", description: "Removes and grants temporary immunity to Bleeds, Poisons, and Diseases while reducing Physical damage taken." },
      { name: "Find Treasure", description: "Tracks nearby treasure alongside other tracking abilities." },
      { name: "Mace Specialization", description: "Increases critical strike chance while using a mace." },
      { name: "Big Game Hunter", description: "Increases damage dealt to Beasts." },
    ],
  },
  {
    id: "night-elf", name: "Night Elf", shortName: "Night Elf", faction: "alliance",
    tagline: "ancient grace, mobility, and ambush",
    summary: "Night Elves reward players drawn to nature, careful positioning, stealth, and short windows of heightened power.",
    classes: ["druid", "hunter", "priest", "rogue", "warrior"],
    racials: [
      { name: "Elune’s Light", description: "Temporarily increases critical strike chance." },
      { name: "Shadowmeld", description: "Grants stealth while immobile." },
      { name: "Quickness", description: "Increases dodge chance and run speed." },
      { name: "Wisp Spirit", description: "Greatly increases movement speed while dead." },
    ],
  },
  {
    id: "gnome", name: "Gnome", shortName: "Gnome", faction: "alliance",
    tagline: "inventive escapes and clever efficiency",
    summary: "Gnomes suit resourceful players who value breaking free, improving engineering, and finding smart bursts of efficiency.",
    classes: ["mage", "priest", "rogue", "warlock", "warrior"],
    racials: [
      { name: "Escape Artist", description: "Provides brief immunity to roots and snares." },
      { name: "Eureka!", description: "Reduces cost and increases damage or healing for the next few abilities." },
      { name: "Expansive Mind", description: "Increases maximum resource." },
      { name: "Engineering Specialization", description: "Makes engineering devices more reliable." },
    ],
  },
  {
    id: "orc", name: "Orc", shortName: "Orc", faction: "horde",
    tagline: "aggressive momentum and hardiness",
    summary: "Orcs fit decisive players who like offensive windows, resisting stuns, and meeting magical danger with force.",
    classes: ["hunter", "mage", "rogue", "shaman", "warlock", "warrior"],
    racials: [
      { name: "Blood Fury", description: "Temporarily increases Attack Power and Spell Power." },
      { name: "Shatter Curse", description: "Temporarily grants immunity to Curses and Banes and reduces Magical damage taken." },
      { name: "Hardiness", description: "Reduces stun duration." },
      { name: "Axe Specialization", description: "Increases critical strike chance while using axes." },
    ],
  },
  {
    id: "undead", name: "Undead", shortName: "Undead", faction: "horde",
    tagline: "dark resilience and self-reliance",
    summary: "Undead reward independent players who value recovery, resisting fear and control, and an unmistakably dark identity.",
    classes: ["mage", "paladin", "priest", "rogue", "warlock", "warrior"],
    racials: [
      { name: "Will of the Forsaken", description: "Removes Charm, Fear, and Sleep effects." },
      { name: "Cannibalize", description: "Restores Health and Mana while consuming a nearby corpse." },
      { name: "Touch of the Grave", description: "Attacks and spells can drain Health from the target." },
      { name: "Underwater Breathing", description: "Greatly extends underwater breath." },
    ],
  },
  {
    id: "tauren", name: "Tauren", shortName: "Tauren", faction: "horde",
    tagline: "grounded strength and natural abundance",
    summary: "Tauren bring extra durability, an emergency area stun, outdoor momentum, and a natural affinity for gathering herbs.",
    classes: ["druid", "hunter", "shaman", "warrior"],
    racials: [
      { name: "War Stomp", description: "Stuns nearby enemies for a short duration." },
      { name: "Endurance", description: "Increases total Health and hit chance." },
      { name: "Plainsrunning", description: "Builds movement speed while continuously moving." },
      { name: "Cultivation", description: "Grows bonus herbs that do not require Herbalism to gather." },
    ],
  },
  {
    id: "troll", name: "Troll", shortName: "Troll", faction: "horde",
    tagline: "relentless speed and regeneration",
    summary: "Trolls fit players who enjoy timed bursts of speed, strong recovery, and situational advantages against beasts.",
    classes: ["hunter", "mage", "priest", "rogue", "shaman", "warlock", "warrior"],
    racials: [
      { name: "Berserking", description: "Temporarily increases casting and attack speed." },
      { name: "Rapid Regeneration", description: "Regenerates a large portion of maximum Health over time." },
      { name: "Regeneration", description: "Allows part of normal Health regeneration to continue in combat." },
      { name: "Beast Slaying", description: "Increases damage dealt to Beasts." },
    ],
  },
  {
    id: "skyborne-alliance", name: "High Order Skyborne", shortName: "Skyborne", faction: "alliance",
    tagline: "arcane curiosity and aerial freedom",
    summary: "High Order Skyborne combine movement and haste with restorative ley-line utility and an arcane Alliance identity.",
    classes: ["druid", "hunter", "mage", "rogue", "warrior"],
    racials: [
      { name: "Walk on Air", description: "Glides downward through the air for a short duration." },
      { name: "Read Ley Line", description: "Activates a ley line for greatly increased Health and Mana regeneration." },
      { name: "Wind Blessed", description: "Increases melee, ranged, and spellcasting Haste." },
      { name: "Elemental Insight", description: "Increases damage dealt to Elementals." },
    ],
  },
  {
    id: "skyborne-horde", name: "Windshaper Skyborne", shortName: "Skyborne", faction: "horde",
    tagline: "elemental momentum and aerial freedom",
    summary: "Windshaper Skyborne combine movement and haste with a sustained travel blessing and an elemental Horde identity.",
    classes: ["druid", "hunter", "rogue", "shaman", "warrior"],
    racials: [
      { name: "Walk on Air", description: "Glides downward through the air for a short duration." },
      { name: "Skysight", description: "Receives an Elemental Blessing that increases run speed." },
      { name: "Wind Blessed", description: "Increases melee, ranged, and spellcasting Haste." },
      { name: "Elemental Insight", description: "Increases damage dealt to Elementals." },
    ],
  },
];

export const classById = Object.fromEntries(classes.map((item) => [item.id, item])) as Record<ClassId, ClassProfile>;
export const raceById = Object.fromEntries(races.map((item) => [item.id, item])) as Record<RaceId, RaceProfile>;

export function isValidCombination(raceId: RaceId, classId: ClassId) {
  return raceById[raceId].classes.includes(classId);
}
