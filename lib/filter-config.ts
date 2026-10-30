import {
  sanitizeDomain,
  createDomain,
  type DomainFilter,
  type DomainItem,
  type FieldMap,
  type FieldType,
  type FilterCondition,
  type FilterOperator,
} from "./filter";

const MAX_SEARCH_TERMS = 5;

export type FilterTemplate = {
  label: string;
  group: string;
  domain: DomainItem;
};

/* ---------- advanced filter groups (Shopee style) ---------- */

export type FacetOption = { label: string; value: string | number };
export type RadioOption = {
  label: string;
  op: FilterOperator;
  value: string | number;
};

export type FilterGroup =
  | {
      type: "checkbox"; // multi select, ticked options are OR-ed
      label: string;
      field: string;
      options: FacetOption[];
      visible?: number; // options shown before "More" (default 4)
      other_option?: boolean;
    }
  | {
      type: "radio"; // single select, each option = one condition
      label: string;
      field: string;
      options: RadioOption[];
    }
  | {
      type: "range"; // min / max inputs (number fields only)
      label: string;
      field: string;
    };

export type RangeValue = { min?: number; max?: number };
/** checkbox: option indexes · radio: one option index · range: min/max */
export type CheckboxValue = { picked: number[]; other?: string };
export type GroupValue = CheckboxValue | number | RangeValue;

export type CustomRow = {
  join: "&" | "|";
  cond: FilterCondition;
};

export const MAX_CUSTOM_ROWS = 10; // batas leaf sanitizeDomain = 30

const isCheckbox = (v: GroupValue): v is CheckboxValue =>
  typeof v === "object" && "picked" in v;
const isRange = (v: GroupValue): v is RangeValue =>
  typeof v === "object" && !("picked" in v);

type Input = {
  id: string; // localStorage namespace
  fields: Record<string, { label: string; type: FieldType }>; // key = SQL column
  searchFields?: string[];
  templates: Record<string, FilterTemplate>;
  groups?: Record<string, FilterGroup>;
  defaults: string[];
};

export function defineFilter(c: Input) {
  const types = Object.fromEntries(
    Object.entries(c.fields).map(([k, v]) => [k, v.type]),
  ) as FieldMap; // what parseDomainFilter wants

  const groups = c.groups ?? {};
  for (const [k, g] of Object.entries(groups)) {
    if (!Object.hasOwn(c.fields, g.field)) {
      throw new Error(`filter group "${k}": unknown field "${g.field}"`);
    }
    if (g.type === "range" && c.fields[g.field].type !== "number") {
      throw new Error(`filter group "${k}": range needs a number field`);
    }
    if (
      g.type === "checkbox" &&
      g.other_option &&
      c.fields[g.field].type !== "text"
    ) {
      throw new Error(`filter group "${k}": other_option needs a text field`);
    }
  }

  return { ...c, groups, types };
}
export type FilterConfig = ReturnType<typeof defineFilter>;

export type FilterState = {
  search: string[];
  templates: string[];
  groups: Record<string, GroupValue>;
  custom: CustomRow[];
};

export const defaultState = (c: FilterConfig): FilterState => ({
  search: [],
  templates: c.defaults,
  groups: {},
  custom: [],
});

/* ---------- sanitize (server side: never trust client state) ---------- */

const isCondition = (x: unknown): x is FilterCondition =>
  Array.isArray(x) &&
  x.length === 3 &&
  typeof x[0] === "string" &&
  x[0] !== "&" &&
  x[0] !== "|";

/** Keep only valid leaf conditions; drop anything malformed instead of throwing. */
function sanitizeCustom(c: FilterConfig, input: unknown): CustomRow[] {
  if (!Array.isArray(input)) return [];
  const out: CustomRow[] = [];

  for (const x of input.slice(0, MAX_CUSTOM_ROWS)) {
    const row: unknown = isCondition(x) ? { join: "&", cond: x } : x;
    if (!row || typeof row !== "object") continue;

    const { join, cond } = row as { join?: unknown; cond?: unknown };
    if (!isCondition(cond)) continue;

    try {
      out.push({
        // baris pertama selalu "&" (tidak punya konektor)
        join: out.length > 0 && join === "|" ? "|" : "&",
        cond: sanitizeDomain(cond, c.types) as unknown as FilterCondition,
      });
    } catch {
      // field/operator/value tidak diizinkan: lewati
    }
  }
  return out;
}

/** Only config keys are read; every value is checked against its group. */
function sanitizeGroups(
  c: FilterConfig,
  input: unknown,
): FilterState["groups"] {
  const out: FilterState["groups"] = {};
  if (!input || typeof input !== "object") return out;
  const src = input as Record<string, unknown>;

  for (const [key, g] of Object.entries(c.groups)) {
    const raw = src[key];

    if (g.type === "checkbox") {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const { picked: p, other: o } = raw as {
        picked?: unknown;
        other?: unknown;
      };

      const picked = [
        ...new Set(
          (Array.isArray(p) ? p : []).filter(
            (x): x is number =>
              Number.isInteger(x) && x >= 0 && x < g.options.length,
          ),
        ),
      ].sort((a, b) => a - b);

      const other =
        g.other_option && typeof o === "string" ? o.trim().slice(0, 200) : "";

      if (picked.length || other)
        out[key] = other ? { picked, other } : { picked };
    } else if (g.type === "radio") {
      if (
        typeof raw === "number" &&
        Number.isInteger(raw) &&
        raw >= 0 &&
        raw < g.options.length
      ) {
        out[key] = raw;
      }
    } else {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const { min, max } = raw as RangeValue;
      const r: RangeValue = {};
      if (typeof min === "number" && Number.isFinite(min)) r.min = min;
      if (typeof max === "number" && Number.isFinite(max)) r.max = max;
      if (r.min !== undefined && r.max !== undefined && r.min > r.max) {
        [r.min, r.max] = [r.max, r.min];
      }
      if (r.min !== undefined || r.max !== undefined) out[key] = r;
    }
  }
  return out;
}

