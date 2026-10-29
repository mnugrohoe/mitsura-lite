"use client";

import { useFilter } from "@/components/filter/use-filter";
import { InventoryResult, searchInventory } from "./actions";
import { inventoryFilter } from "@/features/inventory/filter.config";
import { FilterBar } from "@/components/filter/filter-bar";
import { Table } from "./table";

export function InventoryView({ initial }: { initial: InventoryResult }) {
  const f = useFilter(inventoryFilter, initial, searchInventory);
  const { rows, total, page, pageSize } = f.data;
  return (
    <>
      <div className="flex">
        <div className="text-xl font-semibold flex-1">Inventory Report</div>
        <div className="flex-1">
          <FilterBar cfg={inventoryFilter} filter={f} />
        </div>
      </div>
      <Table
        data={rows}
        meta={{ total, page, pageSize }}
        pending={f.pending}
        onPageChange={f.goToPage}
      />
    </>
  );
}
