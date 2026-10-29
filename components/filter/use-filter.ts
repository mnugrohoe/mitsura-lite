"use client";
import { useState, useTransition } from "react";
import {
  defaultState,
  type FilterConfig,
  type FilterState,
} from "@/lib/filter-config";

export function useFilter<R extends { state: FilterState }>(
  cfg: FilterConfig,
  initial: R,
  action: (s: FilterState, page: number) => Promise<R>,
) {
  const [data, setData] = useState(initial);
  const [pending, start] = useTransition();
  const { state } = data; // always the server-sanitized state

  const apply = (next: FilterState, page = 1) =>
    start(async () => setData(await action(next, page)));

  const toggleTemplate = (k: string) =>
    apply({
      ...state,
      templates: state.templates.includes(k) ? [] : [k],
    });

  const badges = [
    ...state.templates.map((k) => ({
      id: `t-${k}`,
      label: cfg.templates[k].label,
      remove: () => toggleTemplate(k),
    })),
    ...(state.search
      ? [
          {
            id: "q",
            label: `Search: ${state.search}`,
            remove: () => apply({ ...state, search: "" }),
          },
        ]
      : []),
    ...state.custom.map(([f, op, v], i) => ({
      id: `c-${i}`,
      label: `${cfg.fields[f]?.label ?? f} ${op === "like" || op === "ilike" ? "~" : op} ${v}`,
      remove: () =>
        apply({ ...state, custom: state.custom.filter((_, j) => j !== i) }),
    })),
  ];

  return {
    data,
    state,
    pending,
    badges,
    apply,
    toggleTemplate,
    setSearch: (search: string) => apply({ ...state, search }),
    addCustom: (c: FilterState["custom"][number]) =>
      apply({ ...state, custom: [...state.custom, c] }),
    goToPage: (page: number) => apply(state, page),
    reset: () => apply(defaultState(cfg)),
  };
}
