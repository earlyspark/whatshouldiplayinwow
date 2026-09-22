import { describe, expect, it } from "vitest";
import { capabilityWeights, racialPairingValue } from "@/data/pairings-config";
import { isValidCombination, raceById, races, type Faction } from "@/data/forever";
import { specById, specs, specsForClass, type SpecId } from "@/data/specs";
import { bestRace, PAIRING_MODES, rankPartners, rawPairScore, tierFor } from "@/lib/pairings";

const factions: Faction[] = ["alliance", "horde"];
const topIds = (specId: SpecId, faction: Faction, mode: "pve" | "pvp", count: number) =>
  rankPartners(specId, faction, mode).slice(0, count).map((row) => row.spec.id);

describe("spec data", () => {
  it("has three specs for every class", () => {
    for (const classId of new Set(specs.map((spec) => spec.classId))) {
      expect(specsForClass(classId)).toHaveLength(3);
    }
    expect(specs).toHaveLength(27);
  });

  it("gives every ability a weighted capability and a spell ID", () => {
    for (const spec of specs) {
      for (const ability of spec.abilities) {
        expect(capabilityWeights.pve[ability.capability]).toBeTypeOf("number");
        expect(ability.spellId).toBeGreaterThan(0);
      }
    }
  });

  it("only scores racials that exist in the race data", () => {
    const racialNames = new Set(races.flatMap((race) => race.racials.map((racial) => racial.name)));
    for (const mode of PAIRING_MODES) {
      for (const name of Object.keys(racialPairingValue[mode])) expect(racialNames).toContain(name);
    }
  });

  it("cites a spec talent instead of the class baseline for the same capability", () => {
    const burst = specById["priest-discipline"].abilities.filter((ability) => ability.capability === "burst");
    expect(burst.map((ability) => ability.name)).toEqual(["Power Infusion"]);
  });
});

describe("rankPartners", () => {
  it("suggests only same-faction races that can play the partner class", () => {
    for (const faction of factions) {
      for (const row of rankPartners("priest-discipline", faction)) {
        for (const mode of PAIRING_MODES) {
          expect(row[mode].races).toHaveLength(1);
          const race = raceById[row[mode].races[0].raceId];
          expect(race.faction).toBe(faction);
          expect(isValidCombination(race.id, row.spec.classId)).toBe(true);
        }
      }
    }
  });

  it("suggests one race per faction when no faction is chosen, without changing the ranking", () => {
    const open = rankPartners("mage-fire", null);
    for (const row of open) {
      expect(row.pve.races.map((race) => race.faction)).toEqual(["alliance", "horde"]);
    }
    const scores = (rows: typeof open) => rows.map((row) => [row.spec.id, row.pve.score, row.pvp.score]);
    expect(scores(open)).toEqual(scores(rankPartners("mage-fire", "horde")));
  });

  it("lists every spec as a potential partner in both factions", () => {
    for (const faction of factions) expect(rankPartners("mage-frost", faction)).toHaveLength(specs.length);
  });

  it("is deterministic", () => {
    expect(rankPartners("rogue-subtlety", "horde", "pvp")).toEqual(rankPartners("rogue-subtlety", "horde", "pvp"));
  });

  it("sorts by the chosen mode", () => {
    for (const mode of PAIRING_MODES) {
      const scores = rankPartners("warlock-affliction", "alliance", mode).map((row) => row[mode].score);
      expect(scores).toEqual([...scores].sort((x, y) => y - x));
    }
  });

  it("always explains the role fit, and cites abilities only from the partner's kit", () => {
    for (const mine of specs) {
      for (const row of rankPartners(mine.id, "alliance")) {
        for (const mode of PAIRING_MODES) {
          const [roleReason, ...abilityReasons] = row[mode].reasons;
          expect(roleReason.ability).toBeNull();
          expect(roleReason.text.length).toBeGreaterThan(0);
          for (const reason of abilityReasons) expect(row.spec.abilities).toContainEqual(reason.ability);
        }
      }
    }
  });

  it("keeps scores within 0–100", () => {
    for (const mine of specs) {
      for (const row of rankPartners(mine.id, "horde")) {
        for (const mode of PAIRING_MODES) {
          expect(row[mode].score).toBeGreaterThanOrEqual(0);
          expect(row[mode].score).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});

describe("pairing personas", () => {
  it("puts tanks near the top for a Discipline Priest in PvE", () => {
    const top = topIds("priest-discipline", "alliance", "pve", 3);
    expect(top).toEqual(expect.arrayContaining(["warrior-protection", "paladin-protection"]));
  });

  it("puts a healer first for a Protection Warrior in PvE", () => {
    expect(rankPartners("warrior-protection", "horde", "pve")[0].pve.partnerRole).toBe("healer");
  });

  it("favors healers for a Subtlety Rogue in PvP", () => {
    const top = rankPartners("rogue-subtlety", "alliance", "pvp").slice(0, 3);
    expect(top.every((row) => row.spec.role === "healer")).toBe(true);
  });

  it("scores Feral as a tank beside a healer in PvE and as melee in PvP", () => {
    const feral = rankPartners("priest-holy", "alliance").find((row) => row.spec.id === "druid-feral")!;
    expect(feral.pve.partnerRole).toBe("tank");
    expect(feral.pvp.partnerRole).toBe("melee");
  });

  it("rates two healers below a healer with a tank", () => {
    const disc = specById["priest-discipline"];
    expect(rawPairScore(disc, specById["priest-holy"], "pve")).toBeLessThan(rawPairScore(disc, specById["warrior-protection"], "pve"));
  });

  it("flags missing healing for two pure damage dealers in PvE", () => {
    const rogue = rankPartners("rogue-combat", "horde").find((row) => row.spec.id === "warrior-arms")!;
    expect(rogue.pve.gaps).toContain("a way to heal between pulls");
  });

  it("does not credit mana support to a rage or energy class", () => {
    const row = rankPartners("warrior-arms", "alliance").find((item) => item.spec.id === "mage-frost")!;
    expect(row.pve.reasons.some((reason) => reason.ability?.capability === "mana-support")).toBe(false);
  });
});

describe("bestRace", () => {
  it("prefers a stun or fear break for PvP", () => {
    expect(bestRace("rogue", "alliance", "pvp")?.raceId).toBe("human");
    expect(bestRace("priest", "horde", "pvp")?.raceId).toBe("undead");
  });

  it("uses the only race option when a faction has one", () => {
    expect(bestRace("paladin", "horde", "pve")?.raceId).toBe("undead");
    expect(bestRace("shaman", "alliance", "pve")?.raceId).toBe("dwarf");
  });
});

describe("tierFor", () => {
  it("maps scores to fixed tiers", () => {
    expect(tierFor(100)).toBe("Excellent");
    expect(tierFor(85)).toBe("Excellent");
    expect(tierFor(84)).toBe("Strong");
    expect(tierFor(50)).toBe("Good");
    expect(tierFor(0)).toBe("Workable");
  });
});
