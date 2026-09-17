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
  ];

  it("keeps one item per available category and rotates each question", () => {
    const first = selectQuizEquipment(groups, 0, -1);
    const second = selectQuizEquipment(groups, 0, 0);
    expect(first.map(({ product }) => product.asin)).toEqual(["A", "D", "F"]);
    expect(second.map(({ product }) => product.asin)).toEqual(["B", "E", "F"]);
    expect(first.map(({ category }) => category)).toEqual(["stream-controller", "mmo-mouse", "1440p-monitor"]);
  });
});
