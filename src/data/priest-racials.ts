import type { RaceId } from "@/data/forever";

// Priest-only racial spells are separate from each race's four general racials.
// Blizzard's October class deep dive is the source for descriptions and cooldowns.
// Wowhead's beta tooltips still show 10 minutes for Divine Grace and Contingency Plan,
// while Blizzard specifies 5 minutes. The result-page tooltip notice covers this gap.
export interface PriestRacialSpell {
  name: string;
  description: string;
  spellId: number;
}

export const priestRacials: Partial<Record<RaceId, readonly [PriestRacialSpell, PriestRacialSpell]>> = {
  human: [
    { name: "Divine Grace", description: "Instantly heals an ally below 50% Health and removes Weakened Soul. Cannot target yourself. 5 min cooldown.", spellId: 1277370 },
    { name: "Feedback", description: "For 15 sec, spells cast against you burn the attacker's Mana and deal Shadow damage. 3 min cooldown.", spellId: 13896 },
  ],
  dwarf: [
    { name: "Desperate Prayer", description: "Instantly heals yourself. 10 min cooldown.", spellId: 13908 },
    { name: "Chastise", description: "Damages and immobilizes a Humanoid for 2 sec. 2 min cooldown.", spellId: 1277331 },
  ],
  "night-elf": [
    { name: "Starshards", description: "Channels Arcane damage for 6 sec. 30 sec cooldown.", spellId: 10797 },
    { name: "Elune’s Grace", description: "Reduces the chance for melee and ranged attacks to hit you by 50% for 15 sec or until 3 attacks miss. 5 min cooldown.", spellId: 2651 },
  ],
  gnome: [
    { name: "Confounding Flash", description: "Confuses up to 5 nearby enemies for 3 sec; damage breaks the effect. 0.5 sec cast, 2 min cooldown.", spellId: 1277455 },
    { name: "Contingency Plan", description: "Wards an ally for 30 sec. Falling below 35% Health triggers an absorb shield and healing over time. Stacks with Renew and Power Word: Shield. 5 min cooldown.", spellId: 1277462 },
  ],
  troll: [
    { name: "Hex of Weakness", description: "Reduces a target's melee Attack Power and healing received by 20% for 2 min.", spellId: 9035 },
    { name: "Shadowguard", description: "For up to 10 min, the next 3 attacks against you cause Shadow damage to the attacker.", spellId: 18137 },
  ],
  undead: [
    { name: "Touch of Weakness", description: "Your next attacker in melee takes Shadow damage and has reduced melee Attack Power for 2 min.", spellId: 2652 },
    { name: "Dark Sacrifice", description: "Converts your own Health into Mana over 15 sec; Spirit increases the Mana gained. 10 min cooldown.", spellId: 1277324 },
  ],
};
