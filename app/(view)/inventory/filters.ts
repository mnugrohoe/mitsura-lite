/* Konsep Odoo: template filter (kode) + default + custom. Bukan "use server",
   jadi boleh export const dan dipakai di server maupun client. */

import {
  createDomain,
  type DomainFilter,
  type DomainItem,
  type FieldMap,
  type FieldType,
  type FilterCondition,
  type FilterOperator,
} from "@/lib/filter";

/* ---------- whitelist field (satu-satunya sumber nama kolom) ---------- */

export const FIELDS: FieldMap = {
  onhand: "number",
  brand: "text",
  // tambahkan kolom lain di sini
};

const OPS_BY_TYPE: Record<FieldType, FilterOperator[]> = {
  text: ["=", "!=", "like"],
  number: ["=", "!=", ">", ">=", "<", "<="],
};

/* ---------- template filter (= search view XML di Odoo) ---------- */

export type Template = {
  label: string;
  group: string; // satu group = digabung OR, beda group = AND
  domain: DomainItem;
};

export const TEMPLATES: Record<string, Template> = {
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
};

/* ---------- state = apa yang dikirim client & dikembalikan server ---------- */

export type FilterState = {
  templates: string[]; // key dari TEMPLATES
  custom: FilterCondition[]; // dari drawer, selalu digabung AND
};

// default = state awal, bukan logika khusus. User boleh membuangnya.
export const DEFAULT_STATE: FilterState = {
  templates: ["in_stock"],
  custom: [],
};

/* ---------- validasi (WAJIB di server: server action itu endpoint publik) ---------- */

function validateCondition(c: unknown): FilterCondition {
  if (!Array.isArray(c) || c.length !== 3) throw new Error("invalid condition");
  const [field, op, value] = c;

  const type =
    typeof field === "string" && Object.hasOwn(FIELDS, field)
      ? FIELDS[field]
      : null;
  if (!type) throw new Error("invalid field");
  if (!OPS_BY_TYPE[type].includes(op)) throw new Error("invalid operator");

  const okValue =
    type === "number"
      ? typeof value === "number" && Number.isFinite(value)
      : typeof value === "string" && value.trim() !== "" && value.length <= 200;
  if (!okValue) throw new Error("invalid value");

  return [field, op, value];
}

export function sanitize(input: FilterState): FilterState {
  // template tidak dikenal (mis. saved filter lama) dibuang diam-diam
  const templates = Array.isArray(input?.templates)
    ? [...new Set(input.templates)].filter(
        (k) => typeof k === "string" && Object.hasOwn(TEMPLATES, k),
      )
    : [];

  const custom = Array.isArray(input?.custom)
    ? input.custom.slice(0, 20).map(validateCondition)
    : [];

  return { templates, custom };
}

/* ---------- state -> domain (aturan Odoo: group OR, antar group AND) ---------- */

export function buildDomain({ templates, custom }: FilterState): DomainFilter {
  const byGroup = new Map<string, DomainItem[]>();
  for (const key of templates) {
    const t = TEMPLATES[key];
    byGroup.set(t.group, [...(byGroup.get(t.group) ?? []), t.domain]);
  }

  const groups = [...byGroup.values()].map(
    (nodes): DomainItem => (nodes.length === 1 ? nodes[0] : ["|", ...nodes]),
  );

  return createDomain([...groups, ...custom]);
}
