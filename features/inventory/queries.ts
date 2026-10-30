import "server-only";
import { query } from "@/lib/oracle";
import {
  type DomainFilter,
  type DomainItem,
  createDomain,
  parseDomainFilter,
} from "@/lib/filter";
import type { InventoryRow } from "./definitions";
import { inventoryFilter } from "./filter.config";

/* ---------- SQL dasar (= InvtRpt.index00) ---------- */
// Jangan akhiri dengan ";" dan jangan pakai komentar "--" di dalamnya,
// karena string ini nanti dibungkus sebagai subquery.

const BASE_SQL = `
SELECT
  b.item,
  b.description,
  c.WHSE,
  c.bin_loc,
  b.brand,
  c.onhand,
  c.uom,
  b.unitcost unit_cost,
  (b.unitcost * b.onhand) amount
FROM m_item b INNER JOIN m_itemwhse c ON b.item = c.item
UNION
SELECT
  a.item,
  a.description,
  a.WHSE,
  a.bin_loc,
  a.brand,
  a.onhand,
  a.uom,
  a.unitcost unit_cost,
  (a.unitcost * a.onhand) amount
FROM m_item a
`.trim();

/* ---------- Filter ---------- */

export type InventoryFilter = {
  // q?: string; // cari part number / deskripsi
  // whse?: string; // lokasi gudang
  // brand?: string;
  // onhand?: string;
  domain?: DomainFilter;
};

function buildWhere(f: InventoryFilter) {
  const conditions: DomainItem[] = [];

  // const q = f.q?.trim();

  // if (q) {
  //   conditions.push(["|", ["item", "like", q], ["description", "like", q]]);
  // }

  // if (f.whse?.trim()) {
  //   conditions.push(["whse", "ilike", f.whse.trim()]);
  // }

  // if (f.brand?.trim()) {
  //   conditions.push(["brand", "ilike", f.brand.trim()]);
  // }

  if (f.domain?.length) {
    conditions.push(f.domain);
  }

  // const onhand = f.onhand?.trim();

  // if (onhand) {
  //   const match = onhand.match(/^(>=|<=|>|<|=)?\s*(\d+(?:\.\d+)?)$/);

  //   if (match) {
  //     const operator = (match[1] || "=") as FilterOperator;
  //     const value = Number(match[2]);

  //     conditions.push(["onhand", operator, value]);
  //   }
  // }

  if (conditions.length === 0) return { clause: "", binds: {} };

  return parseDomainFilter(createDomain(conditions), inventoryFilter.types);
}

/* ---------- Query untuk halaman (dengan paginasi, gaya Oracle 11g) ---------- */

export async function getInventoryPage({
  filter = {},
  page = 1,
  pageSize = 50,
}: {
  filter?: InventoryFilter;
  page?: number;
  pageSize?: number;
} = {}) {
  const { clause, binds } = buildWhere(filter);
  const maxRow = page * pageSize;
  const minRow = (page - 1) * pageSize;
  console.log({ clause, binds });
  const q = `
  SELECT * FROM (
    SELECT t.*, ROWNUM rn FROM (
      SELECT * FROM (${BASE_SQL}) ${clause} ORDER BY item, whse
    ) t
    WHERE ROWNUM <= :maxRow
  )
  WHERE rn > :minRow`;
  // console.log(q, { ...binds, maxRow, minRow });
  const rows = await query<InventoryRow>(q, { ...binds, maxRow, minRow });

  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM (${BASE_SQL}) ${clause}`,
    binds,
  );

  return { rows, total, page, pageSize };
}

/* ---------- Query untuk export (semua baris, tanpa paginasi) ---------- */
export async function getInventoryRows(
  filter: InventoryFilter = {},
): Promise<InventoryRow[]> {
  const { clause, binds } = buildWhere(filter);
  const rows = await query<InventoryRow>(
    `SELECT * FROM (${BASE_SQL}) ${clause} ORDER BY item, whse`,
    binds,
    { fetchArraySize: 1000 }, // ambil per 1000 baris, lebih cepat untuk data besar
  );
  return rows;
}
