"use client";
import { useState } from "react";
import { Filter } from "lucide-react";
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
import type { FilterConfig, FilterState } from "@/lib/filter-config";

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

export function AdvancedFilter({
  cfg,
  onAdd,
  disabled,
}: {
  cfg: FilterConfig;
  onAdd: (c: FilterState["custom"][number]) => void;
  disabled?: boolean;
}) {
  const keys = Object.keys(cfg.fields);
  const [open, setOpen] = useState(false);
  const [field, setField] = useState(keys[0]);
  const type = cfg.fields[field].type;
  const [op, setOp] = useState<string>(OPS[type][0][0]);
  const [value, setValue] = useState("");

  const add = () => {
    const v = type === "number" ? Number(value) : value.trim();
    if (v === "" || (type === "number" && !Number.isFinite(v))) return;
    onAdd([field, op as never, v]);
    setValue("");
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
      <DrawerTrigger
        render={<Button variant="ghost" className="flex items-center" />}
      >
        <Filter className="size-4" /> Filter
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Advanced filter</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-2 p-4">
          <select
            className="h-9 rounded-md border px-2 text-sm"
            value={field}
            onChange={(e) => {
              setField(e.target.value);
              setOp(OPS[cfg.fields[e.target.value].type][0][0]);
              setValue("");
            }}
          >
            {keys.map((k) => (
              <option key={k} value={k}>
                {cfg.fields[k].label}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border px-2 text-sm"
            value={op}
            onChange={(e) => setOp(e.target.value)}
          >
            {OPS[type].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <Input
            type={type === "number" ? "number" : "text"}
            step="any"
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
          />
        </div>
        <DrawerFooter>
          <Button disabled={disabled} onClick={add}>
            Add filter
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
