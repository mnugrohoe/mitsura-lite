"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import type { InventoryRow } from "@/features/inventory/definitions";
import type { Meta } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { columns } from "./columns";

export function Table({ data, meta }: { data: InventoryRow[]; meta: Meta }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col transition-opacity",
        isPending && "opacity-60",
      )}
    >
      <DataTable
        columns={columns}
        data={data}
        pagination={{
          meta,
          onChange: (next) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", String(next));
            startTransition(() => {
              router.push(`${pathname}?${params.toString()}`);
            });
          },
        }}
      />
    </div>
  );
}
