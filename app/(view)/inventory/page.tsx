import { Suspense } from "react";
import { getInventoryPage } from "@/features/inventory/queries";
import {
  INVENTORY_DEFAULTS,
  INVENTORY_FIELDS,
} from "@/features/inventory/definitions";
import {
  createDomain,
  DomainItem,
  resolveFilters,
  type SearchParamsObj,
} from "@/lib/filter";
import { FilterBadges, SearchProduct } from "./filtering";
import { Table } from "./table";

type SP = SearchParamsObj & { page?: string; q?: string };

export default function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const domain: DomainItem = [
    "|",
    "&",
    ["field_a", "=", 1],
    ["field_b", "=", 2],
    ["field_c", "=", 3],
  ];
  const encode = encodeURIComponent(JSON.stringify(domain));
  const decode = decodeURI(encode);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex justify-between">
        <div className="text-xl font-semibold">Inventory Report</div>
        {/* useSearchParams di client component wajib di dalam Suspense */}
        <Suspense fallback={<div className="h-9 w-72" />}>
          <SearchProduct />
        </Suspense>
      </div>

      <div>
        <pre>
          <code>{encode}</code>
          <br />
          <code>{decode}</code>
        </pre>
      </div>

      <Suspense fallback={<InventorySkeleton />}>
        <InventoryResult searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function InventoryResult({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(pageParam) || 1);
  const search = typeof sp.search === "string" ? sp.search : "";

  // const { nodes, badges } = resolveFilters(
  //   sp,
  //   INVENTORY_FIELDS,
  //   INVENTORY_DEFAULTS,
  // );

  // if (q) {
  //   badges.unshift({
  //     id: "q",
  //     field: "product",
  //     op: "~",
  //     text: q,
  //     remove: { key: "q", raw: null, next: null },
  //   });
  // }
  // const
  // const domain = createDomain(nodes);
  const domain = search ? JSON.parse(decodeURI(search)) : [];

  const { rows: data, ...meta } = await getInventoryPage({
    filter: { domain: domain || [] },
    page,
  });

  return (
    <>
      {/* {badges.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <FilterBadges badges={badges} />
        </div>
      )} */}

      {process.env.NODE_ENV === "development" && (
        <pre className="text-xs">
          <code>{JSON.stringify(domain)}</code>
        </pre>
      )}

      <Table data={data} meta={meta} />
    </>
  );
}

function InventorySkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}
