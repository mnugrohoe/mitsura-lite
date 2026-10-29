"use server";

import { getInventoryPage } from "@/features/inventory/queries";
import { buildDomain, sanitize, type FilterState } from "./filters";

export async function searchInventory(input: FilterState, page = 1) {
  const state = sanitize(input);
  const safePage = Math.max(1, Math.floor(Number(page)) || 1);

  // getInventory(domain, page) -> { rows, total }; di dalamnya pakai parseDomainFilter(domain)
  const data = await getInventoryPage({
    filter: { domain: buildDomain(state) },
    page: safePage,
  });

  // state dikembalikan supaya UI (badge, drawer) membaca dari hasil server
  return { ...data, state, page: safePage };
}

export type InventoryResult = Awaited<ReturnType<typeof searchInventory>>;
