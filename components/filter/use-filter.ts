"use client";
import { useState, useTransition } from "react";
import {
  defaultState,
  describeGroup,
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

  const opSymbol = (op: string) =>
    op === "=" || op === "like" || op === "ilike" ? ":" : op;

  const customLabel = state.custom
    .map(({ join, cond: [f, op, v] }, i) => {
      const link = i === 0 ? "" : join === "|" ? " or " : " and ";
      return `${link}${cfg.fields[f]?.label ?? f}${opSymbol(op)}${v}`;
    })
    .join("");

  const badges = [
    ...state.templates.map((k) => ({
      id: `t-${k}`,
      label: cfg.templates[k].label,
      remove: () => toggleTemplate(k),
    })),
    ...Object.entries(state.groups).flatMap(([k, v]) => {
      const g = cfg.groups[k];
      if (!g) return [];
      return [
        {
          id: `g-${k}`,
          label: describeGroup(g, v),
          remove: () =>
            apply({
              ...state,
              groups: Object.fromEntries(
                Object.entries(state.groups).filter(([x]) => x !== k),
              ),
            }),
        },
      ];
    }),
    ...(state.search.length
      ? [
          {
            id: "q",
            label: `Search: ${state.search.join(" or ")}`,
            remove: () => apply({ ...state, search: [] }),
          },
        ]
      : []),
    ...(state.custom.length
      ? [
          {
            id: "c",
            label: customLabel,
            remove: () => apply({ ...state, custom: [] }),
          },
        ]
      : []),
  ];

  return {
    data,
    state,
    pending,
    badges,
    apply,
    toggleTemplate,
    setSearch: (term: string) => {
      const t = term.trim();
      if (!t || state.search.some((s) => s.toLowerCase() === t.toLowerCase())) {
        return;
      }
      apply({ ...state, search: [...state.search, t] });
    },
    setAdvanced: (
      groups: FilterState["groups"],
      custom: FilterState["custom"],
    ) => apply({ ...state, groups, custom }),
    goToPage: (page: number) => apply(state, page),
    reset: () => apply(defaultState(cfg)),
  };
}
