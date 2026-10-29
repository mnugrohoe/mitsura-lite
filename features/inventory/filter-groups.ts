export type FilterGroup =
  | { field: string; label: string; kind: "check" }
  | {
      field: string;
      label: string;
      kind: "range";
      presets?: { label: string; value: string }[];
    }
  | { field: string; label: string; kind: "text" };

export const FILTER_GROUPS: FilterGroup[] = [
  { field: "whse", label: "Warehouse", kind: "check" },
  { field: "brand", label: "Brand", kind: "check" },
  {
    field: "onhand",
    label: "Stok (on hand)",
    kind: "range",
    presets: [
      { label: "On stock", value: ">0" },
      { label: "Stock out", value: "=0" },
      { label: "Low Stock", value: ">=1_and_<=5" },
    ],
  },
  { field: "unitcost", label: "Price", kind: "range" },
  // { field: "amount", label: "Nilai stok", kind: "range" },
  { field: "uom", label: "UoM", kind: "check" },
  { field: "item", label: "Part number", kind: "text" },
  { field: "description", label: "Deskripsi", kind: "text" },
];

/** Field yang diambil nilai terbanyaknya dari DB */
export const FACET_FIELDS = FILTER_GROUPS.filter((g) => g.kind === "check").map(
  (g) => g.field,
);
