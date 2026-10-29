import * as React from "react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import Link from "next/link";

function PaginationWrapper({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">;

function PaginationLink({
  className,
  isActive,
  href = "#",
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={
        <Link
          aria-current={isActive ? "page" : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          href={href}
          {...props}
        />
      }
    />
  );
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("pl-1.5!", className)}
      {...props}
    >
      <ChevronLeftIcon data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("pr-1.5!", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon data-icon="inline-end" />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">More pages</span>
    </span>
  );
}

// ================================== utils ==
type PaginationItemType = number | "ellipsis";

function generatePagination(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1,
): PaginationItemType[] {
  const totalPageNumbers = siblingCount + 5;

  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis", lastPageIndex];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1,
    );
    return [firstPageIndex, "ellipsis", ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i,
    );
    return [
      firstPageIndex,
      "ellipsis",
      ...middleRange,
      "ellipsis",
      lastPageIndex,
    ];
  }

  return [];
}
export interface Meta {
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationProps {
  meta: Meta;
  onChange: (page: number) => void;
  siblingCount?: number;
  disabled?: boolean;
  hideNextButton?: boolean;
  hidePrevButton?: boolean;
  showFirstButton?: boolean;
  showLastButton?: boolean;
}

function Pagination({
  meta = {
    total: 0,
    page: 1,
    pageSize: 50,
  },
  onChange,
  disabled = false,
  siblingCount = 1,
  hideNextButton = true,
  hidePrevButton = true,
}: PaginationProps) {
  const { page, total, pageSize } = meta;
  const count = Math.ceil(total / pageSize);
  const paginationRange = generatePagination(page, count, siblingCount);

  if (count <= 1) return null;

  return (
    <PaginationWrapper>
      <PaginationContent>
        {/* Tombol Previous */}
        {!hidePrevButton && (
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (page > 1 && !disabled) onChange?.(page - 1);
              }}
              // Tambahkan logic disabled styling jika perlu
            />
          </PaginationItem>
        )}

        {/* Render Halaman dan Ellipsis secara Dinamis */}
        {paginationRange.map((pageNumber, index) => {
          if (pageNumber === "ellipsis") {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          const isActive = pageNumber === page;

          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href="#"
                isActive={isActive}
                onClick={(e) => {
                  e.preventDefault();
                  if (!disabled) onChange?.(pageNumber as number);
                }}
                className={cn(isActive && "bg-blue-100", "hover:bg-blue-50")}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {/* Tombol Next */}
        {!hideNextButton && (
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (page < count && !disabled) onChange?.(page + 1);
              }}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </PaginationWrapper>
  );
}

export {
  Pagination,
  PaginationWrapper,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
