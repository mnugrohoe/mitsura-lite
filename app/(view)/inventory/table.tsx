"use client";

import { DataTable } from "@/components/ui/data-table";
import type { InventoryRow } from "@/features/inventory/definitions";
import type { Meta } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { columns } from "./columns";

export function Table({
  data,
  meta,
  pending,
  onPageChange,
}: {
  data: InventoryRow[];
  meta: Meta;
  pending?: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col transition-opacity",
        pending && "opacity-60",
      )}
    >
      <DataTable
        columns={columns}
        data={data}
        pagination={{ meta, onChange: onPageChange, disabled: pending }}
      />
    </div>
  );
}
