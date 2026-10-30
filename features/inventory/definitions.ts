// Bentuk yang dipakai di aplikasi (camelCase)
export type InventoryRow = {
  item: string;
  description: string | null;
  whse: string | null;
  bin_loc: string | null;
  brand: string | null;
  onhand: number | null;
  uom: string | null;
  unit_cost: number | null;
  amount: number | null;
};

export type FacetOption = { value: string; count: number };
export type Facets = Record<string, FacetOption[]>;
