/* ---------- Tipe ---------- */

import { DefaultParams, FieldMap } from "@/lib/filter";

// Bentuk mentah dari Oracle (nama kolom huruf besar)
export type Raw = {
  ITEM: string;
  DESCRIPTION: string | null;
  I_GROUP: string | null;
  WHSE: string | null;
  BIN_LOC: string | null;
  BRAND: string | null;
  ONHAND: number | null;
  OH_TOTAL: number | null;
  UOM: string | null;
  MIN_STOCK: number | null;
  SALES_CAT: string | null;
  SALESPRICE: number | null;
  UNITCOST: number | null;
  PURCHASEPRICE: number | null;
  PUR_CURR: string | null;
  AMOUNT: number | null;
  PO_TYPE: string | null;
};

// Bentuk yang dipakai di aplikasi (camelCase)
export type InventoryRow = {
  item: string;
  description: string | null;
  whse: string | null;
  binLoc: string | null;
  brand: string | null;
  onhand: number | null;
  uom: string | null;
  unitCost: number | null;
  amount: number | null;
};

export const INVENTORY_FIELDS: FieldMap = {
  item: "text",
  description: "text",
  whse: "text",
  bin_loc: "text",
  brand: "text",
  uom: "text",
  onhand: "number",
  unitcost: "number",
  amount: "number",
};

export const INVENTORY_DEFAULTS: DefaultParams = {
  onhand: ">0",
};

export type FacetOption = { value: string; count: number };
export type Facets = Record<string, FacetOption[]>;
