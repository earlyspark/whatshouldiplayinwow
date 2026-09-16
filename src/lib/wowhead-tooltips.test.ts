import { describe, expect, it } from "vitest";
import { races } from "@/data/forever";
import { wowheadRacialUrl } from "@/lib/wowhead-tooltips";

describe("Forever racial tooltips", () => {
  it("links the racial spell pages found in Wowhead's Forever guide", () => {
    const linked = races.flatMap((race) => race.racials.flatMap((racial) =>
      wowheadRacialUrl(race.id, racial.name) ? [`${race.id}:${racial.name}`] : [],
    ));
    expect(linked).toHaveLength(22);
    expect(new Set(linked.map((item) => item.split(":")[0]))).toEqual(
      new Set(["human", "dwarf", "night-elf", "gnome", "orc", "undead", "tauren", "troll"]),
    );
    expect(wowheadRacialUrl("human", "The Human Spirit")).toBe("https://www.wowhead.com/forever/spell=20598");
    expect(wowheadRacialUrl("human", "Perception")).toBe("https://www.wowhead.com/forever/spell=20600");
    expect(wowheadRacialUrl("undead", "Underwater Breathing")).toBe("https://www.wowhead.com/forever/spell=5227");
    expect(wowheadRacialUrl("undead", "Will of the Forsaken")).toBe("https://www.wowhead.com/forever/spell=7744");
    expect(wowheadRacialUrl("tauren", "War Stomp")).toBe("https://www.wowhead.com/forever/spell=20549");
    expect(wowheadRacialUrl("troll", "Beast Slaying")).toBe("https://www.wowhead.com/forever/spell=20557");
    expect(wowheadRacialUrl("night-elf", "Elune’s Light")).toBeNull();
    expect(wowheadRacialUrl("night-elf", "Shadowmeld")).toBe("https://www.wowhead.com/forever/spell=20580");
    expect(wowheadRacialUrl("gnome", "Eureka!")).toBeNull();
    expect(wowheadRacialUrl("skyborne-alliance", "Walk on Air")).toBeNull();
    expect(wowheadRacialUrl("orc", "The Human Spirit")).toBeNull();
  });
});
