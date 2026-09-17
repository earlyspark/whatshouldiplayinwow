import { describe, expect, it } from "vitest";
import { races } from "@/data/forever";
import { wowheadRacialUrl } from "@/lib/wowhead-tooltips";

describe("Forever racial tooltips", () => {
  it("links every racial for every playable race and class pair", () => {
    for (const race of races) {
      for (const classId of race.classes) {
        for (const racial of race.racials) {
          expect(wowheadRacialUrl(race.id, racial.name, classId), `${race.id}/${classId}/${racial.name}`).toMatch(/^https:\/\/www\.wowhead\.com\/forever\/spell=\d+$/);
        }
      }
    }
    expect(wowheadRacialUrl("human", "The Human Spirit")).toBe("https://www.wowhead.com/forever/spell=20598");
    expect(wowheadRacialUrl("human", "Perception")).toBe("https://www.wowhead.com/forever/spell=20600");
    expect(wowheadRacialUrl("undead", "Underwater Breathing")).toBe("https://www.wowhead.com/forever/spell=5227");
    expect(wowheadRacialUrl("undead", "Will of the Forsaken")).toBe("https://www.wowhead.com/forever/spell=7744");
    expect(wowheadRacialUrl("tauren", "War Stomp")).toBe("https://www.wowhead.com/forever/spell=20549");
    expect(wowheadRacialUrl("troll", "Beast Slaying")).toBe("https://www.wowhead.com/forever/spell=20557");
    expect(wowheadRacialUrl("troll", "Rapid Regeneration")).toBe("https://www.wowhead.com/forever/spell=1260270");
    expect(wowheadRacialUrl("troll", "Regeneration")).toBe("https://www.wowhead.com/forever/spell=20555");
    expect(wowheadRacialUrl("night-elf", "Elune’s Light")).toBe("https://www.wowhead.com/forever/spell=1259799");
    expect(wowheadRacialUrl("night-elf", "Shadowmeld")).toBe("https://www.wowhead.com/forever/spell=20580");
    expect(wowheadRacialUrl("gnome", "Eureka!", "priest")).toBe("https://www.wowhead.com/forever/spell=1259823");
    expect(wowheadRacialUrl("gnome", "Eureka!", "rogue")).toBe("https://www.wowhead.com/forever/spell=1259812");
    expect(wowheadRacialUrl("gnome", "Expansive Mind", "warrior")).toBe("https://www.wowhead.com/forever/spell=1259802");
    expect(wowheadRacialUrl("undead", "Touch of the Grave", "paladin")).toBe("https://www.wowhead.com/forever/spell=1260189");
    expect(wowheadRacialUrl("undead", "Touch of the Grave", "priest")).toBe("https://www.wowhead.com/forever/spell=1260201");
    expect(wowheadRacialUrl("skyborne-alliance", "Walk on Air")).toBe("https://www.wowhead.com/forever/spell=1259416");
    expect(wowheadRacialUrl("skyborne-horde", "Walk on Air")).toBe("https://www.wowhead.com/forever/spell=1259416");
    expect(wowheadRacialUrl("orc", "The Human Spirit")).toBeNull();
  });
});
