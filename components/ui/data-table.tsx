"use client";

import { useTable, type ColumnDef, type RowData } from "@tanstack/react-table";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

import { features, type DataTableFeatures } from "@/lib/data-table-features";
import { Pagination, type PaginationProps } from "./pagination";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  /** id of the column that takes the leftover width (default: last column) */
  growColumn?: string;
  pagination?: PaginationProps;
  isPending?: boolean;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  pagination,
  isPending = false,
}: DataTableProps<TData>) {
  const table = useTable({ features, data, columns });

  const rows = table.getRowModel().rows;
  const headers = table.getHeaderGroups()[0]?.headers ?? [];
  const minOf = (h: (typeof headers)[number]) =>
    h.column.columnDef.minSize ?? 40;

  const rowStyle = {
    gridTemplateColumns: headers
      .map((h, i) =>
        i === headers.length - 1
          ? `minmax(${h.getSize()}px, 1fr)` // kolom terakhir menyerap sisa
          : `${h.getSize()}px`,
      )
      .join(" "),
  };

  const minTableWidth = headers.reduce((sum, h) => sum + minOf(h), 0);
  const skeletonRowCount = pagination?.meta?.pageSize ?? 10;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
      <table
        role="table"
        style={{ minWidth: minTableWidth }}
        className="flex min-h-0 w-full flex-1 flex-col text-sm"
      >
        <TableHeader
          role="rowgroup"
          className="block shrink-0 overflow-y-hidden"
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              role="row"
              className="grid items-center bg-blue-100"
              style={rowStyle}
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  role="columnheader"
                  className="flex items-center font-semibold"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {!isPending ? (
                      header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )
                    ) : (
                      <Skeleton className="w-full h-full" />
                    )}
                  </span>
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className="w-1 shrink-0 cursor-col-resize select-none self-stretch touch-none hover:bg-blue-400"
                  />
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody
          role="rowgroup"
          className="block min-h-0 flex-1 overflow-y-auto"
        >
          {isPending ? (
            // Render skeleton rows matching pageSize
            Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
              <TableRow
                key={`skeleton-row-${rowIndex}`}
                role="row"
                className="grid not-odd:bg-gray-100"
                style={rowStyle}
              >
                {headers.map((header) => (
                  <TableCell
                    key={`skeleton-cell-${header.id}`}
                    role="cell"
                    className="flex items-center min-w-0 truncate"
                  >
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow
                key={row.id}
                role="row"
                data-state={row.getIsSelected() && "selected"}
                className="grid not-odd:bg-gray-100"
                style={rowStyle}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    role="cell"
                    className="min-w-0 truncate"
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow role="row" className="grid">
              <TableCell role="cell" className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        {pagination && (
          <TableFooter role="rowgroup" className="block shrink-0">
            <TableRow role="row" className="grid place-content-end">
              <TableCell role="cell">
                <div className="flex gap-2 items-center">
                  <div className="tubular-nums">
                    {pagination.meta.total === 0
                      ? "0 - 0"
                      : `${(pagination.meta.page - 1) * pagination.meta.pageSize + 1} - ${Math.min(
                          pagination.meta.page * pagination.meta.pageSize,
                          pagination.meta.total,
                        )}`}
                    {" / "}
                    {pagination.meta.total}
                  </div>
                  <Separator orientation="vertical" />
                  <Pagination {...pagination} />
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </table>
    </div>
  );
}
