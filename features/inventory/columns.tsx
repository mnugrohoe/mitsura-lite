"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { DataTableFeatures } from "@/lib/data-table-features";
import type { InventoryRow } from "./definitions";

const columnHelper = createColumnHelper<DataTableFeatures, InventoryRow>();

// created once, not once per cell per render
const nf = new Intl.NumberFormat("id-ID");

export const columns = columnHelper.columns([
  columnHelper.accessor("item", {
    header: "Part Number",
    size: 224,
    minSize: 150,
  }),
  columnHelper.accessor("description", {
    header: "Description",
    size: 360,
    minSize: 200,
  }),
  columnHelper.accessor("onhand", {
    header: () => <div className="text-right">On Hand</div>,
    cell: ({ getValue }) => (
      <div className="text-right font-medium tabular-nums">
        {nf.format(getValue() ?? 0)}
      </div>
    ),
    size: 96,
    minSize: 50,
  }),
  columnHelper.accessor("uom", { header: "UoM", size: 72, minSize: 20 }),
  columnHelper.accessor("brand", { header: "Brand", size: 128, minSize: 60 }),
  columnHelper.accessor("whse", { header: "Whs", size: 96, minSize: 50 }),
  columnHelper.accessor("bin_loc", { header: "Loc", size: 96, minSize: 50 }),
]);
