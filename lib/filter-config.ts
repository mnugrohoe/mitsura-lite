import {
  sanitizeDomain,
  createDomain,
  type DomainFilter,
  type DomainItem,
  type FieldMap,
  type FieldType,
  type FilterCondition,
} from "./filter";

export type FilterTemplate = {
  label: string;
  group: string;
  domain: DomainItem;
};

type Input = {
  id: string; // localStorage namespace
  fields: Record<string, { label: string; type: FieldType }>; // key = SQL column
  searchFields?: string[];
  templates: Record<string, FilterTemplate>;
  defaults: string[];
};

export function defineFilter(c: Input) {
  const types = Object.fromEntries(
    Object.entries(c.fields).map(([k, v]) => [k, v.type]),
  ) as FieldMap; // what parseDomainFilter wants
  return { ...c, types };
}
export type FilterConfig = ReturnType<typeof defineFilter>;

export type FilterState = {
  search: string;
  templates: string[];
  custom: FilterCondition[]; // AND-ed
};

export const defaultState = (c: FilterConfig): FilterState => ({
  search: "",
  templates: c.defaults,
  custom: [],
});

/** Server-side: never trust client state (server actions are public endpoints). */
export function sanitizeState(
  c: FilterConfig,
  input: FilterState,
): FilterState {
  const templates = Array.isArray(input?.templates)
    ? [...new Set(input.templates)].filter(
        (k) => typeof k === "string" && Object.hasOwn(c.templates, k),
      )
    : [];
  const custom = Array.isArray(input?.custom)
    ? input.custom
        .slice(0, 20)
        .map((x) => sanitizeDomain(x, c.types) as unknown as FilterCondition)
    : [];
  const search =
    typeof input?.search === "string" ? input.search.trim().slice(0, 200) : "";
  return { search, templates, custom };
}

/** state -> domain (Odoo rule: same group = OR, different groups = AND) */
export function buildDomain(c: FilterConfig, s: FilterState): DomainFilter {
  const byGroup = new Map<string, DomainItem[]>();
  for (const key of s.templates) {
    const t = c.templates[key];
    byGroup.set(t.group, [...(byGroup.get(t.group) ?? []), t.domain]);
  }
  const groups = [...byGroup.values()].map(
    (n): DomainItem => (n.length === 1 ? n[0] : ["|", ...n]),
  );

  const search: DomainItem[] =
    s.search && c.searchFields?.length
      ? [["|", ...c.searchFields.map((f): DomainItem => [f, "like", s.search])]]
      : [];

  return createDomain([...groups, ...search, ...s.custom]);
}

export function resolveFilter(c: FilterConfig, input: FilterState) {
  const state = sanitizeState(c, input);
  return { state, domain: buildDomain(c, state) };
}
