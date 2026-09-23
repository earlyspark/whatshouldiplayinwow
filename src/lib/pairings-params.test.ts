import { describe, expect, it } from "vitest";
import { specs } from "@/data/specs";
import { matchesRoleFilter, pairingPath, pairingSearchString, parsePairingParams, specIdFromSlug, specSlug } from "@/lib/pairings-params";

const parse = (query: string) => parsePairingParams(new URLSearchParams(query));

describe("parsePairingParams", () => {
  it("defaults to an empty PvE selection with no faction", () => {
    expect(parse("")).toEqual({ classId: null, specId: null, raceId: null, faction: null, sort: "pve", role: "all" });
  });

  it("derives class from spec and faction from race", () => {
    expect(parse("spec=warlock-affliction&race=undead&faction=alliance")).toMatchObject({
      classId: "warlock",
      specId: "warlock-affliction",
      raceId: "undead",
      faction: "horde",
    });
  });

  it("keeps a result-page prefill of class and race without a spec", () => {
    expect(parse("class=priest&race=dwarf")).toMatchObject({ classId: "priest", specId: null, raceId: "dwarf", faction: "alliance" });
  });

  it("drops a race that can't play the class", () => {
    expect(parse("spec=paladin-holy&race=orc").raceId).toBeNull();
  });

  it("opens older melee and ranged filter links on the DPS filter", () => {
    expect(parse("role=melee").role).toBe("dps");
    expect(parse("role=ranged").role).toBe("dps");
    expect(parse("role=dps").role).toBe("dps");
  });

  it("rejects inherited object property names", () => {
    expect(parse("spec=toString&class=constructor&race=__proto__")).toEqual(parse(""));
    expect(parse("spec=priest-discipline&race=toString").raceId).toBeNull();
  });

  it("ignores unknown values", () => {
    expect(parse("spec=bard-lute&class=bard&sort=raid&role=support&faction=pirates")).toEqual(parse(""));
  });
});

describe("pairingSearchString", () => {
  it("round-trips a selection", () => {
    const selection = parse("spec=rogue-subtlety&faction=horde&sort=pvp&role=healer");
    expect(parsePairingParams(new URLSearchParams(pairingSearchString(selection)))).toEqual(selection);
  });

  it("omits defaults", () => {
    expect(pairingSearchString(parse(""))).toBe("");
  });
});

describe("spec slugs", () => {
  it("round-trips every spec with a unique slug", () => {
    const slugs = specs.map((spec) => specSlug(spec.id));
    expect(new Set(slugs).size).toBe(specs.length);
    for (const spec of specs) expect(specIdFromSlug(specSlug(spec.id))).toBe(spec.id);
  });

  it("puts the spec name before the class", () => {
    expect(specSlug("warrior-protection")).toBe("protection-warrior");
    expect(specSlug("hunter-beast-mastery")).toBe("beast-mastery-hunter");
  });

  it("rejects unknown slugs and inherited property names", () => {
    expect(specIdFromSlug("bard-lute")).toBeNull();
    expect(specIdFromSlug("share-image")).toBeNull();
    expect(specIdFromSlug("toString")).toBeNull();
  });

  it("prefers the spec from the path over the query", () => {
    expect(parsePairingParams(new URLSearchParams("spec=mage-fire&race=dwarf"), "warrior-protection")).toMatchObject({
      classId: "warrior",
      specId: "warrior-protection",
      raceId: "dwarf",
    });
  });
});

describe("pairingPath", () => {
  it("puts the spec in the path and keeps the rest in the query", () => {
    expect(pairingPath(parse("spec=warrior-protection&race=dwarf&sort=pvp&role=healer"))).toBe("/pairings/protection-warrior?race=dwarf&sort=pvp&role=healer");
    expect(pairingPath(parse("spec=shaman-restoration&faction=horde"))).toBe("/pairings/restoration-shaman?faction=horde");
  });

  it("stays on the main page without a spec", () => {
    expect(pairingPath(parse("class=priest&race=dwarf"))).toBe("/pairings?class=priest&race=dwarf");
    expect(pairingPath(parse(""))).toBe("/pairings");
  });
});

describe("matchesRoleFilter", () => {
  it("treats melee and ranged specs as DPS", () => {
    expect(matchesRoleFilter(["melee"], "dps")).toBe(true);
    expect(matchesRoleFilter(["ranged"], "dps")).toBe(true);
    expect(matchesRoleFilter(["healer"], "dps")).toBe(false);
    expect(matchesRoleFilter(["melee", "tank"], "tank")).toBe(true);
    expect(matchesRoleFilter(["tank"], "all")).toBe(true);
  });
});
