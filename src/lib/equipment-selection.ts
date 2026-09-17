import type { AmazonProduct, EquipmentCategory, EquipmentGroup } from "@/lib/amazon";

export function selectQuizEquipment(groups: EquipmentGroup[], visitOffset: number, questionIndex: number):
  { product: AmazonProduct; category: EquipmentCategory }[] {
  const step = Math.max(0, questionIndex + 1);
  return groups.flatMap((group) => {
    const choices = group.products;
    return choices.length ? [{ product: choices[(visitOffset + step) % choices.length], category: group.category }] : [];
  });
}
