"use client";

import { cn } from "cn";
import { useFilter } from "@/components/filter/use-filter";
import { FilterBar } from "@/components/filter/filter-bar";
import { DataTable } from "@/components/ui/data-table";
import { InventoryResult, searchInventory } from "./actions";
import { inventoryFilter } from "./filter.config";
import { columns } from "./columns";

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

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col transition-opacity",
          f.pending && "opacity-60",
        )}
      >
        <DataTable
          columns={columns}
          data={rows}
          pagination={{
            meta: { total, page, pageSize },
            onChange: f.goToPage,
            disabled: f.pending,
          }}
        />
      </div>
    </>
  );
}
