export type FilterCondition = [string, string, unknown];
export type LogicalOperator = "|" | "&";
export type DomainItem = LogicalOperator | FilterCondition | DomainFilter;
export type DomainFilter = DomainItem[];

export type BindValue = string | number | Date | null;

// const ALLOWED_FIELDS = new Set([
//   "item",
//   "description",
//   "whse",
//   "bin_loc",
//   "brand",
//   "onhand",
//   "uom",
//   "unitcost",
//   "amount",
// ]);

const VALID_OPS = new Set(["=", "!=", ">", ">=", "<", "<=", "like", "ilike"]);

export function createDomain(conditions: DomainItem[]): DomainFilter {
  if (conditions.length === 0) return [];
  if (conditions.length === 1) return [conditions[0]];

  let result: DomainFilter = ["&", conditions[0], conditions[1]];
  for (let i = 2; i < conditions.length; i++) {
    result = ["&", result, conditions[i]];
  }
  return result;
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

export function parseDomainFilter(domain: DomainFilter): {
  clause: string;
  binds: Record<string, BindValue>;
} {
  let bindIndex = 1;
  const binds: Record<string, BindValue> = {};

  const parseLeaf = ([field, operator, value]: FilterCondition): string => {
    const f = String(field).toLowerCase();
    // if (!ALLOWED_FIELDS.has(f)) {
    //   throw new Error(`Kolom tidak diizinkan: ${field}`);
    // }

    const op = VALID_OPS.has(operator) ? operator : "=";
    const key = `b${bindIndex++}`;

    if (op === "like" || op === "ilike") {
      // escape wildcard bawaan input supaya dianggap literal
      const escaped = String(value).replace(/[\\%_]/g, (c) => `\\${c}`);
      binds[key] = `%${escaped}%`;
      return `UPPER(${f}) LIKE UPPER(:${key}) ESCAPE '\\'`;
    }

    // Oracle: "= NULL" tidak pernah true
    if (value === null || value === undefined) {
      bindIndex--; // bind tidak dipakai, kembalikan index
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

      // ["&" | "|", kiri, kanan, ...]
      if (head === "&" || head === "|") {
        const sqlOp = head === "|" ? "OR" : "AND";
        const parts = rest.map(walk).filter(Boolean);
        if (parts.length === 0) return "";
        return parts.length === 1 ? parts[0] : `(${parts.join(` ${sqlOp} `)})`;
      }

      // Array biasa tanpa operator = digabung AND (mis. [[leaf]])
      const parts = node.map(walk).filter(Boolean);
      if (parts.length === 0) return "";
      return parts.length === 1 ? parts[0] : `(${parts.join(" AND ")})`;
    }

    throw new Error("Item domain tidak valid");
  };

  const sql = walk(domain);
  return { clause: sql ? `WHERE ${sql}` : "", binds };
}
