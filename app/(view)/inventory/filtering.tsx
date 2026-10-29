"use client";

import React, { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CornerDownLeft,
  Filter,
  Loader,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { INVENTORY_FIELDS } from "@/features/inventory/definitions";
import { type FieldType, type FilterOperator } from "@/lib/filter";

/* ---------- Search box (param q) + tombol drawer ---------- */

export const SearchProduct = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [keyword, setKeyword] = useState<string>("");

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParams.toString());
    const value = keyword.trim();

    if (value) {
      params.set("q", value);
      setKeyword("");
    } else {
      params.delete("q");
    }

    params.delete("page"); // search berubah, balik ke halaman 1

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <form onSubmit={handleSubmit}>
        <InputGroup className="max-w-xs">
          <InputGroupInput
            placeholder="Search product..."
            value={keyword}
            onChange={(e) => setKeyword(e.currentTarget.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <Kbd>
              {!isPending ? (
                <CornerDownLeft />
              ) : (
                <Loader className="animate-spin" />
              )}
            </Kbd>
          </InputGroupAddon>
        </InputGroup>
      </form>

      <AdvancedFilter />
    </div>
  );
};

/* ---------- Advanced filter (drawer) ---------- */

const FIELD_KEYS = Object.keys(INVENTORY_FIELDS);

const OPS: Record<FieldType, { value: FilterOperator; label: string }[]> = {
  text: [
    { value: "like", label: "contains" },
    { value: "=", label: "equals" },
    { value: "!=", label: "not equals" },
  ],
  number: [
    { value: "=", label: "=" },
    { value: "!=", label: "≠" },
    { value: ">", label: ">" },
    { value: ">=", label: "≥" },
    { value: "<", label: "<" },
    { value: "<=", label: "≤" },
  ],
};

type DraftRow = ParamRow & { id: number; field: string };

let rowSeq = 0;

const newRow = (field = FIELD_KEYS[0]): DraftRow => ({
  id: ++rowSeq,
  field,
  conn: "and",
  op: OPS[INVENTORY_FIELDS[field]][0].value,
  value: "",
});

/** Baca URL -> baris form. Field yang tidak bisa diwakili form dikunci (tidak diubah). */
function readFromUrl(sp: URLSearchParams) {
  const rows: DraftRow[] = [];
  const locked: string[] = [];

  for (const [field, type] of Object.entries(INVENTORY_FIELDS)) {
    const parsed = sp
      .getAll(field)
      .map((v) => paramValueToRows(type, v))
      .filter((x): x is ParamRow[] => x !== null && x.length > 0);

    // beberapa param (AND) yang salah satunya berisi OR: kalau diratakan jadi
    // satu nilai, artinya berubah (prioritas AND/OR). Biarkan apa adanya.
    if (
      parsed.length > 1 &&
      parsed.some((p) => p.some((r) => r.conn === "or"))
    ) {
      locked.push(field);
      continue;
    }

    parsed.flat().forEach((r) => rows.push({ ...r, id: ++rowSeq, field }));
  }

  return { rows, locked };
}

const selectCls = "h-9 rounded-md border bg-background px-2 text-sm";

