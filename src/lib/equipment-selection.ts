import type { AmazonProduct, EquipmentCategory, EquipmentGroup } from "@/lib/amazon";

/** Picks `count` distinct categories and one product from each; both rotate with every question. */
export function selectQuizEquipment(groups: EquipmentGroup[], visitOffset: number, questionIndex: number, count = 4):
  { product: AmazonProduct; category: EquipmentCategory }[] {
  const available = groups.filter((group) => group.products.length);
  if (!available.length) return [];
  const step = Math.max(0, questionIndex + 1);
  const shown = Math.min(count, available.length);
  const first = (visitOffset + step * shown) % available.length;
  return Array.from({ length: shown }, (_, slot) => {
    const group = available[(first + slot) % available.length];
    return { product: group.products[(visitOffset + step) % group.products.length], category: group.category };
  });
}
