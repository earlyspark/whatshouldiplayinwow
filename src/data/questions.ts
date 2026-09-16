export const QUIZ_VERSION = "1.15.0";

export type QuestionId = `q${number}`;

export interface QuizOption {
  id: string;
  label: string;
  description?: string;
}

export interface QuizQuestion {
  id: QuestionId;
  prompt: string;
  type: "single" | "ranked";
  maxRank?: 2 | 3;
  helper?: string;
  options: QuizOption[];
}

export const questions: QuizQuestion[] = [
  {
    id: "q1", type: "single",
    prompt: "When did you first start playing WoW?",
    helper: "Some racials need timing, and some classes offer an easier start. This is a small clue, not a skill test.",
    options: [
      { id: "vanilla-wrath", label: "Vanilla WoW through Wrath of the Lich King", description: "Vanilla, The Burning Crusade, Wrath of the Lich King." },
      { id: "cata-legion", label: "Cataclysm through Legion", description: "Cataclysm, Mists of Pandaria, Warlords of Draenor, Legion." },
      { id: "bfa-shadowlands", label: "Battle for Azeroth or Shadowlands" },
      { id: "modern", label: "Modern WoW", description: "Dragonflight, The War Within, Midnight, or recently." },
      { id: "never", label: "Never", description: "Forever would be my first adventure in Azeroth." },
    ],
  },
  {
    id: "q2", type: "single",
    prompt: "Which faction do you lean toward?",
    helper: "We'll favor your choice, but a strong match on the other side can still win.",
    options: [
      { id: "alliance", label: "Alliance", description: "Light be with you" },
      { id: "horde", label: "Horde", description: "Go with honor" },
      { id: "either", label: "No preference", description: "Let the rest of my answers decide." },
    ],
  },
  {
    id: "q3", type: "ranked",
    prompt: "Rank up to three parts of Forever you’re most excited about.",
    helper: "Choose in order. Your first pick matters most.",
    options: [
      { id: "leveling", label: "Questing & leveling" },
      { id: "dungeons", label: "Dungeons" },
      { id: "raids", label: "Raids" },
      { id: "pvp", label: "PvP" },
      { id: "professions", label: "Crafting & the economy" },
      { id: "exploration", label: "Exploration, lore & collecting" },
      { id: "vibes", label: "Community & the vibes" },
    ],
  },
  {
    id: "q4", type: "ranked",
    prompt: "Rank up to three contributions you’d most enjoy making to a group.",
    helper: "You can stop after one if there is a clear winner.",
    options: [
      { id: "protect", label: "Protect others", description: "Take hits, shield allies, or have a companion draw danger away." },
      { id: "heal", label: "Keep allies alive" },
      { id: "damage", label: "Deal heavy damage" },
      { id: "control", label: "Disrupt enemies and create openings" },
      { id: "adapt", label: "Adapt to whatever the group needs", description: "Switch between damage, healing, or frontline jobs." },
    ],
  },
  {
    id: "q5", type: "ranked",
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
    id: "q6", type: "single",
    prompt: "When a fight gets unpredictable, how do you respond?",
    options: [
      { id: "act-fast", label: "Act fast and create an opening", description: "I trust my instincts and like to set the pace." },
      { id: "wait-opening", label: "Wait for the right moment", description: "I watch for an opportunity before committing." },
      { id: "help-ally", label: "Help whoever needs me most", description: "I react to what my teammates need." },
      { id: "stick-plan", label: "Stay steady and stick to the plan", description: "I prefer a deliberate approach when things get messy." },
      { id: "improvise", label: "Adapt as the fight changes", description: "I enjoy switching tactics on the fly." },
    ],
  },
  {
    id: "q7", type: "single",
    prompt: "How do you feel about pets or summoned companions?",
    options: [
      { id: "central", label: "They’re central to the fantasy" },
      { id: "optional", label: "Enjoyable, but optional" },
      { id: "none", label: "I prefer a self-contained character" },
    ],
  },
  {
    id: "q8", type: "ranked",
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
    id: "q9", type: "ranked", maxRank: 2,
    prompt: "Rank up to two character fantasies that pull you in most.",
    options: [
      { id: "martial", label: "Steel & daring", description: "Weapons, courage, and taking action." },
      { id: "wilds", label: "Wilds & primal forces", description: "Living lands, storms, and untamed power." },
      { id: "holy", label: "Faith & conviction", description: "Belief, purpose, and standing for something." },
      { id: "arcane", label: "Magic & knowledge", description: "Learning secrets and mastering powerful ideas." },
      { id: "secrets", label: "Shadows & secrets", description: "Mystery, cunning, and hidden power." },
    ],
  },
  {
    id: "q10", type: "single",
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
    id: "q11", type: "single",
    prompt: "Which atmosphere appeals to you most?",
    options: [
      { id: "woodland-mystery", label: "Living forests & moonlit groves", description: "Green trails, ancient trees, and nature magic." },
      { id: "haunted-glades", label: "Haunted glades & shadowed ruins", description: "Ghostly woods, graveyards, and forbidden magic." },
      { id: "mountain-outposts", label: "Snowy mountains & bustling outposts" },
      { id: "open-frontier", label: "Open horizons & rugged frontiers" },
      { id: "no-zone-preference", label: "No strong preference" },
    ],
  },
  {
    id: "q12", type: "ranked",
    prompt: "Rank up to three things that would annoy you most.",
    helper: "Choose in order. Pick “None of these” on its own if nothing stands out.",
    options: [
      { id: "downtime", label: "Stopping to recover after just a few fights" },
      { id: "prep", label: "Doing a lot of setup before the fun starts" },
      { id: "cornered", label: "Feeling stuck when a fight goes sideways" },
      { id: "repetition", label: "Doing the same thing in every fight" },
      { id: "juggling", label: "Keeping track of too many things at once" },
      { id: "none", label: "None of these really bother me" },
    ],
  },
  {
    id: "q13", type: "single",
    prompt: "What matters more in the class you play?",
    options: [
      { id: "focused", label: "A defined playstyle with clear strengths and limits, even if I cannot fill many jobs" },
      { id: "flexible", label: "Room to change jobs or tactics as the group and fight change, even if there is more to manage" },
      { id: "either", label: "I could enjoy either" },
    ],
  },
];

export const questionById = Object.fromEntries(questions.map((question) => [question.id, question])) as Record<QuestionId, QuizQuestion>;