const AdvancedFilter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [locked, setLocked] = useState<string[]>([]);

  function handleOpenChange(next: boolean) {
    if (next) {
      // setiap dibuka, draft disinkronkan ulang dari URL
      const s = readFromUrl(new URLSearchParams(searchParams.toString()));
      setRows(s.rows.length ? s.rows : [newRow()]);
      setLocked(s.locked);
    }
    setOpen(next);
  }

  function updateRow(id: number, patch: Partial<DraftRow>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function changeField(id: number, field: string) {
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const oldType = INVENTORY_FIELDS[r.field];
        const newType = INVENTORY_FIELDS[field];
        // tipe sama: operator dan value dipertahankan. Beda tipe: reset.
        return oldType === newType
          ? { ...r, field }
          : { ...r, field, op: OPS[newType][0].value, value: "" };
      }),
    );
  }

  function commit(draft: DraftRow[]) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [field, type] of Object.entries(INVENTORY_FIELDS)) {
      if (locked.includes(field)) continue;

      const mine: ParamRow[] = draft
        .filter(
          (r) =>
            r.field === field &&
            r.value.trim() !== "" &&
            (type === "text" || Number.isFinite(Number(r.value))),
        )
        .map((r) => ({
          conn: r.conn,
          op: r.op,
          value: type === "number" ? String(Number(r.value)) : r.value.trim(),
        }));

      // ?onhand= (default sengaja dimatikan lewat badge) dibiarkan
      const existing = params.getAll(field);
      const wasCleared =
        existing.length > 0 && existing.every((v) => !v.trim());

      if (mine.length) params.set(field, rowsToParamValue(mine));
      else if (!wasCleared) params.delete(field); // kosong -> default (kalau ada) kembali
    }

    params.delete("page"); // filter berubah, balik ke halaman 1

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
    setOpen(false);
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} swipeDirection="right">
      <DrawerTrigger render={<Button variant="ghost" />}>
        <Filter className="h-4 w-4 cursor-pointer" />
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Advanced filter</span>
          </DrawerTitle>
          <DrawerDescription>
            Tambah kondisi lalu tekan Apply. Kondisi pada field yang sama bisa
            digabung dengan AND atau OR.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {rows.map((r, index) => {
            const type = INVENTORY_FIELDS[r.field];
            const hasPrevSameField = rows
              .slice(0, index)
              .some((x) => x.field === r.field);

            return (
              <div key={r.id} className="space-y-1">
                {hasPrevSameField && (
                  <select
                    aria-label="Penghubung dengan kondisi sebelumnya"
                    className={`${selectCls} h-7 text-xs`}
                    value={r.conn}
                    onChange={(e) =>
                      updateRow(r.id, { conn: e.target.value as "and" | "or" })
                    }
                  >
                    <option value="and">AND ({r.field})</option>
                    <option value="or">OR ({r.field})</option>
                  </select>
                )}

                <div className="flex items-center gap-2">
                  <select
                    aria-label="Field"
                    className={selectCls}
                    value={r.field}
                    onChange={(e) => changeField(r.id, e.target.value)}
                  >
                    {FIELD_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Operator"
                    className={selectCls}
                    value={r.op}
                    onChange={(e) =>
                      updateRow(r.id, { op: e.target.value as FilterOperator })
                    }
                  >
                    {OPS[type].map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  <Input
                    aria-label="Value"
                    className="min-w-0 flex-1"
                    type={type === "number" ? "number" : "text"}
                    step={type === "number" ? "any" : undefined}
                    value={r.value}
                    onChange={(e) =>
                      updateRow(r.id, { value: e.currentTarget.value })
                    }
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Hapus kondisi"
                    onClick={() =>
                      setRows((rs) => rs.filter((x) => x.id !== r.id))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setRows((rs) => [...rs, newRow()])}
          >
            <Plus className="mr-1 h-4 w-4" /> Tambah kondisi
          </Button>

          {locked.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Field {locked.join(", ")} punya beberapa param dengan OR di URL,
              jadi tidak diubah oleh form ini. Hapus lewat badge.
            </p>
          )}
        </div>

        <DrawerFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={isPending}
            onClick={() => commit([])}
          >
            Reset
          </Button>
          <Button
            className="flex-1"
            disabled={isPending}
            onClick={() => commit(rows)}
          >
            Apply
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

/* ---------- Badge filter aktif (+ tombol hapus) ---------- */

export const FilterBadges = ({ badges }: { badges: BadgeData[] }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function remove({ key, raw, next }: BadgeRemove) {
    const params = new URLSearchParams(searchParams.toString());

    if (raw === null) {
      // param tunggal (q) atau default: next string (termasuk "") -> set, null -> hapus
      if (next !== null) params.set(key, next);
      else params.delete(key);
    } else {
      // key bisa berulang (?onhand=..&onhand=..): ubah hanya nilai yang cocok
      const all = params.getAll(key);
      const i = all.indexOf(raw);
      if (i !== -1) {
        if (next) all[i] = next;
        else all.splice(i, 1);
      }
      params.delete(key);
      all.forEach((v) => params.append(key, v));
    }

    params.delete("page"); // filter berubah, balik ke halaman 1

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <>
      {badges.map(
        (badge) =>
          badge.text && (
            <Badge
              key={badge.id}
              variant="outline"
              className="gap-0 bg-transparent p-0"
            >
              <span className="bg-blue-900 px-1.5 py-1 text-white">
                {badge.field}
              </span>
              <span className="px-1.5 py-1">
                {`${badge.op ?? ""} ${badge.text}`.trim()}
              </span>
              {badge.remove && (
                <Button
                  variant="ghost"
                  aria-label={`Hapus filter ${badge.field}`}
                  disabled={isPending}
                  className="p-0.5 hover:bg-red-50 hover:text-red-500"
                  onClick={() => remove(badge.remove!)}
                >
                  <X className="h-2 w-2" />
                </Button>
              )}
            </Badge>
          ),
      )}
    </>
  );
};
