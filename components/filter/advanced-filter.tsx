"use client";
import { useState } from "react";
import { Filter, Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  MAX_CUSTOM_ROWS,
  type CheckboxValue,
  type FilterConfig,
  type FilterGroup,
  type FilterState,
  type GroupValue,
  type RangeValue,
} from "@/lib/filter-config";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { useFilter } from "./use-filter";
import {
  Combobox,
  ComboboxInput,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
  ComboboxContent,
} from "../ui/combobox";
import { FilterOperator } from "@/lib/filter";

type Groups = FilterState["groups"];
type Pick<T extends FilterGroup["type"]> = Extract<FilterGroup, { type: T }>;

export function AdvancedFilter({
  cfg,
  filter,
}: {
  cfg: FilterConfig;
  filter: ReturnType<typeof useFilter>;
}) {
  const { state, setAdvanced, pending: disabled } = filter;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Groups>(state.groups);
  const [rows, setRows] = useState<Row[]>(() => toRows(cfg, state.custom));

  const set = (key: string, v: GroupValue | undefined) =>
    setDraft((d) => {
      const next = { ...d };
      if (v === undefined) delete next[key];
      else next[key] = v;
      return next;
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="xs" className="gap-2">
              <Star className="size-3" /> Favorite
            </Button>
          }
        ></DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Onhand Stock</DropdownMenuLabel>
            {Object.entries(cfg.templates).map(([k, t]) => {
              return (
                <DropdownMenuItem
                  key={k}
                  onClick={() => filter.toggleTemplate(k)}
                  className="cursor-pointer"
                >
                  {t.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Drawer
        open={open}
        onOpenChange={(o) => {
          if (o) {
            // mulai dari filter yang sedang aktif
            setDraft(state.groups);
            setRows(toRows(cfg, state.custom));
          }
          setOpen(o);
        }}
        swipeDirection="right"
      >
        <DrawerTrigger
          render={
            <Button variant="ghost" className="flex items-center" size="xs" />
          }
        >
          <Filter className="size-3" /> Filter
        </DrawerTrigger>

        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2 font-bold">
              <Filter className="size-3" /> <span>Advanced filter</span>
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
            {Object.entries(cfg.groups).map(([key, g]) => (
              <FieldSet key={key} className="flex flex-col gap-2">
                <FieldLegend className="mb-1 text-sm font-semibold">
                  {g.label}
                </FieldLegend>
                <GroupBody
                  g={g}
                  value={draft[key]}
                  onChange={(v) => set(key, v)}
                />
              </FieldSet>
            ))}

            <FieldSet className="flex flex-col gap-2">
              <FieldLegend className="mb-1 text-sm font-semibold">
                Custom conditions
              </FieldLegend>
              <p className="text-xs text-muted-foreground">
                AND is evaluated before OR.
              </p>
              <CustomConditions cfg={cfg} rows={rows} onChange={setRows} />
            </FieldSet>
          </div>

          <DrawerFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDraft({});
                  setRows([blankRow(cfg)]);
                }}
              >
                Clear
              </Button>
              <Button
                className="flex-1"
                disabled={disabled}
                onClick={() => {
                  setAdvanced(draft, toCustom(cfg, rows));
                  setOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

/* ---------- one body per group type ---------- */

function GroupBody({
  g,
  value,
  onChange,
}: {
  g: FilterGroup;
  value: GroupValue | undefined;
  onChange: (v: GroupValue | undefined) => void;
}) {
  switch (g.type) {
    case "checkbox": {
      const v: CheckboxValue =
        value && typeof value === "object" && "picked" in value
          ? value
          : { picked: [] };
      return (
        <CheckboxBody
          g={g}
          value={v}
          onChange={(n) =>
            onChange(n.picked.length || n.other !== undefined ? n : undefined)
          }
        />
      );
    }
    case "radio":
      return (
        <RadioBody
          g={g}
          value={typeof value === "number" ? value : undefined}
          onChange={onChange}
        />
      );
    case "range":
      return (
        <RangeBody
          value={
            value && typeof value === "object" && !("picked" in value)
              ? value
              : {}
          }
          onChange={(v) =>
            onChange(v.min === undefined && v.max === undefined ? undefined : v)
          }
        />
      );
  }
}

function CheckboxBody({
  g,
  value,
  onChange,
}: {
  g: Pick<"checkbox">;
  value: CheckboxValue;
  onChange: (v: CheckboxValue) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const limit = g.visible ?? 4;
  const hasOther = g.other_option ?? false;
  const otherChecked = value.other !== undefined;

  const totalItems = g.options.length + (hasOther ? 1 : 0);
  const regularLimit = hasOther ? Math.max(0, limit - 1) : limit;
  const shown = expanded ? g.options : g.options.slice(0, regularLimit);
  // keep "Other" visible while it is in use, even when collapsed
  const showOther =
    hasOther && (expanded || g.options.length < limit || otherChecked);

  const toggle = (i: number) =>
    onChange({
      ...value,
      picked: value.picked.includes(i)
        ? value.picked.filter((x) => x !== i)
        : [...value.picked, i],
    });

  return (
    <FieldGroup className="gap-2">
      {shown.map((o, i) => {
        const id = `cb-${g.label}-${i}`;
        return (
          <Field orientation="horizontal" key={i}>
            <Checkbox
              id={id}
              checked={value.picked.includes(i)}
              onCheckedChange={() => toggle(i)}
            />
            <FieldLabel
              htmlFor={id}
              className="cursor-pointer text-sm font-normal"
            >
              {o.label}
            </FieldLabel>
          </Field>
        );
      })}

      {showOther && (
        <>
          <Field orientation="horizontal">
            <Checkbox
              id={`cb-${g.label}-other`}
              checked={otherChecked}
              onCheckedChange={(checked) =>
                onChange(
                  checked ? { ...value, other: "" } : { picked: value.picked },
                )
              }
            />
            <FieldLabel
              htmlFor={`cb-${g.label}-other`}
              className="cursor-pointer text-sm font-normal"
            >
              Other
            </FieldLabel>
          </Field>
          {otherChecked && (
            <Input
              autoFocus
              type="text"
              placeholder="Contains…"
              value={value.other}
              onChange={(e) =>
                onChange({ ...value, other: e.currentTarget.value })
              }
              className="h-8 text-sm"
            />
          )}
        </>
      )}

      {totalItems > limit && (
        <Button
          type="button"
          variant="link"
          size="xs"
          className="w-fit p-0 text-muted-foreground"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Less" : "More"}
        </Button>
      )}
    </FieldGroup>
  );
}

function RadioBody({
  g,
  value,
  onChange,
}: {
  g: Pick<"radio">;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <>
      <RadioGroup
        value={value === undefined ? "" : String(value)}
        onValueChange={(val) => onChange(val === "" ? undefined : Number(val))}
      >
        {g.options.map((o, i) => {
          const id = `radio-${g.label}-${i}`;
          return (
            <Field key={i} orientation="horizontal">
              <RadioGroupItem value={String(i)} id={id} />
              <FieldContent>
                <FieldLabel htmlFor={id} className="cursor-pointer font-normal">
                  {o.label}
                </FieldLabel>
              </FieldContent>
            </Field>
          );
        })}
      </RadioGroup>

      {value !== undefined && (
        <Button
          type="button"
          variant="link"
          size="xs"
          className="w-fit text-muted-foreground"
          onClick={() => onChange(undefined)}
        >
          Reset
        </Button>
      )}
    </>
  );
}

function RangeBody({
  value,
  onChange,
}: {
  value: RangeValue;
  onChange: (v: RangeValue) => void;
}) {
  const num = (s: string) => (s === "" ? undefined : Number(s));
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        step="any"
        placeholder="Min"
        value={value.min ?? ""}
        onChange={(e) =>
          onChange({ ...value, min: num(e.currentTarget.value) })
        }
      />
      <span className="text-muted-foreground">–</span>
      <Input
        type="number"
        step="any"
        placeholder="Max"
        value={value.max ?? ""}
        onChange={(e) =>
          onChange({ ...value, max: num(e.currentTarget.value) })
        }
      />
    </div>
  );
}

/* ---------- the old field / operator / value row, kept as an escape hatch ---------- */

/* ---------- custom conditions: form1 &| form2 &| form3 ---------- */

const OPS = {
  text: [
    ["like", "contains"],
    ["=", "equals"],
    ["!=", "not equals"],
  ],
  number: [
    ["=", "="],
    ["!=", "≠"],
    [">", ">"],
    [">=", "≥"],
    ["<", "<"],
    ["<=", "≤"],
  ],
} as const;

type Row = {
  id: number; // key stabil untuk React
  join: "&" | "|";
  field: string;
  op: string;
  value: string; // selalu string di form; dikonversi saat Apply
};

let uid = 0;
const nextId = () => ++uid;

function blankRow(cfg: FilterConfig): Row {
  const field = Object.keys(cfg.fields)[0];
  return {
    id: nextId(),
    join: "&",
    field,
    op: OPS[cfg.fields[field].type][0][0],
    value: "",
  };
}

function toRows(cfg: FilterConfig, custom: FilterState["custom"]): Row[] {
  if (!custom.length) return [blankRow(cfg)];
  return custom.map(({ join, cond: [field, op, v] }) => ({
    id: nextId(),
    join,
    field,
    op,
    value: String(v),
  }));
}

/** Baris kosong / angka tidak valid dilewati. */
function toCustom(cfg: FilterConfig, rows: Row[]): FilterState["custom"] {
  const out: FilterState["custom"] = [];
  for (const r of rows) {
    const raw = r.value.trim();
    if (!raw) continue;
    const value = cfg.fields[r.field].type === "number" ? Number(raw) : raw;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    out.push({
      join: out.length ? r.join : "&",
      cond: [r.field, r.op as FilterOperator, value],
    });
  }
  return out;
}

function CustomConditions({
  cfg,
  rows,
  onChange,
}: {
  cfg: FilterConfig;
  rows: Row[];
  onChange: (rows: Row[]) => void;
}) {
  const patch = (id: number, p: Partial<Row>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const last = rows[rows.length - 1];

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div key={r.id} className="flex flex-col gap-2">
          {i > 0 && (
            <JoinToggle
              value={r.join}
              onChange={(join) => patch(r.id, { join })}
            />
          )}
          <ConditionRow
            cfg={cfg}
            row={r}
            onPatch={(p) => patch(r.id, p)}
            onRemove={
              rows.length > 1
                ? () => onChange(rows.filter((x) => x.id !== r.id))
                : undefined
            }
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={
          rows.length >= MAX_CUSTOM_ROWS || !last || last.value.trim() === ""
        }
        onClick={() => onChange([...rows, blankRow(cfg)])}
      >
        <Plus className="size-3" /> Add condition
      </Button>
    </div>
  );
}

function JoinToggle({
  value,
  onChange,
}: {
  value: "&" | "|";
  onChange: (v: "&" | "|") => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-border" />
      {(["&", "|"] as const).map((j) => (
        <Button
          key={j}
          type="button"
          size="xs"
          variant={value === j ? "default" : "outline"}
          onClick={() => onChange(j)}
        >
          {j === "&" ? "AND" : "OR"}
        </Button>
      ))}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function ConditionRow({
  cfg,
  row,
  onPatch,
  onRemove,
}: {
  cfg: FilterConfig;
  row: Row;
  onPatch: (p: Partial<Row>) => void;
  onRemove?: () => void;
}) {
  const keys = Object.keys(cfg.fields);
  const type = cfg.fields[row.field].type;
  const ops: readonly (readonly [string, string])[] = OPS[type];
  const opKeys = ops.map(([v]) => v);
  const opLabel = (v: string) => ops.find(([x]) => x === v)?.[1] ?? v;

  return (
    <div className="flex flex-col gap-2 rounded-md border p-2">
      <Combobox
        items={keys}
        itemToStringLabel={(k) => cfg.fields[k]?.label ?? k}
        value={row.field}
        onValueChange={(val) => {
          if (!val) return;
          onPatch({
            field: val,
            op: OPS[cfg.fields[val].type][0][0], // operator ikut tipe field
            value: "",
          });
        }}
      >
        <ComboboxInput placeholder="Field" />
        <ComboboxContent>
          <ComboboxEmpty>No fields found.</ComboboxEmpty>
          <ComboboxList>
            {(k) => (
              <ComboboxItem key={k} value={k}>
                {cfg.fields[k].label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <div className="flex items-center gap-2">
        <div className="w-36 shrink-0">
          <Combobox
            items={opKeys}
            itemToStringValue={opLabel}
            value={row.op}
            onValueChange={(val) => val && onPatch({ op: val })}
          >
            <ComboboxInput placeholder="Operator" />
            <ComboboxContent>
              <ComboboxList>
                {(k) => (
                  <ComboboxItem key={k} value={k}>
                    {opLabel(k)}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <Input
          type={type === "number" ? "number" : "text"}
          step="any"
          placeholder="Value"
          value={row.value}
          onChange={(e) => onPatch({ value: e.currentTarget.value })}
        />

        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Remove condition"
            onClick={onRemove}
          >
            <X />
          </Button>
        )}
      </div>
    </div>
  );
}
