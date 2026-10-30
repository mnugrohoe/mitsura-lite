import { defineFilter } from "@/lib/filter-config";

export const inventoryFilter = defineFilter({
  id: "inventory",
  searchFields: ["item", "description"],
  fields: {
    item: { label: "Part Number", type: "text" },
    description: { label: "Description", type: "text" },
    whse: { label: "Whs", type: "text" },
    bin_loc: { label: "Loc", type: "text" },
    brand: { label: "Brand", type: "text" },
    uom: { label: "UoM", type: "text" },
    onhand: { label: "On hand", type: "number" },
    unitcost: { label: "Price", type: "number" },
  },
  templates: {
    in_stock: { label: "In stock", group: "stock", domain: ["onhand", ">", 0] },
    out_of_stock: {
      label: "Out of stock",
      group: "stock",
      domain: ["onhand", "=", 0],
    },
    low_stock: {
      label: "Low stock (1-4)",
      group: "stock",
      domain: ["&", ["onhand", ">", 0], ["onhand", "<", 5]],
    },
  },
  groups: {
    whse: {
      type: "checkbox",
      label: "Warehouse",
      field: "whse",
      options: [
        { label: "Cikarang", value: "WCCS" },
        { label: "Balikpapan", value: "WHS_KAI" },
        { label: "Tanjung Redep", value: "WTJR" },
        { label: "Buma", value: "VHSBUMA" },
      ],
      other_option: true,
      visible: 4, // the 5th one sits behind "More"
    },
    onhand_min: {
      type: "radio",
      label: "On hand",
      field: "onhand",
      options: [
        { label: "Above 10", op: ">=", value: 10 },
        { label: "Above 50", op: ">=", value: 50 },
        { label: "Above 100", op: ">=", value: 100 },
      ],
    },
    price: { type: "range", label: "Price", field: "unitcost" },
  },
  defaults: ["in_stock"],
});
