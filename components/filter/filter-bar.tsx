"use client";
import { useState } from "react";
import { Search, Star, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FilterConfig } from "@/lib/filter-config";
import type { useFilter } from "./use-filter";
import { AdvancedFilter } from "./advanced-filter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function FilterBar({
  cfg,
  filter,
}: {
  cfg: FilterConfig;
  filter: ReturnType<typeof useFilter>;
}) {
  const [kw, setKw] = useState("");
  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Searchbar form taking 100% width */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          filter.setSearch(kw.trim());
          setKw("");
        }}
        className="w-full"
      >
        <InputGroup className="w-full">
          <InputGroupInput
            placeholder="Search..."
            value={kw}
            onChange={(e) => setKw(e.currentTarget.value)}
          />
          <InputGroupAddon>
            {/* Active Filter Badges */}
            <div className="flex flex-wrap gap-2 items-center">
              {filter.badges.map((b) => (
                <Badge key={b.id} variant="outline" className="gap-1">
                  {b.label}
                  <Button
                    onClick={b.remove}
                    aria-label="Remove filter"
                    className="bg-transparant text-current hover:bg-transparent hover:text-red-500 p-0.5"
                  >
                    <X className="size-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </InputGroupAddon>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
      </form>

      {/* Advanced Filter & Template buttons grouped together (justify-start) */}
      <div className="flex flex-wrap items-center gap-2">
        <AdvancedFilter
          cfg={cfg}
          onAdd={filter.addCustom}
          disabled={filter.pending}
        />
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="sm" className="gap-2">
              <Star className="size-4" /> Favorite
            </Button>
          </DropdownMenuTrigger>
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
      </div>
    </div>
  );
}
