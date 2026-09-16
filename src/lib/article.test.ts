import { describe, expect, it } from "vitest";
import { races } from "@/data/forever";
import { indefiniteArticle, withArticle } from "@/lib/article";

describe("indefinite article", () => {
  it("uses 'an' before vowel sounds and 'a' before consonant sounds", () => {
    expect(withArticle("Orc Warrior")).toBe("an Orc Warrior");
    expect(withArticle("Undead Mage")).toBe("an Undead Mage");
    expect(withArticle("Human Paladin")).toBe("a Human Paladin");
    expect(withArticle("Tauren Druid")).toBe("a Tauren Druid");
    expect(withArticle("Night Elf Rogue")).toBe("a Night Elf Rogue");
  });

  it("respects sound over spelling", () => {
    expect(indefiniteArticle("hour")).toBe("an");
    expect(indefiniteArticle("unicorn")).toBe("a");
    expect(indefiniteArticle("eulogy")).toBe("a");
  });

  it("assigns an article to every configured race", () => {
    for (const race of races) {
      expect(["a", "an"]).toContain(indefiniteArticle(race.name));
    }
    expect(indefiniteArticle("Orc")).toBe("an");
    expect(indefiniteArticle("High Order Skyborne")).toBe("a");
  });
});
