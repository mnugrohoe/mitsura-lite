import { getInventoryRows } from "./queries";

const columns = [
  "No.",
  "Part Number",
  "Description",
  "Onhand",
  "UoM",
  "Loc",
  "Bin Loc",
  "Brand",
  "COGS",
  "Amount",
];

export async function buildInventoryReport() {
  const rows = await getInventoryRows();
  return {
    title: "Inventory Report (Mitsura)",
    columns,
    data: rows.map((r, i) => [
      i + 1,
      r.item,
      r.description,
      r.onhand,
      r.uom,
      r.whse,
      r.bin_loc,
      r.brand,
      r.unit_cost,
      r.amount,
    ]),
  };
}
