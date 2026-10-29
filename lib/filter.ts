/* Domain types + domain -> Oracle SQL. Nothing about URLs here. */

const VALID_OPS = ["=", "!=", ">", ">=", "<", "<=", "like", "ilike"] as const;
const SET_VALID_OPS = new Set<string>(VALID_OPS);

export type FilterOperator = (typeof VALID_OPS)[number];
export type FilterCondition = [string, FilterOperator, string | number];
export type LogicalOperator = "|" | "&";
export type DomainItem = LogicalOperator | FilterCondition | DomainFilter;
export type DomainFilter = DomainItem[];

export type FieldType = "text" | "number";
export type FieldMap = Record<string, FieldType>;
export type BindValue = string | number | Date | null;

// below the types
const OPS_BY_TYPE: Record<FieldType, FilterOperator[]> = {
  text: ["=", "!=", "like", "ilike"],
  number: ["=", "!=", ">", ">=", "<", "<="],
};
const MAX_DEPTH = 6;
const MAX_LEAVES = 30;
const MAX_TEXT_LENGTH = 200;

/** AND semua node. n-ary: ["&", a, b, c] */
export function createDomain(nodes: DomainItem[]): DomainFilter {
  if (nodes.length <= 1) return nodes.length ? [nodes[0]] : [];
  return ["&", ...nodes];
}

function isLeaf(x: unknown): x is FilterCondition {
  return (
    Array.isArray(x) &&
    x.length === 3 &&
    typeof x[0] === "string" &&
    x[0] !== "|" &&
    x[0] !== "&" &&
    typeof x[1] === "string"
  );
}

/**
 * field TIDAK divalidasi di sini. Selalu lewatkan domain yang dibangun dari
 * sanitize() / buildDomain() (features/inventory/filters.ts), jangan input mentah.
 */
export function parseDomainFilter(
  domain: DomainFilter,
  fields?: FieldMap,
): {
  clause: string;
  binds: Record<string, BindValue>;
} {
  const safe = fields ? sanitizeDomain(domain, fields) : domain;

  let bindIndex = 1;
  const binds: Record<string, BindValue> = {};

  const parseLeaf = ([field, operator, value]: FilterCondition): string => {
    const f = String(field).toLowerCase();
    const op = SET_VALID_OPS.has(operator) ? operator : "=";
    const key = `b${bindIndex++}`;

    if (op === "like" || op === "ilike") {
      const escaped = String(value).replace(/[\\%_]/g, (c) => `\\${c}`);
      binds[key] = `%${escaped}%`;
      return `UPPER(${f}) LIKE UPPER(:${key}) ESCAPE '\\'`;
    }

    if (value === null || value === undefined) {
      bindIndex--;
      if (op === "=") return `${f} IS NULL`;
      if (op === "!=") return `${f} IS NOT NULL`;
      throw new Error(`Operator ${op} tidak bisa dipakai dengan null`);
    }

    binds[key] = value as BindValue;
    return `${f} ${op} :${key}`;
  };

  const walk = (node: DomainItem): string => {
    if (isLeaf(node)) return parseLeaf(node);

    if (Array.isArray(node)) {
      if (node.length === 0) return "";

      const [head, ...rest] = node;

      if (head === "&" || head === "|") {
        const sqlOp = head === "|" ? "OR" : "AND";
        const parts = rest.map(walk).filter(Boolean);
        if (parts.length === 0) return "";
        return parts.length === 1 ? parts[0] : `(${parts.join(` ${sqlOp} `)})`;
      }

      const parts = node.map(walk).filter(Boolean);
      if (parts.length === 0) return "";
      return parts.length === 1 ? parts[0] : `(${parts.join(" AND ")})`;
    }

    throw new Error("Item domain tidak valid");
  };

  const sql = walk(safe);
  return { clause: sql ? `WHERE ${sql}` : "", binds };
}

/**
 * Validasi domain mentah (boleh bersarang: ["|", a, ["&", b, c]]) terhadap whitelist.
 * Melempar error kalau ada yang tidak valid; tidak ada yang "diperbaiki" diam-diam.
 */
export function sanitizeDomain(
  domain: unknown,
  fields: FieldMap,
): DomainFilter {
  let leaves = 0;

  const leaf = (c: unknown[]): FilterCondition => {
    if (++leaves > MAX_LEAVES) throw new Error("too many conditions");

    const [field, op, value] = c;

    // hasOwn: cegah "__proto__", "constructor", dst. Cocok persis, case-sensitive.
    const type =
      typeof field === "string" && Object.hasOwn(fields, field)
        ? fields[field]
        : undefined;
    if (!type) throw new Error("field not allowed");

    if (!OPS_BY_TYPE[type].includes(op as FilterOperator)) {
      throw new Error("operator not allowed for this field");
    }

    const okValue =
      type === "number"
        ? typeof value === "number" && Number.isFinite(value)
        : typeof value === "string" &&
          value.trim() !== "" &&
          value.length <= MAX_TEXT_LENGTH;
    if (!okValue) throw new Error("invalid value");

    return [field as string, op as FilterOperator, value as string | number];
  };

  const node = (n: unknown, depth: number): DomainItem => {
    if (depth > MAX_DEPTH) throw new Error("domain too deep");
    if (!Array.isArray(n)) throw new Error("invalid node");

    // leaf: [field, op, value] (elemen pertama bukan operator logika)
    if (
      n.length === 3 &&
      typeof n[0] === "string" &&
      n[0] !== "&" &&
      n[0] !== "|"
    ) {
      return leaf(n);
    }

    // group: ["&" | "|", ...nodes]; "&"/"|" hanya sah di posisi pertama
    const [head, ...rest] = n;
    if (head === "&" || head === "|") {
      return [head, ...rest.map((r) => node(r, depth + 1))];
    }

    // array biasa = digabung AND
    return n.map((r) => node(r, depth + 1));
  };

  return node(domain, 0) as DomainFilter;
}
