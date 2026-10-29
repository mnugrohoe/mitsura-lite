"use server";
import { getInventoryPage } from "@/features/inventory/queries";
import { inventoryFilter } from "@/features/inventory/filter.config";
import { resolveFilter, type FilterState } from "@/lib/filter-config";

export async function searchInventory(input: FilterState, page = 1) {
  const { state, domain } = resolveFilter(inventoryFilter, input);
  const data = await getInventoryPage({
    filter: { domain },
    page: Math.max(1, Math.floor(Number(page)) || 1),
  });
  return { ...data, state };
}
export type InventoryResult = Awaited<ReturnType<typeof searchInventory>>;
