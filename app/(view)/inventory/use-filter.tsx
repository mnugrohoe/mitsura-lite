"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import type { FilterCondition } from "@/lib/filter";
import { searchInventory, type InventoryResult } from "./actions";
import { DEFAULT_STATE, TEMPLATES, type FilterState } from "./filters";

export function useInventoryFilter(initial: InventoryResult) {
  const [data, setData] = useState(initial);
  const [pending, start] = useTransition();
  const { state } = data; // selalu hasil sanitize dari server

  const apply = (next: FilterState, page = 1) =>
    start(async () => setData(await searchInventory(next, page)));

  const toggleTemplate = (key: string) =>
    apply({
      ...state,
      templates: state.templates.includes(key)
        ? state.templates.filter((k) => k !== key)
        : [...state.templates, key],
    });

  const addCustom = (c: FilterCondition) =>
    apply({ ...state, custom: [...state.custom, c] });

  const removeCustom = (i: number) =>
    apply({ ...state, custom: state.custom.filter((_, j) => j !== i) });

  const badges = [
    ...state.templates.map((key) => ({
      id: `t-${key}`,
      text: TEMPLATES[key].label,
      remove: () => toggleTemplate(key),
    })),
    ...state.custom.map(([field, op, value], i) => ({
      id: `c-${i}`,
      text: `${field} ${op === "like" || op === "ilike" ? "~" : op} ${value}`,
      remove: () => removeCustom(i),
    })),
  ];

  return {
    data,
    state,
    pending,
    badges,
    apply, // apply(state, page): dipakai juga untuk paging & saved filter
    toggleTemplate,
    addCustom,
    removeCustom,
    reset: () => apply(DEFAULT_STATE),
  };
}

/* ---------- saved filter (= Favorites Odoo), disimpan di browser ---------- */

type SavedFilter = { id: string; name: string; state: FilterState };
const KEY = "inventory:saved-filters";
const EMPTY_FILTERS: SavedFilter[] = [];
let savedFiltersSnapshot: SavedFilter[] | undefined;
const savedFilterListeners = new Set<() => void>();

function getSavedFilters() {
  if (savedFiltersSnapshot === undefined) {
    try {
      savedFiltersSnapshot = JSON.parse(
        localStorage.getItem(KEY) ?? "[]",
      ) as SavedFilter[];
    } catch {
      savedFiltersSnapshot = EMPTY_FILTERS;
    }
  }
  return savedFiltersSnapshot;
}

function subscribeSavedFilters(listener: () => void) {
  savedFilterListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) {
      savedFiltersSnapshot = undefined;
      for (const notify of savedFilterListeners) notify();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    savedFilterListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSavedFilters() {
  const list = useSyncExternalStore(
    subscribeSavedFilters,
    getSavedFilters,
    () => EMPTY_FILTERS,
  );

  const persist = (next: SavedFilter[]) => {
    savedFiltersSnapshot = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    for (const notify of savedFilterListeners) notify();
  };

  return {
    list,
    save: (name: string, state: FilterState) =>
      persist([...list, { id: crypto.randomUUID(), name, state }]),
    remove: (id: string) => persist(list.filter((f) => f.id !== id)),
  };
}
