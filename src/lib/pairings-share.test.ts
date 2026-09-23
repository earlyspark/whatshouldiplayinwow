import { describe, expect, it } from "vitest";
import { PAIRINGS_VERSION } from "@/data/pairings-config";
import { rankPartners } from "@/lib/pairings";
import { parsePairingParams } from "@/lib/pairings-params";
import { pairingsMetadata, selectionShare, shareImagePath, SHARE_TOP_COUNT, specHeading, toParamReader } from "@/lib/pairings-share";
import { siteUrl } from "@/lib/site-url";

const parse = (query: string) => parsePairingParams(new URLSearchParams(query));

describe("selectionShare", () => {
  it("returns nothing without a spec", () => {
    expect(selectionShare(parse("class=priest&race=dwarf"))).toBeNull();
  });

  it("names the race when one is chosen", () => {
    const share = selectionShare(parse("spec=priest-discipline&race=dwarf"))!;
    expect(share.title).toBe("What Pairs Well With a Dwarf Discipline Priest in WoW Forever?");
    expect(share.heading).toBe("How specs pair with a Dwarf Discipline Priest");
  });

  it("uses the right article", () => {
    expect(selectionShare(parse("spec=warrior-arms&race=orc"))!.title).toBe("What Pairs Well With an Orc Arms Warrior in WoW Forever?");
  });

  it("lists the same top pairings as the page", () => {
    const share = selectionShare(parse("spec=rogue-subtlety&faction=horde"))!;
    for (const mode of ["pve", "pvp"] as const) {
      const expected = rankPartners("rogue-subtlety", "horde", mode).slice(0, SHARE_TOP_COUNT).map((row) => row.spec.id);
      expect(share.top[mode].map((row) => row.spec.id)).toEqual(expected);
      for (const row of share.top[mode]) expect(share.description).toContain(`${row.spec.name} ${row.className}`);
    }
  });
});

describe("specHeading", () => {
  it("asks what pairs with the spec", () => {
    expect(specHeading("warrior-protection")).toBe("What pairs well with a Protection Warrior?");
    expect(specHeading("mage-arcane")).toBe("What pairs well with an Arcane Mage?");
  });
});

describe("pairingsMetadata", () => {
  it("canonicalizes a selection to its bare spec page", () => {
    const metadata = pairingsMetadata(parse("spec=warrior-protection&race=dwarf&sort=pvp"));
    expect(metadata.alternates?.canonical).toBe(`${siteUrl}/pairings/protection-warrior`);
    expect(metadata.openGraph?.url).toBe(`${siteUrl}/pairings/protection-warrior?race=dwarf`);
  });

  it("canonicalizes the main page without a spec", () => {
    expect(pairingsMetadata(parse("class=priest")).alternates?.canonical).toBe(`${siteUrl}/pairings`);
  });
});

describe("shareImagePath", () => {
  it("keeps only fields that change the image, plus the version", () => {
    const path = shareImagePath(parse("class=priest&spec=priest-discipline&race=dwarf&sort=pvp&role=healer"));
    expect(path).toBe(`/pairings/share-image?spec=priest-discipline&race=dwarf&v=${PAIRINGS_VERSION}`);
  });

  it("falls back to the generic image without a spec", () => {
    expect(shareImagePath(parse("faction=horde"))).toBe(`/pairings/share-image?v=${PAIRINGS_VERSION}`);
  });
});

describe("toParamReader", () => {
  it("reads the first value of repeated params", () => {
    expect(toParamReader({ spec: ["mage-fire", "mage-frost"] }).get("spec")).toBe("mage-fire");
    expect(toParamReader({}).get("spec")).toBeNull();
  });
});
