import type { Faction } from "@/data/forever";

export const QUIZ_VERSION = "1.0.0";

export type QuestionId = `q${number}`;

export interface QuizOption {
  id: string;
  label: string;
  description?: string;
  factions?: Faction[];
}

export interface QuizQuestion {
  id: QuestionId;
  prompt: string;
  eyebrow: string;
  type: "single" | "ranked";
  helper?: string;
  options: QuizOption[];
}

export const questions: QuizQuestion[] = [
  {
    id: "q1", eyebrow: "Your history", type: "single",
    prompt: "When did you first start playing WoW?",
    helper: "This helps us understand what kind of toolkit may feel natural—not how skilled you are.",
    options: [
      { id: "never", label: "Never", description: "Forever would be my first adventure in Azeroth." },
      { id: "modern", label: "Modern WoW", description: "Dragonflight, The War Within, Midnight, or recently." },
      { id: "bfa-shadowlands", label: "Battle for Azeroth or Shadowlands" },
      { id: "mists-legion", label: "Mists of Pandaria through Legion" },
      { id: "original-cata", label: "Original WoW through Cataclysm" },
      { id: "many-eras", label: "Across several eras", description: "I have played different versions over the years." },
    ],
  },
  {
    id: "q2", eyebrow: "Your banner", type: "single",
    prompt: "Where do you want to play?",
    options: [
      { id: "alliance", label: "Alliance", description: "Honor, tradition, and hard-won unity." },
      { id: "horde", label: "Horde", description: "Strength, survival, and chosen bonds." },
      { id: "either", label: "No preference", description: "Let the rest of my answers decide." },
    ],
  },
  {
    id: "q3", eyebrow: "Your priorities", type: "ranked",
    prompt: "Rank up to three parts of Forever you’re most excited about.",
    helper: "Choose in order. Your first pick matters most.",
    options: [
      { id: "leveling", label: "Questing & leveling" },
      { id: "dungeons", label: "Dungeons" },
      { id: "raids", label: "Raids" },
      { id: "pvp", label: "PvP" },
      { id: "professions", label: "Professions & the economy" },
      { id: "exploration", label: "Exploration, lore & collecting" },
    ],
  },
  {
    id: "q4", eyebrow: "Your contribution", type: "ranked",
    prompt: "Rank up to three contributions you’d most enjoy making to a group.",
    helper: "You can stop after one if there is a clear winner.",
    options: [
      { id: "protect", label: "Protect others", description: "Hold enemies’ attention and take the pressure." },
      { id: "heal", label: "Keep allies alive" },
      { id: "damage", label: "Deal heavy damage" },
      { id: "control", label: "Control enemies & support teammates" },
      { id: "adapt", label: "Adapt to whatever the group needs" },
    ],
  },
  {
    id: "q5", eyebrow: "Your combat", type: "ranked",
    prompt: "Rank up to three ways you’d most enjoy fighting.",
    options: [
      { id: "heavy-melee", label: "Heavy, durable melee" },
      { id: "quick-melee", label: "Quick, mobile melee" },
      { id: "ranged-companion", label: "Ranged weapons & a companion" },
      { id: "ranged-magic", label: "Ranged spellcasting" },
      { id: "adaptable", label: "Adaptable forms & abilities" },
    ],
  },
  {
    id: "q6", eyebrow: "Your instinct", type: "single",
    prompt: "When a fight breaks out, what feels most natural?",
    options: [
      { id: "dive", label: "Dive into the fray", description: "Act quickly and create momentum." },
      { id: "measured-close", label: "Read it, then get close", description: "Commit once I understand the situation." },
      { id: "second-line", label: "Stay just behind the frontline", description: "Watch, react, and support." },
      { id: "backline", label: "Hang back and act deliberately", description: "I want room to read the whole fight." },
      { id: "shift", label: "Move wherever I’m needed", description: "Change position as the fight changes." },
    ],
  },
  {
    id: "q7", eyebrow: "Your company", type: "single",
    prompt: "How do you feel about pets or summoned companions?",
    options: [
      { id: "central", label: "They’re central to the fantasy" },
      { id: "optional", label: "Enjoyable, but optional" },
      { id: "none", label: "I prefer a self-contained character" },
    ],
  },
  {
    id: "q8", eyebrow: "Your journey", type: "ranked",
    prompt: "Rank up to three adventures that sound most satisfying.",
    options: [
      { id: "solo", label: "Quiet progress at my own pace" },
      { id: "duo", label: "Exploring with one trusted partner" },
      { id: "small-group", label: "A small group where everyone has a job" },
      { id: "large-group", label: "A large, coordinated team" },
      { id: "open-world", label: "Dropping into whatever the world brings" },
    ],
  },
  {
    id: "q9", eyebrow: "Your fantasy", type: "ranked",
    prompt: "Rank up to three class fantasies that pull you in most.",
    options: [
      { id: "martial", label: "Weapons & armor" },
      { id: "ranger", label: "Wilderness ranger" },
      { id: "nature", label: "Nature & shapeshifting" },
      { id: "elements", label: "Elements & totems" },
      { id: "holy", label: "Holy devotion" },
      { id: "arcane", label: "Arcane knowledge" },
      { id: "shadow", label: "Shadow & demons" },
      { id: "stealth", label: "Stealth & cunning" },
    ],
  },
  {
    id: "q10", eyebrow: "Under pressure", type: "single",
    prompt: "Your plan starts falling apart. What do you instinctively try first?",
    options: [
      { id: "finish", label: "Create an opening and finish it quickly" },
      { id: "endure", label: "Stay steady until the danger passes" },
      { id: "break-free", label: "Shake off whatever is limiting me" },
      { id: "reposition", label: "Reposition and find safer ground" },
      { id: "recover", label: "Recover and keep moving" },
      { id: "resource", label: "Find a resource or tool others missed" },
    ],
  },
  {
    id: "q11", eyebrow: "Your people", type: "ranked",
    prompt: "Rank up to three peoples you can most imagine your character belonging to.",
    helper: "Choose by identity and fantasy, not racial math.",
    options: [
      { id: "human", label: "Human", description: "Versatile, determined, and classically heroic.", factions: ["alliance"] },
      { id: "dwarf", label: "Dwarf", description: "Stout, industrious, and grounded in tradition.", factions: ["alliance"] },
      { id: "night-elf", label: "Night Elf", description: "Ancient, graceful, and bound to the wilds.", factions: ["alliance"] },
      { id: "gnome", label: "Gnome", description: "Inventive, curious, and underestimated.", factions: ["alliance"] },
      { id: "orc", label: "Orc", description: "Direct, resilient, and fiercely honorable.", factions: ["horde"] },
      { id: "undead", label: "Undead", description: "Defiant, dark, and impossible to keep down.", factions: ["horde"] },
      { id: "tauren", label: "Tauren", description: "Grounded, powerful, and close to the natural world.", factions: ["horde"] },
      { id: "troll", label: "Troll", description: "Cunning, relentless, and steeped in old magic.", factions: ["horde"] },
      { id: "skyborne", label: "Skyborne", description: "New, windswept, and shaped by elemental or arcane traditions.", factions: ["alliance", "horde"] },
      { id: "no-race-preference", label: "No strong preference", description: "Let my playstyle decide." },
    ],
  },
  {
    id: "q12", eyebrow: "Your dealbreaker", type: "single",
    prompt: "Which drawback would bother you most?",
    options: [
      { id: "responsibility", label: "Being expected to tank or heal" },
      { id: "companion", label: "Relying on a pet or minion" },
      { id: "melee", label: "Being mostly in melee range" },
      { id: "casting", label: "Standing back to cast" },
      { id: "forms", label: "Managing forms or different modes" },
      { id: "setup", label: "Relying on stealth or setup" },
      { id: "none", label: "None of these is a dealbreaker" },
    ],
  },
];

export const questionById = Object.fromEntries(questions.map((question) => [question.id, question])) as Record<QuestionId, QuizQuestion>;
