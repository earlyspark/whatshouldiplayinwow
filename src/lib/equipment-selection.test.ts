import { describe, expect, it } from "vitest";
import { selectQuizEquipment } from "@/lib/equipment-selection";
import type { AmazonProduct, EquipmentGroup } from "@/lib/amazon";

const product = (asin: string): AmazonProduct => ({ asin, title: asin, url: `https://www.amazon.com/dp/${asin}?tag=test-20`, imageUrl: null, imageWidth: null, imageHeight: null });

describe("quiz equipment rotation", () => {
  const groups: EquipmentGroup[] = [
    { category: "stream-controller", products: [product("A"), product("B"), product("C")] },
    { category: "mmo-mouse", products: [product("D"), product("E")] },
    { category: "mechanical-keyboard", products: [] },
    { category: "1440p-monitor", products: [product("F")] },
    { category: "gaming-chair", products: [product("G")] },
    { category: "desk-mat", products: [product("H")] },
  ];

  it("shows one product from each of the requested number of distinct categories", () => {
    const picks = selectQuizEquipment(groups, 0, -1, 4);
    expect(picks.map(({ category }) => category)).toEqual(["stream-controller", "mmo-mouse", "1440p-monitor", "gaming-chair"]);
    expect(picks.map(({ product }) => product.asin)).toEqual(["A", "D", "F", "G"]);
  });

  it("rotates categories and products on each question", () => {
    const next = selectQuizEquipment(groups, 0, 0, 4);
    expect(next.map(({ category }) => category)).toEqual(["desk-mat", "stream-controller", "mmo-mouse", "1440p-monitor"]);
    expect(next.map(({ product }) => product.asin)).toEqual(["H", "B", "E", "F"]);
  });

  it("never repeats a category when fewer are available than requested", () => {
    const picks = selectQuizEquipment(groups, 3, -1, 8);
    expect(new Set(picks.map(({ category }) => category)).size).toBe(5);
  });

  it("returns nothing when no category has products", () => {
    expect(selectQuizEquipment([{ category: "desk-mat", products: [] }], 0, -1)).toEqual([]);
  });
});
