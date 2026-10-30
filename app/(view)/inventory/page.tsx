import { inventoryFilter } from "@/features/inventory/filter.config";
import { searchInventory } from "@/features/inventory/actions";
import { InventoryView } from "@/features/inventory/view";
import { defaultState } from "@/lib/filter-config";
import { Suspense } from "react";

export default function InventoryPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Suspense fallback={<InventorySkeleton />}>
        <Initial />
      </Suspense>
    </div>
  );
}

async function Initial() {
  return (
    <InventoryView
      initial={await searchInventory(defaultState(inventoryFilter))}
    />
  );
}

function InventorySkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}