function sanitizeSearch(input: unknown): string[] {
  // terima string lama juga, supaya state versi sebelumnya tidak error
  const list = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? [input]
      : [];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of list) {
    if (typeof x !== "string") continue;
    const t = x.trim().slice(0, 200);
    const key = t.toLowerCase();
    if (!t || seen.has(key)) continue; // buang kosong dan duplikat
    seen.add(key);
    out.push(t);
    if (out.length >= MAX_SEARCH_TERMS) break;
  }
  return out;
}

export function sanitizeState(
  c: FilterConfig,
  input: FilterState,
): FilterState {
  const templates = Array.isArray(input?.templates)
    ? [...new Set(input.templates)].filter(
        (k) => typeof k === "string" && Object.hasOwn(c.templates, k),
      )
    : [];

  return {
    search: sanitizeSearch(input?.search),
    templates,
    groups: sanitizeGroups(c, input?.groups),
    custom: sanitizeCustom(c, input?.custom),
  };
}

/* ---------- state -> domain ---------- */

function groupDomain(g: FilterGroup, v: GroupValue): DomainItem | null {
  if (g.type === "checkbox" && isCheckbox(v)) {
    const leaves: DomainItem[] = v.picked.map(
      (i): DomainItem => [g.field, "=", g.options[i].value],
    );
    if (v.other) leaves.push([g.field, "like", v.other]);
    if (!leaves.length) return null;
    return leaves.length === 1 ? leaves[0] : ["|", ...leaves];
  }
  if (g.type === "radio" && typeof v === "number") {
    const o = g.options[v];
    return [g.field, o.op, o.value];
  }
  if (g.type === "range" && isRange(v)) {
    const parts: DomainItem[] = [];
    if (v.min !== undefined) parts.push([g.field, ">=", v.min]);
    if (v.max !== undefined) parts.push([g.field, "<=", v.max]);
    return parts.length > 1 ? ["&", ...parts] : (parts[0] ?? null);
  }
  return null;
}

export function describeGroup(g: FilterGroup, v: GroupValue): string {
  if (g.type === "checkbox" && isCheckbox(v)) {
    const labels = v.picked.map((i) => g.options[i].label);
    if (v.other) labels.push(`~${v.other}`);
    return `${g.label}: ${labels.join(", ")}`;
  }
  if (g.type === "radio" && typeof v === "number") {
    return `${g.label}: ${g.options[v].label}`;
  }
  if (g.type === "range" && isRange(v)) {
    return `${g.label}: ${v.min ?? "…"} – ${v.max ?? "…"}`;
  }
  return g.label;
}

/** AND mengikat lebih kuat dari OR: a & b | c  =>  (a & b) | c */
function customDomain(rows: CustomRow[]): DomainItem | null {
  if (!rows.length) return null;

  const chunks: FilterCondition[][] = [[]];
  rows.forEach((r, i) => {
    if (i > 0 && r.join === "|") chunks.push([]);
    chunks[chunks.length - 1].push(r.cond);
  });

  const ands = chunks.map(
    (ch): DomainItem => (ch.length === 1 ? ch[0] : ["&", ...ch]),
  );
  return ands.length === 1 ? ands[0] : ["|", ...ands];
}

/** state -> domain (Odoo rule: same group = OR, different groups = AND) */
export function buildDomain(c: FilterConfig, s: FilterState): DomainFilter {
  const byGroup = new Map<string, DomainItem[]>();
  for (const key of s.templates) {
    const t = c.templates[key];
    byGroup.set(t.group, [...(byGroup.get(t.group) ?? []), t.domain]);
  }
  const templates = [...byGroup.values()].map(
    (n): DomainItem => (n.length === 1 ? n[0] : ["|", ...n]),
  );

  const groups: DomainItem[] = [];
  for (const [key, v] of Object.entries(s.groups)) {
    const g = c.groups[key];
    const d = g ? groupDomain(g, v) : null;
    if (d) groups.push(d);
  }

  const fields = c.searchFields ?? [];
  const search: DomainItem[] =
    s.search.length && fields.length
      ? [
          [
            "|",
            ...s.search.flatMap((t) =>
              fields.map((f): DomainItem => [f, "like", t]),
            ),
          ],
        ]
      : [];

  const custom = customDomain(s.custom);

  return createDomain([
    ...templates,
    ...groups,
    ...search,
    ...(custom ? [custom] : []),
  ]);
}

export function resolveFilter(c: FilterConfig, input: FilterState) {
  const state = sanitizeState(c, input);
  return { state, domain: buildDomain(c, state) };
}
