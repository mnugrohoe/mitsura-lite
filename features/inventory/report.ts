import { getInventoryRows } from "./queries";

const columns = [
  "NO.",
  "PART NUMBER",
  "OTHER P/N",
  "DESCRIPTION",
  "ON-HAND",
  "UOM",
  "LOKASI",
  "BIN LOC",
  "BRAND",
  "PO TYPE",
  "COGS",
  "AMOUNT",
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
      r.binLoc,
      r.brand,
      r.poType,
      r.unitCost,
      r.amount,
    ]),
  };
}
